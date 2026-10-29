"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.withOmetriaIos = void 0;
exports.shouldAddFirebaseConfigure = shouldAddFirebaseConfigure;
exports.addFirebaseConfigure = addFirebaseConfigure;
const config_plugins_1 = require("@expo/config-plugins");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const withNotificationServiceExtension_1 = require("./withNotificationServiceExtension");
const PRODUCTION_PROFILES = new Set([
    'production',
    'release',
    'staging',
    'preview',
    'qa',
    'testflight',
]);
const DEVELOPMENT_PROFILES = new Set(['development', 'dev', 'debug', 'local']);
function resolveApsEnvironment(explicit) {
    if (explicit) {
        return explicit;
    }
    const overrideEnv = process.env.OMETRIA_APS_ENVIRONMENT;
    if (overrideEnv === 'development' || overrideEnv === 'production') {
        return overrideEnv;
    }
    let unrecongnisedProfile;
    for (const envVar of ['EAS_BUILD_PROFILE', 'EXPO_PUBLIC_APP_ENV']) {
        const value = process.env[envVar]?.toLowerCase();
        if (!value)
            continue;
        if (PRODUCTION_PROFILES.has(value))
            return 'production';
        if (DEVELOPMENT_PROFILES.has(value))
            return 'development';
        unrecongnisedProfile = value;
    }
    // Not on EAS — local prebuild. Xcode overrides aps-environment from the
    // provisioning profile at build time, so the value here doesn't matter.
    // Default silently to development.
    if (!process.env.EAS_BUILD) {
        return 'development';
    }
    const profileHint = unrecongnisedProfile
        ? ` (unrecognised EAS profile: "${unrecongnisedProfile}")`
        : '';
    console.warn(`[react-native-ometria] Could not determine APNs environment from build context${profileHint}. ` +
        'Defaulting aps-environment to "production". ' +
        'Set apsEnvironment in the plugin config or OMETRIA_APS_ENVIRONMENT env var to silence this warning.');
    return 'production';
}
/**
 * Adds push notification and app group entitlements to the main app
 */
const withOmetriaEntitlements = (config, props) => {
    return (0, config_plugins_1.withEntitlementsPlist)(config, (modConfig) => {
        // Add push notification entitlement
        modConfig.modResults['aps-environment'] = props.apsEnvironment;
        // Add app group entitlement only if appGroupIdentifier is provided (for NSE)
        if (props.appGroupIdentifier) {
            const appGroups = modConfig.modResults['com.apple.security.application-groups'];
            if (Array.isArray(appGroups)) {
                if (!appGroups.includes(props.appGroupIdentifier)) {
                    appGroups.push(props.appGroupIdentifier);
                }
            }
            else {
                modConfig.modResults['com.apple.security.application-groups'] = [
                    props.appGroupIdentifier,
                ];
            }
        }
        return modConfig;
    });
};
/**
 * Writes the default appGroupIdentifier to Info.plist for Expo apps.
 * The native SDK reads this as a fallback when no appGroupIdentifier is passed at runtime.
 */
const withOmetriaInfoPlist = (config, props) => {
    return (0, config_plugins_1.withInfoPlist)(config, (modConfig) => {
        // Only write if NSE is enabled and we have an appGroupIdentifier
        if (!props.skipNSE && props.appGroupIdentifier) {
            modConfig.modResults['OmetriaExpoDefaultAppGroupIdentifier'] =
                props.appGroupIdentifier;
        }
        // Write RN SDK version so native code can read it instead of using a hardcoded value
        modConfig.modResults['OmetriaRNSdkVersion'] = props.rnSdkVersion;
        return modConfig;
    });
};
/**
 * Modifies the Podfile to add Ometria-specific configurations
 */
const withOmetriaPodfile = (config, props) => {
    return (0, config_plugins_1.withPodfile)(config, (modConfig) => {
        // Remind about the iOS settings React Native Firebase needs with Ometria 2.x
        if (hasReactNativeFirebase(modConfig.modRequest.projectRoot)) {
            console.warn('[react-native-ometria] React Native Firebase detected. On iOS, Ometria 2.x needs static linking: ' +
                'set "useFrameworks": "static" and "forceStaticLinking": ["RNFBApp", "RNFBMessaging"] in expo-build-properties, ' +
                'and with React Native Firebase 26.1 or later also set { "ios": { "disableSPM": true } } on the ' +
                '"@react-native-firebase/app" plugin. React Native Firebase 27 needs react-native-ometria 3.0. ' +
                'See: https://mobile-sdk.docs.ometria.com/react-native/installation');
        }
        let podfile = modConfig.modResults.contents;
        // Add TurboModule script require at the top (after other requires)
        podfile = addTurboModuleRequire(podfile);
        // Add patch_ometria_turbomodule call in post_install
        podfile = addTurboModulePatch(podfile);
        // Add old architecture modulemap fix in post_install
        podfile = addOldArchModulemapFix(podfile);
        // Add NSE target for rich push notifications (only if not skipped)
        if (!props.skipNSE) {
            podfile = addNotificationServiceTarget(podfile, props.ometriaIosSdkVersion);
        }
        modConfig.modResults.contents = podfile;
        return modConfig;
    });
};
function hasReactNativeFirebase(projectRoot) {
    try {
        const pkgPath = path.join(projectRoot, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) ?? {};
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        return Boolean(deps['@react-native-firebase/app']);
    }
    catch {
        // ignore — package.json unreadable
        return false;
    }
}
/**
 * Makes sure FirebaseApp.configure() runs at launch on Expo apps using React Native Firebase.
 *
 * Problem: Expo SDK 58 moved to a scene-based AppDelegate (SceneDelegate starts React Native).
 * @react-native-firebase/app's config plugin up to 26.x looks for `factory.startReactNative(`,
 * doesn't find it and skips FirebaseApp.configure() with only a prebuild warning, so Firebase
 * never initialises and no FCM token is issued. The fix only ships in RNFB 27, which Ometria 2.x
 * can't use (RNFB 27 is SPM-only).
 *
 * Solution: insert the call ourselves when it's missing, using the same anchors as RNFB 27.
 * If RNFB's plugin already inserted it (Expo <= 57, or RNFB 27+), this is a no-op.
 */
const withOmetriaFirebaseConfigure = (config) => {
    return (0, config_plugins_1.withAppDelegate)(config, (modConfig) => {
        if (!shouldAddFirebaseConfigure(modConfig.modResults.language, modConfig.ios?.googleServicesFile, modConfig.modRequest.projectRoot)) {
            return modConfig;
        }
        const contents = addFirebaseConfigure(modConfig.modResults.contents);
        if (contents !== modConfig.modResults.contents) {
            console.log('[react-native-ometria] Added FirebaseApp.configure() to AppDelegate.swift ' +
                '(the @react-native-firebase/app plugin skipped it; its "Skipping Firebase addition" warning can be ignored).');
        }
        modConfig.modResults.contents = contents;
        return modConfig;
    });
};
/**
 * Only Swift AppDelegates of apps that use React Native Firebase with a GoogleService-Info.plist
 * get FirebaseApp.configure(); without the plist, configure() would crash at launch.
 */
function shouldAddFirebaseConfigure(language, googleServicesFile, projectRoot) {
    return (language === 'swift' &&
        Boolean(googleServicesFile) &&
        hasReactNativeFirebase(projectRoot));
}
const FIREBASE_CONFIGURE_ANCHOR = /(?:self\.moduleName\s*=\s*"[^"]*")|(?:factory\.startReactNative\()|(?:return\s+super\.application\(\s*application\s*,\s*didFinishLaunchingWithOptions:\s*launchOptions\s*\))/;
// `import FirebaseCore` or the `Firebase` umbrella, with any attributes or access level
const FIREBASE_IMPORT = /^[ \t]*(?:@\w+[ \t]+)*(?:(?:public|package|internal|fileprivate|private)[ \t]+)?import[ \t]+(?:FirebaseCore|Firebase)\b/m;
function addFirebaseConfigure(appDelegate) {
    if (/FirebaseApp\.configure\(/.test(appDelegate)) {
        return appDelegate;
    }
    const anchor = appDelegate.match(FIREBASE_CONFIGURE_ANCHOR);
    if (!anchor || anchor.index === undefined) {
        console.warn('[react-native-ometria] Could not find where to add FirebaseApp.configure() in AppDelegate.swift. ' +
            'Add it manually to application(_:didFinishLaunchingWithOptions:), otherwise push notifications will not work.');
        return appDelegate;
    }
    const lineStart = appDelegate.lastIndexOf('\n', anchor.index) + 1;
    const indent = appDelegate.slice(lineStart).match(/^[ \t]*/)?.[0] ?? '';
    let contents = appDelegate.slice(0, lineStart) +
        `${indent}// [Ometria] Configure Firebase (RNFB <= 26 skips this on Expo 58+)\n` +
        `${indent}if FirebaseApp.app() == nil {\n` +
        `${indent}  FirebaseApp.configure()\n` +
        `${indent}}\n` +
        appDelegate.slice(lineStart);
    if (!FIREBASE_IMPORT.test(contents)) {
        const importAnchor = contents.match(/^[ \t]*(?:internal\s+)?import\s+Expo[ \t]*$/m) ??
            contents.match(/^[ \t]*import\b[^\r\n]*$/m);
        if (importAnchor && importAnchor.index !== undefined) {
            const insertIndex = importAnchor.index + importAnchor[0].length;
            contents =
                contents.slice(0, insertIndex) +
                    '\nimport FirebaseCore' +
                    contents.slice(insertIndex);
        }
        else {
            contents = `import FirebaseCore\n${contents}`;
        }
    }
    return contents;
}
function addTurboModuleRequire(podfile) {
    const requireStatement = "require_relative '../node_modules/react-native-ometria/scripts/ometria_turbomodule'";
    if (podfile.includes('ometria_turbomodule')) {
        return podfile;
    }
    // Find a good place to insert - after platform declaration or after other requires
    const platformMatch = podfile.match(/platform :ios.*\n/);
    if (platformMatch) {
        const insertIndex = (platformMatch.index || 0) + platformMatch[0].length;
        return (podfile.slice(0, insertIndex) +
            `\n# [Ometria] TurboModule registration for New Architecture\n${requireStatement}\n` +
            podfile.slice(insertIndex));
    }
    // Fallback: add at the beginning
    return `# [Ometria] TurboModule registration for New Architecture\n${requireStatement}\n\n${podfile}`;
}
function addTurboModulePatch(podfile) {
    if (podfile.includes('patch_ometria_turbomodule')) {
        return podfile;
    }
    // Find post_install block and add the patch call
    const postInstallMatch = podfile.match(/post_install do \|installer\|/);
    if (postInstallMatch && postInstallMatch.index !== undefined) {
        const insertIndex = postInstallMatch.index + postInstallMatch[0].length;
        return (podfile.slice(0, insertIndex) +
            '\n    # [Ometria] Register TurboModule for New Architecture\n    patch_ometria_turbomodule(installer)\n' +
            podfile.slice(insertIndex));
    }
    console.warn('[Ometria] Could not find post_install block in Podfile. ' +
        'TurboModule patch may need to be added manually.');
    return podfile;
}
/**
 * Adds modulemap fix for old architecture compatibility with use_modular_headers!
 *
 * Problem: When using use_modular_headers! + old architecture + RN 0.81+,
 * multiple modulemaps in the same directory define identical module names with
 * umbrella headers, causing "Redefinition of module" build errors.
 *
 * Solution: Replace conflicting modulemaps with empty modules (different names, no umbrella)
 * This fix is only applied when newArchEnabled is false.
 */
function addOldArchModulemapFix(podfile) {
    if (podfile.includes('react_jsitooling') &&
        podfile.includes('react_runtimeapple')) {
        return podfile;
    }
    const modulemapFix = `
    # [Ometria] Fix modulemap redefinition errors when using use_modular_headers! + old arch + RN 0.81+
    # Problem: Multiple modulemaps in same directory define identical module names with umbrella headers
    # Solution: Replace conflicting modulemaps with empty modules (different names, no umbrella)
    if podfile_properties['newArchEnabled'] == 'false'
      # Fix 1: react_runtime module redefinition (React-jsitooling vs React-RuntimeCore)
      jsitooling_path = "#{installer.sandbox.root}/Target Support Files/React-jsitooling/React-jsitooling.modulemap"
      if File.exist?(jsitooling_path)
        File.write(jsitooling_path, "module react_jsitooling {\\n}\\n")
        puts "[Ometria] Fixed React-jsitooling.modulemap (react_runtime conflict)"
      end

      # Fix 2: ReactCommon module redefinition (React-RuntimeApple vs ReactCommon)
      runtimeapple_path = "#{installer.sandbox.root}/Target Support Files/React-RuntimeApple/React-RuntimeApple.modulemap"
      if File.exist?(runtimeapple_path)
        File.write(runtimeapple_path, "module react_runtimeapple {\\n}\\n")
        puts "[Ometria] Fixed React-RuntimeApple.modulemap (ReactCommon conflict)"
      end
    end
`;
    // Find react_native_post_install and its closing parenthesis
    // The function call spans multiple lines, so we need to find the matching closing )
    const postInstallStart = podfile.indexOf('react_native_post_install(');
    if (postInstallStart !== -1) {
        // Count parentheses to find the matching closing )
        let depth = 0;
        let foundStart = false;
        let endIndex = -1;
        for (let i = postInstallStart; i < podfile.length; i++) {
            if (podfile[i] === '(') {
                depth++;
                foundStart = true;
            }
            else if (podfile[i] === ')') {
                depth--;
                if (foundStart && depth === 0) {
                    endIndex = i;
                    break;
                }
            }
        }
        if (endIndex !== -1) {
            // Find the end of the line after the closing )
            const lineEnd = podfile.indexOf('\n', endIndex);
            if (lineEnd !== -1) {
                return (podfile.slice(0, lineEnd + 1) +
                    modulemapFix +
                    podfile.slice(lineEnd + 1));
            }
        }
    }
    console.warn('[Ometria] Could not find react_native_post_install in Podfile. ' +
        'Old architecture modulemap fix may need to be added manually.');
    return podfile;
}
function addNotificationServiceTarget(podfile, sdkVersion) {
    if (podfile.includes("target 'OmetriaNotificationServiceExtension'")) {
        return podfile;
    }
    // Use a standalone target with inherit! :search_paths
    // This tells CocoaPods to inherit search paths from the implicit parent
    // without requiring strict host target verification in the Xcode project
    //
    // Mirror the main target's use_frameworks! setting so CocoaPods doesn't
    // complain that the host and extension targets don't match.
    const nseTarget = `
# [Ometria] Notification Service Extension for rich push notifications
target 'OmetriaNotificationServiceExtension' do
  inherit! :search_paths
  use_modular_headers!
  use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']
  pod 'Ometria', '~> ${sdkVersion}'
end
`;
    // Add at the end of the file (outside main target)
    return podfile + nseTarget;
}
/**
 * Main iOS configuration for Ometria
 */
const withOmetriaIos = (config, props) => {
    const { skipNSE, ometriaIosSdkVersion } = props;
    if (skipNSE) {
        console.warn('⚠️  [react-native-ometria] skipNSE is enabled. Rich push notification content (images, etc.) will not work on iOS.');
    }
    // Use custom appGroupIdentifier if provided, otherwise auto-generate from bundleIdentifier
    const bundleIdentifier = config.ios?.bundleIdentifier;
    if (!bundleIdentifier && !skipNSE && !props.customAppGroupIdentifier) {
        throw new Error('[react-native-ometria] ios.bundleIdentifier is required in app.json/app.config.js for NSE setup. ' +
            'Either set ios.bundleIdentifier, provide customAppGroupIdentifier, or use skipNSE: true to skip rich notifications.');
    }
    const appGroupIdentifier = props.customAppGroupIdentifier ??
        (bundleIdentifier ? `group.${bundleIdentifier}` : undefined);
    const internalProps = {
        appGroupIdentifier,
        ometriaIosSdkVersion,
        skipNSE,
        rnSdkVersion: props.rnSdkVersion,
        apsEnvironment: resolveApsEnvironment(props.apsEnvironment),
    };
    // Add entitlements
    config = withOmetriaEntitlements(config, internalProps);
    // Write default appGroupIdentifier to Info.plist for Expo auto-configuration
    config = withOmetriaInfoPlist(config, internalProps);
    // Modify Podfile
    config = withOmetriaPodfile(config, internalProps);
    // Make sure Firebase is configured at launch (RNFB <= 26 skips it on Expo 58+)
    config = withOmetriaFirebaseConfigure(config);
    // Add Notification Service Extension (only if not skipped and appGroupIdentifier is available)
    if (!skipNSE && appGroupIdentifier) {
        config = (0, withNotificationServiceExtension_1.withNotificationServiceExtension)(config, {
            appGroupIdentifier,
            ometriaIosSdkVersion,
        });
    }
    return config;
};
exports.withOmetriaIos = withOmetriaIos;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2l0aE9tZXRyaWFJb3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvd2l0aE9tZXRyaWFJb3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMk5BLGdFQVVDO0FBU0Qsb0RBd0NDO0FBdFJELHlEQU04QjtBQUM5Qix1Q0FBeUI7QUFDekIsMkNBQTZCO0FBQzdCLHlGQUFzRjtBQWtCdEYsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLEdBQUcsQ0FBQztJQUNsQyxZQUFZO0lBQ1osU0FBUztJQUNULFNBQVM7SUFDVCxTQUFTO0lBQ1QsSUFBSTtJQUNKLFlBQVk7Q0FDYixDQUFDLENBQUM7QUFFSCxNQUFNLG9CQUFvQixHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsYUFBYSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUUvRSxTQUFTLHFCQUFxQixDQUM1QixRQUFrRDtJQUVsRCxJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQ2IsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUVELE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUM7SUFDeEQsSUFBSSxXQUFXLEtBQUssYUFBYSxJQUFJLFdBQVcsS0FBSyxZQUFZLEVBQUUsQ0FBQztRQUNsRSxPQUFPLFdBQVcsQ0FBQztJQUNyQixDQUFDO0lBRUQsSUFBSSxvQkFBd0MsQ0FBQztJQUM3QyxLQUFLLE1BQU0sTUFBTSxJQUFJLENBQUMsbUJBQW1CLEVBQUUscUJBQXFCLENBQUMsRUFBRSxDQUFDO1FBQ2xFLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDakQsSUFBSSxDQUFDLEtBQUs7WUFBRSxTQUFTO1FBQ3JCLElBQUksbUJBQW1CLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztZQUFF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RUFBRSxhQUFhLENBQUMsQ0FBQztJQUV4RCw2RUFBNkU7SUFDN0UsTUFBTSxHQUFHLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQztJQUVyRCxpQkFBaUI7SUFDakIsTUFBTSxHQUFHLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQztJQUVuRCwrRUFBK0U7SUFDL0UsTUFBTSxHQUFHLDRCQUE0QixDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRTlDLCtGQUErRjtJQUMvRixJQUFJLENBQUMsT0FBTyxJQUFJLGtCQUFrQixFQUFFLENBQUM7UUFDbkMsTUFBTSxHQUFHLElBQUEsbUVBQWdDLEVBQUMsTUFBTSxFQUFFO1lBQ2hELGtCQUFrQjtZQUNsQixvQkFBb0I7U0FDckIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUMsQ0FBQztBQW5EVyxRQUFBLGNBQWMsa0JBbUR6QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIENvbmZpZ1BsdWdpbixcbiAgd2l0aEFwcERlbGVnYXRlLFxuICB3aXRoRW50aXRsZW1lbnRzUGxpc3QsXG4gIHdpdGhJbmZvUGxpc3QsXG4gIHdpdGhQb2RmaWxlLFxufSBmcm9tICdAZXhwby9jb25maWctcGx1Z2lucyc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgd2l0aE5vdGlmaWNhdGlvblNlcnZpY2VFeHRlbnNpb24gfSBmcm9tICcuL3dpdGhOb3RpZmljYXRpb25TZXJ2aWNlRXh0ZW5zaW9uJztcblxudHlwZSBJb3NQbHVnaW5Qcm9wcyA9IHtcbiAgY3VzdG9tQXBwR3JvdXBJZGVudGlmaWVyPzogc3RyaW5nO1xuICBvbWV0cmlhSW9zU2RrVmVyc2lvbjogc3RyaW5nO1xuICBza2lwTlNFOiBib29sZWFuO1xuICByblNka1ZlcnNpb246IHN0cmluZztcbiAgYXBzRW52aXJvbm1lbnQ/OiAnZGV2ZWxvcG1lbnQnIHwgJ3Byb2R1Y3Rpb24nO1xufTtcblxudHlwZSBJbnRlcm5hbFBsdWdpblByb3BzID0ge1xuICBhcHBHcm91cElkZW50aWZpZXI6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgb21ldHJpYUlvc1Nka1ZlcnNpb246IHN0cmluZztcbiAgc2tpcE5TRTogYm9vbGVhbjtcbiAgcm5TZGtWZXJzaW9uOiBzdHJpbmc7XG4gIGFwc0Vudmlyb25tZW50OiAnZGV2ZWxvcG1lbnQnIHwgJ3Byb2R1Y3Rpb24nO1xufTtcblxuY29uc3QgUFJPRFVDVElPTl9QUk9GSUxFUyA9IG5ldyBTZXQoW1xuICAncHJvZHVjdGlvbicsXG4gICdyZWxlYXNlJyxcbiAgJ3N0YWdpbmcnLFxuICAncHJldmlldycsXG4gICdxYScsXG4gICd0ZXN0ZmxpZ2h0Jyxcbl0pO1xuXG5jb25zdCBERVZFTE9QTUVOVF9QUk9GSUxFUyA9IG5ldyBTZXQoWydkZXZlbG9wbWVudCcsICdkZXYnLCAnZGVidWcnLCAnbG9jYWwnXSk7XG5cbmZ1bmN0aW9uIHJlc29sdmVBcHNFbnZpcm9ubWVudChcbiAgZXhwbGljaXQ6ICdkZXZlbG9wbWVudCcgfCAncHJvZHVjdGlvbicgfCB1bmRlZmluZWRcbik6ICdkZXZlbG9wbWVudCcgfCAncHJvZHVjdGlvbicge1xuICBpZiAoZXhwbGljaXQpIHtcbiAgICByZXR1cm4gZXhwbGljaXQ7XG4gIH1cblxuICBjb25zdCBvdmVycmlkZUVudiA9IHByb2Nlc3MuZW52Lk9NRVRSSUFfQVBTX0VOVklST05NRU5UO1xuICBpZiAob3ZlcnJpZGVFbnYgPT09ICdkZXZlbG9wbWVudCcgfHwgb3ZlcnJpZGVFbnYgPT09ICdwcm9kdWN0aW9uJykge1xuICAgIHJldHVybiBvdmVycmlkZUVudjtcbiAgfVxuXG4gIGxldCB1bnJlY29uZ25pc2VkUHJvZmlsZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBmb3IgKGNvbnN0IGVudlZhciBvZiBbJ0VBU19CVUlMRF9QUk9GSUxFJywgJ0VYUE9fUFVCTElDX0FQUF9FTlYnXSkge1xuICAgIGNvbnN0IHZhbHVlID0gcHJvY2Vzcy5lbnZbZW52VmFyXT8udG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIXZhbHVlKSBjb250aW51ZTtcbiAgICBpZiAoUFJPRFVDVElPTl9QUk9GSUxFUy5oYXModmFsdWUpKSByZXR1cm4gJ3Byb2R1Y3Rpb24nO1xuICAgIGlmIChERVZFTE9QTUVOVF9QUk9GSUxFUy5oYXModmFsdWUpKSByZXR1cm4gJ2RldmVsb3BtZW50JztcbiAgICB1bnJlY29uZ25pc2VkUHJvZmlsZSA9IHZhbHVlO1xuICB9XG5cbiAgLy8gTm90IG9uIEVBUyDigJQgbG9jYWwgcHJlYnVpbGQuIFhjb2RlIG92ZXJyaWRlcyBhcHMtZW52aXJvbm1lbnQgZnJvbSB0aGVcbiAgLy8gcHJvdmlzaW9uaW5nIHByb2ZpbGUgYXQgYnVpbGQgdGltZSwgc28gdGhlIHZhbHVlIGhlcmUgZG9lc24ndCBtYXR0ZXIuXG4gIC8vIERlZmF1bHQgc2lsZW50bHkgdG8gZGV2ZWxvcG1lbnQuXG4gIGlmICghcHJvY2Vzcy5lbnYuRUFTX0JVSUxEKSB7XG4gICAgcmV0dXJuICdkZXZlbG9wbWVudCc7XG4gIH1cblxuICBjb25zdCBwcm9maWxlSGludCA9IHVucmVjb25nbmlzZWRQcm9maWxlXG4gICAgPyBgICh1bnJlY29nbmlzZWQgRUFTIHByb2ZpbGU6IFwiJHt1bnJlY29uZ25pc2VkUHJvZmlsZX1cIilgXG4gICAgOiAnJztcbiAgY29uc29sZS53YXJuKFxuICAgIGBbcmVhY3QtbmF0aXZlLW9tZXRyaWFdIENvdWxkIG5vdCBkZXRlcm1pbmUgQVBOcyBlbnZpcm9ubWVudCBmcm9tIGJ1aWxkIGNvbnRleHQke3Byb2ZpbGVIaW50fS4gYCArXG4gICAgICAnRGVmYXVsdGluZyBhcHMtZW52aXJvbm1lbnQgdG8gXCJwcm9kdWN0aW9uXCIuICcgK1xuICAgICAgJ1NldCBhcHNFbnZpcm9ubWVudCBpbiB0aGUgcGx1Z2luIGNvbmZpZyBvciBPTUVUUklBX0FQU19FTlZJUk9OTUVOVCBlbnYgdmFyIHRvIHNpbGVuY2UgdGhpcyB3YXJuaW5nLidcbiAgKTtcbiAgcmV0dXJuICdwcm9kdWN0aW9uJztcbn1cblxuLyoqXG4gKiBBZGRzIHB1c2ggbm90aWZpY2F0aW9uIGFuZCBhcHAgZ3JvdXAgZW50aXRsZW1lbnRzIHRvIHRoZSBtYWluIGFwcFxuICovXG5jb25zdCB3aXRoT21ldHJpYUVudGl0bGVtZW50czogQ29uZmlnUGx1Z2luPEludGVybmFsUGx1Z2luUHJvcHM+ID0gKFxuICBjb25maWcsXG4gIHByb3BzXG4pID0+IHtcbiAgcmV0dXJuIHdpdGhFbnRpdGxlbWVudHNQbGlzdChjb25maWcsIChtb2RDb25maWcpID0+IHtcbiAgICAvLyBBZGQgcHVzaCBub3RpZmljYXRpb24gZW50aXRsZW1lbnRcbiAgICBtb2RDb25maWcubW9kUmVzdWx0c1snYXBzLWVudmlyb25tZW50J10gPSBwcm9wcy5hcHNFbnZpcm9ubWVudDtcblxuICAgIC8vIEFkZCBhcHAgZ3JvdXAgZW50aXRsZW1lbnQgb25seSBpZiBhcHBHcm91cElkZW50aWZpZXIgaXMgcHJvdmlkZWQgKGZvciBOU0UpXG4gICAgaWYgKHByb3BzLmFwcEdyb3VwSWRlbnRpZmllcikge1xuICAgICAgY29uc3QgYXBwR3JvdXBzID1cbiAgICAgICAgbW9kQ29uZmlnLm1vZFJlc3VsdHNbJ2NvbS5hcHBsZS5zZWN1cml0eS5hcHBsaWNhdGlvbi1ncm91cHMnXTtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGFwcEdyb3VwcykpIHtcbiAgICAgICAgaWYgKCFhcHBHcm91cHMuaW5jbHVkZXMocHJvcHMuYXBwR3JvdXBJZGVudGlmaWVyKSkge1xuICAgICAgICAgIGFwcEdyb3Vwcy5wdXNoKHByb3BzLmFwcEdyb3VwSWRlbnRpZmllcik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1vZENvbmZpZy5tb2RSZXN1bHRzWydjb20uYXBwbGUuc2VjdXJpdHkuYXBwbGljYXRpb24tZ3JvdXBzJ10gPSBbXG4gICAgICAgICAgcHJvcHMuYXBwR3JvdXBJZGVudGlmaWVyLFxuICAgICAgICBdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBtb2RDb25maWc7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBXcml0ZXMgdGhlIGRlZmF1bHQgYXBwR3JvdXBJZGVudGlmaWVyIHRvIEluZm8ucGxpc3QgZm9yIEV4cG8gYXBwcy5cbiAqIFRoZSBuYXRpdmUgU0RLIHJlYWRzIHRoaXMgYXMgYSBmYWxsYmFjayB3aGVuIG5vIGFwcEdyb3VwSWRlbnRpZmllciBpcyBwYXNzZWQgYXQgcnVudGltZS5cbiAqL1xuY29uc3Qgd2l0aE9tZXRyaWFJbmZvUGxpc3Q6IENvbmZpZ1BsdWdpbjxJbnRlcm5hbFBsdWdpblByb3BzPiA9IChcbiAgY29uZmlnLFxuICBwcm9wc1xuKSA9PiB7XG4gIHJldHVybiB3aXRoSW5mb1BsaXN0KGNvbmZpZywgKG1vZENvbmZpZykgPT4ge1xuICAgIC8vIE9ubHkgd3JpdGUgaWYgTlNFIGlzIGVuYWJsZWQgYW5kIHdlIGhhdmUgYW4gYXBwR3JvdXBJZGVudGlmaWVyXG4gICAgaWYgKCFwcm9wcy5za2lwTlNFICYmIHByb3BzLmFwcEdyb3VwSWRlbnRpZmllcikge1xuICAgICAgbW9kQ29uZmlnLm1vZFJlc3VsdHNbJ09tZXRyaWFFeHBvRGVmYXVsdEFwcEdyb3VwSWRlbnRpZmllciddID1cbiAgICAgICAgcHJvcHMuYXBwR3JvdXBJZGVudGlmaWVyO1xuICAgIH1cbiAgICAvLyBXcml0ZSBSTiBTREsgdmVyc2lvbiBzbyBuYXRpdmUgY29kZSBjYW4gcmVhZCBpdCBpbnN0ZWFkIG9mIHVzaW5nIGEgaGFyZGNvZGVkIHZhbHVlXG4gICAgbW9kQ29uZmlnLm1vZFJlc3VsdHNbJ09tZXRyaWFSTlNka1ZlcnNpb24nXSA9IHByb3BzLnJuU2RrVmVyc2lvbjtcbiAgICByZXR1cm4gbW9kQ29uZmlnO1xuICB9KTtcbn07XG5cbi8qKlxuICogTW9kaWZpZXMgdGhlIFBvZGZpbGUgdG8gYWRkIE9tZXRyaWEtc3BlY2lmaWMgY29uZmlndXJhdGlvbnNcbiAqL1xuY29uc3Qgd2l0aE9tZXRyaWFQb2RmaWxlOiBDb25maWdQbHVnaW48SW50ZXJuYWxQbHVnaW5Qcm9wcz4gPSAoY29uZmlnLCBwcm9wcykgPT4ge1xuICByZXR1cm4gd2l0aFBvZGZpbGUoY29uZmlnLCAobW9kQ29uZmlnKSA9PiB7XG4gICAgLy8gUmVtaW5kIGFib3V0IHRoZSBpT1Mgc2V0dGluZ3MgUmVhY3QgTmF0aXZlIEZpcmViYXNlIG5lZWRzIHdpdGggT21ldHJpYSAyLnhcbiAgICBpZiAoaGFzUmVhY3ROYXRpdmVGaXJlYmFzZShtb2RDb25maWcubW9kUmVxdWVzdC5wcm9qZWN0Um9vdCkpIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgJ1tyZWFjdC1uYXRpdmUtb21ldHJpYV0gUmVhY3QgTmF0aXZlIEZpcmViYXNlIGRldGVjdGVkLiBPbiBpT1MsIE9tZXRyaWEgMi54IG5lZWRzIHN0YXRpYyBsaW5raW5nOiAnICtcbiAgICAgICAgICAnc2V0IFwidXNlRnJhbWV3b3Jrc1wiOiBcInN0YXRpY1wiIGFuZCBcImZvcmNlU3RhdGljTGlua2luZ1wiOiBbXCJSTkZCQXBwXCIsIFwiUk5GQk1lc3NhZ2luZ1wiXSBpbiBleHBvLWJ1aWxkLXByb3BlcnRpZXMsICcgK1xuICAgICAgICAgICdhbmQgd2l0aCBSZWFjdCBOYXRpdmUgRmlyZWJhc2UgMjYuMSBvciBsYXRlciBhbHNvIHNldCB7IFwiaW9zXCI6IHsgXCJkaXNhYmxlU1BNXCI6IHRydWUgfSB9IG9uIHRoZSAnICtcbiAgICAgICAgICAnXCJAcmVhY3QtbmF0aXZlLWZpcmViYXNlL2FwcFwiIHBsdWdpbi4gUmVhY3QgTmF0aXZlIEZpcmViYXNlIDI3IG5lZWRzIHJlYWN0LW5hdGl2ZS1vbWV0cmlhIDMuMC4gJyArXG4gICAgICAgICAgJ1NlZTogaHR0cHM6Ly9tb2JpbGUtc2RrLmRvY3Mub21ldHJpYS5jb20vcmVhY3QtbmF0aXZlL2luc3RhbGxhdGlvbidcbiAgICAgICk7XG4gICAgfVxuXG4gICAgbGV0IHBvZGZpbGUgPSBtb2RDb25maWcubW9kUmVzdWx0cy5jb250ZW50cztcblxuICAgIC8vIEFkZCBUdXJib01vZHVsZSBzY3JpcHQgcmVxdWlyZSBhdCB0aGUgdG9wIChhZnRlciBvdGhlciByZXF1aXJlcylcbiAgICBwb2RmaWxlID0gYWRkVHVyYm9Nb2R1bGVSZXF1aXJlKHBvZGZpbGUpO1xuXG4gICAgLy8gQWRkIHBhdGNoX29tZXRyaWFfdHVyYm9tb2R1bGUgY2FsbCBpbiBwb3N0X2luc3RhbGxcbiAgICBwb2RmaWxlID0gYWRkVHVyYm9Nb2R1bGVQYXRjaChwb2RmaWxlKTtcblxuICAgIC8vIEFkZCBvbGQgYXJjaGl0ZWN0dXJlIG1vZHVsZW1hcCBmaXggaW4gcG9zdF9pbnN0YWxsXG4gICAgcG9kZmlsZSA9IGFkZE9sZEFyY2hNb2R1bGVtYXBGaXgocG9kZmlsZSk7XG5cbiAgICAvLyBBZGQgTlNFIHRhcmdldCBmb3IgcmljaCBwdXNoIG5vdGlmaWNhdGlvbnMgKG9ubHkgaWYgbm90IHNraXBwZWQpXG4gICAgaWYgKCFwcm9wcy5za2lwTlNFKSB7XG4gICAgICBwb2RmaWxlID0gYWRkTm90aWZpY2F0aW9uU2VydmljZVRhcmdldChcbiAgICAgICAgcG9kZmlsZSxcbiAgICAgICAgcHJvcHMub21ldHJpYUlvc1Nka1ZlcnNpb25cbiAgICAgICk7XG4gICAgfVxuXG4gICAgbW9kQ29uZmlnLm1vZFJlc3VsdHMuY29udGVudHMgPSBwb2RmaWxlO1xuICAgIHJldHVybiBtb2RDb25maWc7XG4gIH0pO1xufTtcblxuZnVuY3Rpb24gaGFzUmVhY3ROYXRpdmVGaXJlYmFzZShwcm9qZWN0Um9vdDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcGtnUGF0aCA9IHBhdGguam9pbihwcm9qZWN0Um9vdCwgJ3BhY2thZ2UuanNvbicpO1xuICAgIGNvbnN0IHBrZyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBrZ1BhdGgsICd1dGY4JykpID8/IHt9O1xuICAgIGNvbnN0IGRlcHMgPSB7IC4uLnBrZy5kZXBlbmRlbmNpZXMsIC4uLnBrZy5kZXZEZXBlbmRlbmNpZXMgfTtcbiAgICByZXR1cm4gQm9vbGVhbihkZXBzWydAcmVhY3QtbmF0aXZlLWZpcmViYXNlL2FwcCddKTtcbiAgfSBjYXRjaCB7XG4gICAgLy8gaWdub3JlIOKAlCBwYWNrYWdlLmpzb24gdW5yZWFkYWJsZVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vKipcbiAqIE1ha2VzIHN1cmUgRmlyZWJhc2VBcHAuY29uZmlndXJlKCkgcnVucyBhdCBsYXVuY2ggb24gRXhwbyBhcHBzIHVzaW5nIFJlYWN0IE5hdGl2ZSBGaXJlYmFzZS5cbiAqXG4gKiBQcm9ibGVtOiBFeHBvIFNESyA1OCBtb3ZlZCB0byBhIHNjZW5lLWJhc2VkIEFwcERlbGVnYXRlIChTY2VuZURlbGVnYXRlIHN0YXJ0cyBSZWFjdCBOYXRpdmUpLlxuICogQHJlYWN0LW5hdGl2ZS1maXJlYmFzZS9hcHAncyBjb25maWcgcGx1Z2luIHVwIHRvIDI2LnggbG9va3MgZm9yIGBmYWN0b3J5LnN0YXJ0UmVhY3ROYXRpdmUoYCxcbiAqIGRvZXNuJ3QgZmluZCBpdCBhbmQgc2tpcHMgRmlyZWJhc2VBcHAuY29uZmlndXJlKCkgd2l0aCBvbmx5IGEgcHJlYnVpbGQgd2FybmluZywgc28gRmlyZWJhc2VcbiAqIG5ldmVyIGluaXRpYWxpc2VzIGFuZCBubyBGQ00gdG9rZW4gaXMgaXNzdWVkLiBUaGUgZml4IG9ubHkgc2hpcHMgaW4gUk5GQiAyNywgd2hpY2ggT21ldHJpYSAyLnhcbiAqIGNhbid0IHVzZSAoUk5GQiAyNyBpcyBTUE0tb25seSkuXG4gKlxuICogU29sdXRpb246IGluc2VydCB0aGUgY2FsbCBvdXJzZWx2ZXMgd2hlbiBpdCdzIG1pc3NpbmcsIHVzaW5nIHRoZSBzYW1lIGFuY2hvcnMgYXMgUk5GQiAyNy5cbiAqIElmIFJORkIncyBwbHVnaW4gYWxyZWFkeSBpbnNlcnRlZCBpdCAoRXhwbyA8PSA1Nywgb3IgUk5GQiAyNyspLCB0aGlzIGlzIGEgbm8tb3AuXG4gKi9cbmNvbnN0IHdpdGhPbWV0cmlhRmlyZWJhc2VDb25maWd1cmU6IENvbmZpZ1BsdWdpbiA9IChjb25maWcpID0+IHtcbiAgcmV0dXJuIHdpdGhBcHBEZWxlZ2F0ZShjb25maWcsIChtb2RDb25maWcpID0+IHtcbiAgICBpZiAoXG4gICAgICAhc2hvdWxkQWRkRmlyZWJhc2VDb25maWd1cmUoXG4gICAgICAgIG1vZENvbmZpZy5tb2RSZXN1bHRzLmxhbmd1YWdlLFxuICAgICAgICBtb2RDb25maWcuaW9zPy5nb29nbGVTZXJ2aWNlc0ZpbGUsXG4gICAgICAgIG1vZENvbmZpZy5tb2RSZXF1ZXN0LnByb2plY3RSb290XG4gICAgICApXG4gICAgKSB7XG4gICAgICByZXR1cm4gbW9kQ29uZmlnO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRlbnRzID0gYWRkRmlyZWJhc2VDb25maWd1cmUobW9kQ29uZmlnLm1vZFJlc3VsdHMuY29udGVudHMpO1xuICAgIGlmIChjb250ZW50cyAhPT0gbW9kQ29uZmlnLm1vZFJlc3VsdHMuY29udGVudHMpIHtcbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAnW3JlYWN0LW5hdGl2ZS1vbWV0cmlhXSBBZGRlZCBGaXJlYmFzZUFwcC5jb25maWd1cmUoKSB0byBBcHBEZWxlZ2F0ZS5zd2lmdCAnICtcbiAgICAgICAgICAnKHRoZSBAcmVhY3QtbmF0aXZlLWZpcmViYXNlL2FwcCBwbHVnaW4gc2tpcHBlZCBpdDsgaXRzIFwiU2tpcHBpbmcgRmlyZWJhc2UgYWRkaXRpb25cIiB3YXJuaW5nIGNhbiBiZSBpZ25vcmVkKS4nXG4gICAgICApO1xuICAgIH1cbiAgICBtb2RDb25maWcubW9kUmVzdWx0cy5jb250ZW50cyA9IGNvbnRlbnRzO1xuICAgIHJldHVybiBtb2RDb25maWc7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBPbmx5IFN3aWZ0IEFwcERlbGVnYXRlcyBvZiBhcHBzIHRoYXQgdXNlIFJlYWN0IE5hdGl2ZSBGaXJlYmFzZSB3aXRoIGEgR29vZ2xlU2VydmljZS1JbmZvLnBsaXN0XG4gKiBnZXQgRmlyZWJhc2VBcHAuY29uZmlndXJlKCk7IHdpdGhvdXQgdGhlIHBsaXN0LCBjb25maWd1cmUoKSB3b3VsZCBjcmFzaCBhdCBsYXVuY2guXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzaG91bGRBZGRGaXJlYmFzZUNvbmZpZ3VyZShcbiAgbGFuZ3VhZ2U6IHN0cmluZyxcbiAgZ29vZ2xlU2VydmljZXNGaWxlOiBzdHJpbmcgfCB1bmRlZmluZWQsXG4gIHByb2plY3RSb290OiBzdHJpbmdcbik6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIGxhbmd1YWdlID09PSAnc3dpZnQnICYmXG4gICAgQm9vbGVhbihnb29nbGVTZXJ2aWNlc0ZpbGUpICYmXG4gICAgaGFzUmVhY3ROYXRpdmVGaXJlYmFzZShwcm9qZWN0Um9vdClcbiAgKTtcbn1cblxuY29uc3QgRklSRUJBU0VfQ09ORklHVVJFX0FOQ0hPUiA9XG4gIC8oPzpzZWxmXFwubW9kdWxlTmFtZVxccyo9XFxzKlwiW15cIl0qXCIpfCg/OmZhY3RvcnlcXC5zdGFydFJlYWN0TmF0aXZlXFwoKXwoPzpyZXR1cm5cXHMrc3VwZXJcXC5hcHBsaWNhdGlvblxcKFxccyphcHBsaWNhdGlvblxccyosXFxzKmRpZEZpbmlzaExhdW5jaGluZ1dpdGhPcHRpb25zOlxccypsYXVuY2hPcHRpb25zXFxzKlxcKSkvO1xuXG4vLyBgaW1wb3J0IEZpcmViYXNlQ29yZWAgb3IgdGhlIGBGaXJlYmFzZWAgdW1icmVsbGEsIHdpdGggYW55IGF0dHJpYnV0ZXMgb3IgYWNjZXNzIGxldmVsXG5jb25zdCBGSVJFQkFTRV9JTVBPUlQgPVxuICAvXlsgXFx0XSooPzpAXFx3K1sgXFx0XSspKig/Oig/OnB1YmxpY3xwYWNrYWdlfGludGVybmFsfGZpbGVwcml2YXRlfHByaXZhdGUpWyBcXHRdKyk/aW1wb3J0WyBcXHRdKyg/OkZpcmViYXNlQ29yZXxGaXJlYmFzZSlcXGIvbTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFkZEZpcmViYXNlQ29uZmlndXJlKGFwcERlbGVnYXRlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoL0ZpcmViYXNlQXBwXFwuY29uZmlndXJlXFwoLy50ZXN0KGFwcERlbGVnYXRlKSkge1xuICAgIHJldHVybiBhcHBEZWxlZ2F0ZTtcbiAgfVxuXG4gIGNvbnN0IGFuY2hvciA9IGFwcERlbGVnYXRlLm1hdGNoKEZJUkVCQVNFX0NPTkZJR1VSRV9BTkNIT1IpO1xuICBpZiAoIWFuY2hvciB8fCBhbmNob3IuaW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnNvbGUud2FybihcbiAgICAgICdbcmVhY3QtbmF0aXZlLW9tZXRyaWFdIENvdWxkIG5vdCBmaW5kIHdoZXJlIHRvIGFkZCBGaXJlYmFzZUFwcC5jb25maWd1cmUoKSBpbiBBcHBEZWxlZ2F0ZS5zd2lmdC4gJyArXG4gICAgICAgICdBZGQgaXQgbWFudWFsbHkgdG8gYXBwbGljYXRpb24oXzpkaWRGaW5pc2hMYXVuY2hpbmdXaXRoT3B0aW9uczopLCBvdGhlcndpc2UgcHVzaCBub3RpZmljYXRpb25zIHdpbGwgbm90IHdvcmsuJ1xuICAgICk7XG4gICAgcmV0dXJuIGFwcERlbGVnYXRlO1xuICB9XG5cbiAgY29uc3QgbGluZVN0YXJ0ID0gYXBwRGVsZWdhdGUubGFzdEluZGV4T2YoJ1xcbicsIGFuY2hvci5pbmRleCkgKyAxO1xuICBjb25zdCBpbmRlbnQgPSBhcHBEZWxlZ2F0ZS5zbGljZShsaW5lU3RhcnQpLm1hdGNoKC9eWyBcXHRdKi8pPy5bMF0gPz8gJyc7XG4gIGxldCBjb250ZW50cyA9XG4gICAgYXBwRGVsZWdhdGUuc2xpY2UoMCwgbGluZVN0YXJ0KSArXG4gICAgYCR7aW5kZW50fS8vIFtPbWV0cmlhXSBDb25maWd1cmUgRmlyZWJhc2UgKFJORkIgPD0gMjYgc2tpcHMgdGhpcyBvbiBFeHBvIDU4KylcXG5gICtcbiAgICBgJHtpbmRlbnR9aWYgRmlyZWJhc2VBcHAuYXBwKCkgPT0gbmlsIHtcXG5gICtcbiAgICBgJHtpbmRlbnR9ICBGaXJlYmFzZUFwcC5jb25maWd1cmUoKVxcbmAgK1xuICAgIGAke2luZGVudH19XFxuYCArXG4gICAgYXBwRGVsZWdhdGUuc2xpY2UobGluZVN0YXJ0KTtcblxuICBpZiAoIUZJUkVCQVNFX0lNUE9SVC50ZXN0KGNvbnRlbnRzKSkge1xuICAgIGNvbnN0IGltcG9ydEFuY2hvciA9XG4gICAgICBjb250ZW50cy5tYXRjaCgvXlsgXFx0XSooPzppbnRlcm5hbFxccyspP2ltcG9ydFxccytFeHBvWyBcXHRdKiQvbSkgPz9cbiAgICAgIGNvbnRlbnRzLm1hdGNoKC9eWyBcXHRdKmltcG9ydFxcYlteXFxyXFxuXSokL20pO1xuICAgIGlmIChpbXBvcnRBbmNob3IgJiYgaW1wb3J0QW5jaG9yLmluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGluc2VydEluZGV4ID0gaW1wb3J0QW5jaG9yLmluZGV4ICsgaW1wb3J0QW5jaG9yWzBdLmxlbmd0aDtcbiAgICAgIGNvbnRlbnRzID1cbiAgICAgICAgY29udGVudHMuc2xpY2UoMCwgaW5zZXJ0SW5kZXgpICtcbiAgICAgICAgJ1xcbmltcG9ydCBGaXJlYmFzZUNvcmUnICtcbiAgICAgICAgY29udGVudHMuc2xpY2UoaW5zZXJ0SW5kZXgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZW50cyA9IGBpbXBvcnQgRmlyZWJhc2VDb3JlXFxuJHtjb250ZW50c31gO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjb250ZW50cztcbn1cblxuZnVuY3Rpb24gYWRkVHVyYm9Nb2R1bGVSZXF1aXJlKHBvZGZpbGU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHJlcXVpcmVTdGF0ZW1lbnQgPVxuICAgIFwicmVxdWlyZV9yZWxhdGl2ZSAnLi4vbm9kZV9tb2R1bGVzL3JlYWN0LW5hdGl2ZS1vbWV0cmlhL3NjcmlwdHMvb21ldHJpYV90dXJib21vZHVsZSdcIjtcblxuICBpZiAocG9kZmlsZS5pbmNsdWRlcygnb21ldHJpYV90dXJib21vZHVsZScpKSB7XG4gICAgcmV0dXJuIHBvZGZpbGU7XG4gIH1cblxuICAvLyBGaW5kIGEgZ29vZCBwbGFjZSB0byBpbnNlcnQgLSBhZnRlciBwbGF0Zm9ybSBkZWNsYXJhdGlvbiBvciBhZnRlciBvdGhlciByZXF1aXJlc1xuICBjb25zdCBwbGF0Zm9ybU1hdGNoID0gcG9kZmlsZS5tYXRjaCgvcGxhdGZvcm0gOmlvcy4qXFxuLyk7XG4gIGlmIChwbGF0Zm9ybU1hdGNoKSB7XG4gICAgY29uc3QgaW5zZXJ0SW5kZXggPSAocGxhdGZvcm1NYXRjaC5pbmRleCB8fCAwKSArIHBsYXRmb3JtTWF0Y2hbMF0ubGVuZ3RoO1xuICAgIHJldHVybiAoXG4gICAgICBwb2RmaWxlLnNsaWNlKDAsIGluc2VydEluZGV4KSArXG4gICAgICBgXFxuIyBbT21ldHJpYV0gVHVyYm9Nb2R1bGUgcmVnaXN0cmF0aW9uIGZvciBOZXcgQXJjaGl0ZWN0dXJlXFxuJHtyZXF1aXJlU3RhdGVtZW50fVxcbmAgK1xuICAgICAgcG9kZmlsZS5zbGljZShpbnNlcnRJbmRleClcbiAgICApO1xuICB9XG5cbiAgLy8gRmFsbGJhY2s6IGFkZCBhdCB0aGUgYmVnaW5uaW5nXG4gIHJldHVybiBgIyBbT21ldHJpYV0gVHVyYm9Nb2R1bGUgcmVnaXN0cmF0aW9uIGZvciBOZXcgQXJjaGl0ZWN0dXJlXFxuJHtyZXF1aXJlU3RhdGVtZW50fVxcblxcbiR7cG9kZmlsZX1gO1xufVxuXG5mdW5jdGlvbiBhZGRUdXJib01vZHVsZVBhdGNoKHBvZGZpbGU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmIChwb2RmaWxlLmluY2x1ZGVzKCdwYXRjaF9vbWV0cmlhX3R1cmJvbW9kdWxlJykpIHtcbiAgICByZXR1cm4gcG9kZmlsZTtcbiAgfVxuXG4gIC8vIEZpbmQgcG9zdF9pbnN0YWxsIGJsb2NrIGFuZCBhZGQgdGhlIHBhdGNoIGNhbGxcbiAgY29uc3QgcG9zdEluc3RhbGxNYXRjaCA9IHBvZGZpbGUubWF0Y2goL3Bvc3RfaW5zdGFsbCBkbyBcXHxpbnN0YWxsZXJcXHwvKTtcbiAgaWYgKHBvc3RJbnN0YWxsTWF0Y2ggJiYgcG9zdEluc3RhbGxNYXRjaC5pbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgaW5zZXJ0SW5kZXggPSBwb3N0SW5zdGFsbE1hdGNoLmluZGV4ICsgcG9zdEluc3RhbGxNYXRjaFswXS5sZW5ndGg7XG4gICAgcmV0dXJuIChcbiAgICAgIHBvZGZpbGUuc2xpY2UoMCwgaW5zZXJ0SW5kZXgpICtcbiAgICAgICdcXG4gICAgIyBbT21ldHJpYV0gUmVnaXN0ZXIgVHVyYm9Nb2R1bGUgZm9yIE5ldyBBcmNoaXRlY3R1cmVcXG4gICAgcGF0Y2hfb21ldHJpYV90dXJib21vZHVsZShpbnN0YWxsZXIpXFxuJyArXG4gICAgICBwb2RmaWxlLnNsaWNlKGluc2VydEluZGV4KVxuICAgICk7XG4gIH1cblxuICBjb25zb2xlLndhcm4oXG4gICAgJ1tPbWV0cmlhXSBDb3VsZCBub3QgZmluZCBwb3N0X2luc3RhbGwgYmxvY2sgaW4gUG9kZmlsZS4gJyArXG4gICAgICAnVHVyYm9Nb2R1bGUgcGF0Y2ggbWF5IG5lZWQgdG8gYmUgYWRkZWQgbWFudWFsbHkuJ1xuICApO1xuICByZXR1cm4gcG9kZmlsZTtcbn1cblxuLyoqXG4gKiBBZGRzIG1vZHVsZW1hcCBmaXggZm9yIG9sZCBhcmNoaXRlY3R1cmUgY29tcGF0aWJpbGl0eSB3aXRoIHVzZV9tb2R1bGFyX2hlYWRlcnMhXG4gKlxuICogUHJvYmxlbTogV2hlbiB1c2luZyB1c2VfbW9kdWxhcl9oZWFkZXJzISArIG9sZCBhcmNoaXRlY3R1cmUgKyBSTiAwLjgxKyxcbiAqIG11bHRpcGxlIG1vZHVsZW1hcHMgaW4gdGhlIHNhbWUgZGlyZWN0b3J5IGRlZmluZSBpZGVudGljYWwgbW9kdWxlIG5hbWVzIHdpdGhcbiAqIHVtYnJlbGxhIGhlYWRlcnMsIGNhdXNpbmcgXCJSZWRlZmluaXRpb24gb2YgbW9kdWxlXCIgYnVpbGQgZXJyb3JzLlxuICpcbiAqIFNvbHV0aW9uOiBSZXBsYWNlIGNvbmZsaWN0aW5nIG1vZHVsZW1hcHMgd2l0aCBlbXB0eSBtb2R1bGVzIChkaWZmZXJlbnQgbmFtZXMsIG5vIHVtYnJlbGxhKVxuICogVGhpcyBmaXggaXMgb25seSBhcHBsaWVkIHdoZW4gbmV3QXJjaEVuYWJsZWQgaXMgZmFsc2UuXG4gKi9cbmZ1bmN0aW9uIGFkZE9sZEFyY2hNb2R1bGVtYXBGaXgocG9kZmlsZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKFxuICAgIHBvZGZpbGUuaW5jbHVkZXMoJ3JlYWN0X2pzaXRvb2xpbmcnKSAmJlxuICAgIHBvZGZpbGUuaW5jbHVkZXMoJ3JlYWN0X3J1bnRpbWVhcHBsZScpXG4gICkge1xuICAgIHJldHVybiBwb2RmaWxlO1xuICB9XG5cbiAgY29uc3QgbW9kdWxlbWFwRml4ID0gYFxuICAgICMgW09tZXRyaWFdIEZpeCBtb2R1bGVtYXAgcmVkZWZpbml0aW9uIGVycm9ycyB3aGVuIHVzaW5nIHVzZV9tb2R1bGFyX2hlYWRlcnMhICsgb2xkIGFyY2ggKyBSTiAwLjgxK1xuICAgICMgUHJvYmxlbTogTXVsdGlwbGUgbW9kdWxlbWFwcyBpbiBzYW1lIGRpcmVjdG9yeSBkZWZpbmUgaWRlbnRpY2FsIG1vZHVsZSBuYW1lcyB3aXRoIHVtYnJlbGxhIGhlYWRlcnNcbiAgICAjIFNvbHV0aW9uOiBSZXBsYWNlIGNvbmZsaWN0aW5nIG1vZHVsZW1hcHMgd2l0aCBlbXB0eSBtb2R1bGVzIChkaWZmZXJlbnQgbmFtZXMsIG5vIHVtYnJlbGxhKVxuICAgIGlmIHBvZGZpbGVfcHJvcGVydGllc1snbmV3QXJjaEVuYWJsZWQnXSA9PSAnZmFsc2UnXG4gICAgICAjIEZpeCAxOiByZWFjdF9ydW50aW1lIG1vZHVsZSByZWRlZmluaXRpb24gKFJlYWN0LWpzaXRvb2xpbmcgdnMgUmVhY3QtUnVudGltZUNvcmUpXG4gICAgICBqc2l0b29saW5nX3BhdGggPSBcIiN7aW5zdGFsbGVyLnNhbmRib3gucm9vdH0vVGFyZ2V0IFN1cHBvcnQgRmlsZXMvUmVhY3QtanNpdG9vbGluZy9SZWFjdC1qc2l0b29saW5nLm1vZHVsZW1hcFwiXG4gICAgICBpZiBGaWxlLmV4aXN0Pyhqc2l0b29saW5nX3BhdGgpXG4gICAgICAgIEZpbGUud3JpdGUoanNpdG9vbGluZ19wYXRoLCBcIm1vZHVsZSByZWFjdF9qc2l0b29saW5nIHtcXFxcbn1cXFxcblwiKVxuICAgICAgICBwdXRzIFwiW09tZXRyaWFdIEZpeGVkIFJlYWN0LWpzaXRvb2xpbmcubW9kdWxlbWFwIChyZWFjdF9ydW50aW1lIGNvbmZsaWN0KVwiXG4gICAgICBlbmRcblxuICAgICAgIyBGaXggMjogUmVhY3RDb21tb24gbW9kdWxlIHJlZGVmaW5pdGlvbiAoUmVhY3QtUnVudGltZUFwcGxlIHZzIFJlYWN0Q29tbW9uKVxuICAgICAgcnVudGltZWFwcGxlX3BhdGggPSBcIiN7aW5zdGFsbGVyLnNhbmRib3gucm9vdH0vVGFyZ2V0IFN1cHBvcnQgRmlsZXMvUmVhY3QtUnVudGltZUFwcGxlL1JlYWN0LVJ1bnRpbWVBcHBsZS5tb2R1bGVtYXBcIlxuICAgICAgaWYgRmlsZS5leGlzdD8ocnVudGltZWFwcGxlX3BhdGgpXG4gICAgICAgIEZpbGUud3JpdGUocnVudGltZWFwcGxlX3BhdGgsIFwibW9kdWxlIHJlYWN0X3J1bnRpbWVhcHBsZSB7XFxcXG59XFxcXG5cIilcbiAgICAgICAgcHV0cyBcIltPbWV0cmlhXSBGaXhlZCBSZWFjdC1SdW50aW1lQXBwbGUubW9kdWxlbWFwIChSZWFjdENvbW1vbiBjb25mbGljdClcIlxuICAgICAgZW5kXG4gICAgZW5kXG5gO1xuXG4gIC8vIEZpbmQgcmVhY3RfbmF0aXZlX3Bvc3RfaW5zdGFsbCBhbmQgaXRzIGNsb3NpbmcgcGFyZW50aGVzaXNcbiAgLy8gVGhlIGZ1bmN0aW9uIGNhbGwgc3BhbnMgbXVsdGlwbGUgbGluZXMsIHNvIHdlIG5lZWQgdG8gZmluZCB0aGUgbWF0Y2hpbmcgY2xvc2luZyApXG4gIGNvbnN0IHBvc3RJbnN0YWxsU3RhcnQgPSBwb2RmaWxlLmluZGV4T2YoJ3JlYWN0X25hdGl2ZV9wb3N0X2luc3RhbGwoJyk7XG4gIGlmIChwb3N0SW5zdGFsbFN0YXJ0ICE9PSAtMSkge1xuICAgIC8vIENvdW50IHBhcmVudGhlc2VzIHRvIGZpbmQgdGhlIG1hdGNoaW5nIGNsb3NpbmcgKVxuICAgIGxldCBkZXB0aCA9IDA7XG4gICAgbGV0IGZvdW5kU3RhcnQgPSBmYWxzZTtcbiAgICBsZXQgZW5kSW5kZXggPSAtMTtcblxuICAgIGZvciAobGV0IGkgPSBwb3N0SW5zdGFsbFN0YXJ0OyBpIDwgcG9kZmlsZS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHBvZGZpbGVbaV0gPT09ICcoJykge1xuICAgICAgICBkZXB0aCsrO1xuICAgICAgICBmb3VuZFN0YXJ0ID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAocG9kZmlsZVtpXSA9PT0gJyknKSB7XG4gICAgICAgIGRlcHRoLS07XG4gICAgICAgIGlmIChmb3VuZFN0YXJ0ICYmIGRlcHRoID09PSAwKSB7XG4gICAgICAgICAgZW5kSW5kZXggPSBpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGVuZEluZGV4ICE9PSAtMSkge1xuICAgICAgLy8gRmluZCB0aGUgZW5kIG9mIHRoZSBsaW5lIGFmdGVyIHRoZSBjbG9zaW5nIClcbiAgICAgIGNvbnN0IGxpbmVFbmQgPSBwb2RmaWxlLmluZGV4T2YoJ1xcbicsIGVuZEluZGV4KTtcbiAgICAgIGlmIChsaW5lRW5kICE9PSAtMSkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIHBvZGZpbGUuc2xpY2UoMCwgbGluZUVuZCArIDEpICtcbiAgICAgICAgICBtb2R1bGVtYXBGaXggK1xuICAgICAgICAgIHBvZGZpbGUuc2xpY2UobGluZUVuZCArIDEpXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc29sZS53YXJuKFxuICAgICdbT21ldHJpYV0gQ291bGQgbm90IGZpbmQgcmVhY3RfbmF0aXZlX3Bvc3RfaW5zdGFsbCBpbiBQb2RmaWxlLiAnICtcbiAgICAgICdPbGQgYXJjaGl0ZWN0dXJlIG1vZHVsZW1hcCBmaXggbWF5IG5lZWQgdG8gYmUgYWRkZWQgbWFudWFsbHkuJ1xuICApO1xuICByZXR1cm4gcG9kZmlsZTtcbn1cblxuZnVuY3Rpb24gYWRkTm90aWZpY2F0aW9uU2VydmljZVRhcmdldChcbiAgcG9kZmlsZTogc3RyaW5nLFxuICBzZGtWZXJzaW9uOiBzdHJpbmdcbik6IHN0cmluZyB7XG4gIGlmIChwb2RmaWxlLmluY2x1ZGVzKFwidGFyZ2V0ICdPbWV0cmlhTm90aWZpY2F0aW9uU2VydmljZUV4dGVuc2lvbidcIikpIHtcbiAgICByZXR1cm4gcG9kZmlsZTtcbiAgfVxuXG4gIC8vIFVzZSBhIHN0YW5kYWxvbmUgdGFyZ2V0IHdpdGggaW5oZXJpdCEgOnNlYXJjaF9wYXRoc1xuICAvLyBUaGlzIHRlbGxzIENvY29hUG9kcyB0byBpbmhlcml0IHNlYXJjaCBwYXRocyBmcm9tIHRoZSBpbXBsaWNpdCBwYXJlbnRcbiAgLy8gd2l0aG91dCByZXF1aXJpbmcgc3RyaWN0IGhvc3QgdGFyZ2V0IHZlcmlmaWNhdGlvbiBpbiB0aGUgWGNvZGUgcHJvamVjdFxuICAvL1xuICAvLyBNaXJyb3IgdGhlIG1haW4gdGFyZ2V0J3MgdXNlX2ZyYW1ld29ya3MhIHNldHRpbmcgc28gQ29jb2FQb2RzIGRvZXNuJ3RcbiAgLy8gY29tcGxhaW4gdGhhdCB0aGUgaG9zdCBhbmQgZXh0ZW5zaW9uIHRhcmdldHMgZG9uJ3QgbWF0Y2guXG4gIGNvbnN0IG5zZVRhcmdldCA9IGBcbiMgW09tZXRyaWFdIE5vdGlmaWNhdGlvbiBTZXJ2aWNlIEV4dGVuc2lvbiBmb3IgcmljaCBwdXNoIG5vdGlmaWNhdGlvbnNcbnRhcmdldCAnT21ldHJpYU5vdGlmaWNhdGlvblNlcnZpY2VFeHRlbnNpb24nIGRvXG4gIGluaGVyaXQhIDpzZWFyY2hfcGF0aHNcbiAgdXNlX21vZHVsYXJfaGVhZGVycyFcbiAgdXNlX2ZyYW1ld29ya3MhIDpsaW5rYWdlID0+IHBvZGZpbGVfcHJvcGVydGllc1snaW9zLnVzZUZyYW1ld29ya3MnXS50b19zeW0gaWYgcG9kZmlsZV9wcm9wZXJ0aWVzWydpb3MudXNlRnJhbWV3b3JrcyddXG4gIHBvZCAnT21ldHJpYScsICd+PiAke3Nka1ZlcnNpb259J1xuZW5kXG5gO1xuXG4gIC8vIEFkZCBhdCB0aGUgZW5kIG9mIHRoZSBmaWxlIChvdXRzaWRlIG1haW4gdGFyZ2V0KVxuICByZXR1cm4gcG9kZmlsZSArIG5zZVRhcmdldDtcbn1cblxuLyoqXG4gKiBNYWluIGlPUyBjb25maWd1cmF0aW9uIGZvciBPbWV0cmlhXG4gKi9cbmV4cG9ydCBjb25zdCB3aXRoT21ldHJpYUlvczogQ29uZmlnUGx1Z2luPElvc1BsdWdpblByb3BzPiA9IChjb25maWcsIHByb3BzKSA9PiB7XG4gIGNvbnN0IHsgc2tpcE5TRSwgb21ldHJpYUlvc1Nka1ZlcnNpb24gfSA9IHByb3BzO1xuXG4gIGlmIChza2lwTlNFKSB7XG4gICAgY29uc29sZS53YXJuKFxuICAgICAgJ+KaoO+4jyAgW3JlYWN0LW5hdGl2ZS1vbWV0cmlhXSBza2lwTlNFIGlzIGVuYWJsZWQuIFJpY2ggcHVzaCBub3RpZmljYXRpb24gY29udGVudCAoaW1hZ2VzLCBldGMuKSB3aWxsIG5vdCB3b3JrIG9uIGlPUy4nXG4gICAgKTtcbiAgfVxuXG4gIC8vIFVzZSBjdXN0b20gYXBwR3JvdXBJZGVudGlmaWVyIGlmIHByb3ZpZGVkLCBvdGhlcndpc2UgYXV0by1nZW5lcmF0ZSBmcm9tIGJ1bmRsZUlkZW50aWZpZXJcbiAgY29uc3QgYnVuZGxlSWRlbnRpZmllciA9IGNvbmZpZy5pb3M/LmJ1bmRsZUlkZW50aWZpZXI7XG4gIGlmICghYnVuZGxlSWRlbnRpZmllciAmJiAhc2tpcE5TRSAmJiAhcHJvcHMuY3VzdG9tQXBwR3JvdXBJZGVudGlmaWVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgJ1tyZWFjdC1uYXRpdmUtb21ldHJpYV0gaW9zLmJ1bmRsZUlkZW50aWZpZXIgaXMgcmVxdWlyZWQgaW4gYXBwLmpzb24vYXBwLmNvbmZpZy5qcyBmb3IgTlNFIHNldHVwLiAnICtcbiAgICAgICAgJ0VpdGhlciBzZXQgaW9zLmJ1bmRsZUlkZW50aWZpZXIsIHByb3ZpZGUgY3VzdG9tQXBwR3JvdXBJZGVudGlmaWVyLCBvciB1c2Ugc2tpcE5TRTogdHJ1ZSB0byBza2lwIHJpY2ggbm90aWZpY2F0aW9ucy4nXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IGFwcEdyb3VwSWRlbnRpZmllciA9XG4gICAgcHJvcHMuY3VzdG9tQXBwR3JvdXBJZGVudGlmaWVyID8/XG4gICAgKGJ1bmRsZUlkZW50aWZpZXIgPyBgZ3JvdXAuJHtidW5kbGVJZGVudGlmaWVyfWAgOiB1bmRlZmluZWQpO1xuXG4gIGNvbnN0IGludGVybmFsUHJvcHMgPSB7XG4gICAgYXBwR3JvdXBJZGVudGlmaWVyLFxuICAgIG9tZXRyaWFJb3NTZGtWZXJzaW9uLFxuICAgIHNraXBOU0UsXG4gICAgcm5TZGtWZXJzaW9uOiBwcm9wcy5yblNka1ZlcnNpb24sXG4gICAgYXBzRW52aXJvbm1lbnQ6IHJlc29sdmVBcHNFbnZpcm9ubWVudChwcm9wcy5hcHNFbnZpcm9ubWVudCksXG4gIH07XG5cbiAgLy8gQWRkIGVudGl0bGVtZW50c1xuICBjb25maWcgPSB3aXRoT21ldHJpYUVudGl0bGVtZW50cyhjb25maWcsIGludGVybmFsUHJvcHMpO1xuXG4gIC8vIFdyaXRlIGRlZmF1bHQgYXBwR3JvdXBJZGVudGlmaWVyIHRvIEluZm8ucGxpc3QgZm9yIEV4cG8gYXV0by1jb25maWd1cmF0aW9uXG4gIGNvbmZpZyA9IHdpdGhPbWV0cmlhSW5mb1BsaXN0KGNvbmZpZywgaW50ZXJuYWxQcm9wcyk7XG5cbiAgLy8gTW9kaWZ5IFBvZGZpbGVcbiAgY29uZmlnID0gd2l0aE9tZXRyaWFQb2RmaWxlKGNvbmZpZywgaW50ZXJuYWxQcm9wcyk7XG5cbiAgLy8gTWFrZSBzdXJlIEZpcmViYXNlIGlzIGNvbmZpZ3VyZWQgYXQgbGF1bmNoIChSTkZCIDw9IDI2IHNraXBzIGl0IG9uIEV4cG8gNTgrKVxuICBjb25maWcgPSB3aXRoT21ldHJpYUZpcmViYXNlQ29uZmlndXJlKGNvbmZpZyk7XG5cbiAgLy8gQWRkIE5vdGlmaWNhdGlvbiBTZXJ2aWNlIEV4dGVuc2lvbiAob25seSBpZiBub3Qgc2tpcHBlZCBhbmQgYXBwR3JvdXBJZGVudGlmaWVyIGlzIGF2YWlsYWJsZSlcbiAgaWYgKCFza2lwTlNFICYmIGFwcEdyb3VwSWRlbnRpZmllcikge1xuICAgIGNvbmZpZyA9IHdpdGhOb3RpZmljYXRpb25TZXJ2aWNlRXh0ZW5zaW9uKGNvbmZpZywge1xuICAgICAgYXBwR3JvdXBJZGVudGlmaWVyLFxuICAgICAgb21ldHJpYUlvc1Nka1ZlcnNpb24sXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gY29uZmlnO1xufTtcbiJdfQ==