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
                '"@react-native-firebase/app" plugin. React Native Firebase 27 isn\'t supported on 2.x; it will be in the next major version. ' +
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2l0aE9tZXRyaWFJb3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvd2l0aE9tZXRyaWFJb3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMk5BLGdFQVVDO0FBU0Qsb0RBd0NDO0FBdFJELHlEQU04QjtBQUM5Qix1Q0FBeUI7QUFDekIsMkNBQTZCO0FBQzdCLHlGQUFzRjtBQWtCdEYsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLEdBQUcsQ0FBQztJQUNsQyxZQUFZO0lBQ1osU0FBUztJQUNULFNBQVM7SUFDVCxTQUFTO0lBQ1QsSUFBSTtJQUNKLFlBQVk7Q0FDYixDQUFDLENBQUM7QUFFSCxNQUFNLG9CQUFvQixHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsYUFBYSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUUvRSxTQUFTLHFCQUFxQixDQUM1QixRQUFrRDtJQUVsRCxJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQ2IsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUVELE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUM7SUFDeEQsSUFBSSxXQUFXLEtBQUssYUFBYSxJQUFJLFdBQVcsS0FBSyxZQUFZLEVBQUUsQ0FBQztRQUNsRSxPQUFPLFdBQVcsQ0FBQztJQUNyQixDQUFDO0lBRUQsSUFBSSxvQkFBd0MsQ0FBQztJQUM3QyxLQUFLLE1BQU0sTUFBTSxJQUFJLENBQUMsbUJBQW1CLEVBQUUscUJBQXFCLENBQUMsRUFBRSxDQUFDO1FBQ2xFLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDakQsSUFBSSxDQUFDLEtBQUs7WUFBRSxTQUFTO1FBQ3JCLElBQUksbUJBQW1CLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztZQUFF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RUFBRSxhQUFhLENBQUMsQ0FBQztJQUV4RCw2RUFBNkU7SUFDN0UsTUFBTSxHQUFHLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQztJQUVyRCxpQkFBaUI7SUFDakIsTUFBTSxHQUFHLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQztJQUVuRCwrRUFBK0U7SUFDL0UsTUFBTSxHQUFHLDRCQUE0QixDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRTlDLCtGQUErRjtJQUMvRixJQUFJLENBQUMsT0FBTyxJQUFJLGtCQUFrQixFQUFFLENBQUM7UUFDbkMsTUFBTSxHQUFHLElBQUEsbUVBQWdDLEVBQUMsTUFBTSxFQUFFO1lBQ2hELGtCQUFrQjtZQUNsQixvQkFBb0I7U0FDckIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUMsQ0FBQztBQW5EVyxRQUFBLGNBQWMsa0JBbUR6QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIENvbmZpZ1BsdWdpbixcbiAgd2l0aEFwcERlbGVnYXRlLFxuICB3aXRoRW50aXRsZW1lbnRzUGxpc3QsXG4gIHdpdGhJbmZvUGxpc3QsXG4gIHdpdGhQb2RmaWxlLFxufSBmcm9tICdAZXhwby9jb25maWctcGx1Z2lucyc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgd2l0aE5vdGlmaWNhdGlvblNlcnZpY2VFeHRlbnNpb24gfSBmcm9tICcuL3dpdGhOb3RpZmljYXRpb25TZXJ2aWNlRXh0ZW5zaW9uJztcblxudHlwZSBJb3NQbHVnaW5Qcm9wcyA9IHtcbiAgY3VzdG9tQXBwR3JvdXBJZGVudGlmaWVyPzogc3RyaW5nO1xuICBvbWV0cmlhSW9zU2RrVmVyc2lvbjogc3RyaW5nO1xuICBza2lwTlNFOiBib29sZWFuO1xuICByblNka1ZlcnNpb246IHN0cmluZztcbiAgYXBzRW52aXJvbm1lbnQ/OiAnZGV2ZWxvcG1lbnQnIHwgJ3Byb2R1Y3Rpb24nO1xufTtcblxudHlwZSBJbnRlcm5hbFBsdWdpblByb3BzID0ge1xuICBhcHBHcm91cElkZW50aWZpZXI6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgb21ldHJpYUlvc1Nka1ZlcnNpb246IHN0cmluZztcbiAgc2tpcE5TRTogYm9vbGVhbjtcbiAgcm5TZGtWZXJzaW9uOiBzdHJpbmc7XG4gIGFwc0Vudmlyb25tZW50OiAnZGV2ZWxvcG1lbnQnIHwgJ3Byb2R1Y3Rpb24nO1xufTtcblxuY29uc3QgUFJPRFVDVElPTl9QUk9GSUxFUyA9IG5ldyBTZXQoW1xuICAncHJvZHVjdGlvbicsXG4gICdyZWxlYXNlJyxcbiAgJ3N0YWdpbmcnLFxuICAncHJldmlldycsXG4gICdxYScsXG4gICd0ZXN0ZmxpZ2h0Jyxcbl0pO1xuXG5jb25zdCBERVZFTE9QTUVOVF9QUk9GSUxFUyA9IG5ldyBTZXQoWydkZXZlbG9wbWVudCcsICdkZXYnLCAnZGVidWcnLCAnbG9jYWwnXSk7XG5cbmZ1bmN0aW9uIHJlc29sdmVBcHNFbnZpcm9ubWVudChcbiAgZXhwbGljaXQ6ICdkZXZlbG9wbWVudCcgfCAncHJvZHVjdGlvbicgfCB1bmRlZmluZWRcbik6ICdkZXZlbG9wbWVudCcgfCAncHJvZHVjdGlvbicge1xuICBpZiAoZXhwbGljaXQpIHtcbiAgICByZXR1cm4gZXhwbGljaXQ7XG4gIH1cblxuICBjb25zdCBvdmVycmlkZUVudiA9IHByb2Nlc3MuZW52Lk9NRVRSSUFfQVBTX0VOVklST05NRU5UO1xuICBpZiAob3ZlcnJpZGVFbnYgPT09ICdkZXZlbG9wbWVudCcgfHwgb3ZlcnJpZGVFbnYgPT09ICdwcm9kdWN0aW9uJykge1xuICAgIHJldHVybiBvdmVycmlkZUVudjtcbiAgfVxuXG4gIGxldCB1bnJlY29uZ25pc2VkUHJvZmlsZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBmb3IgKGNvbnN0IGVudlZhciBvZiBbJ0VBU19CVUlMRF9QUk9GSUxFJywgJ0VYUE9fUFVCTElDX0FQUF9FTlYnXSkge1xuICAgIGNvbnN0IHZhbHVlID0gcHJvY2Vzcy5lbnZbZW52VmFyXT8udG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIXZhbHVlKSBjb250aW51ZTtcbiAgICBpZiAoUFJPRFVDVElPTl9QUk9GSUxFUy5oYXModmFsdWUpKSByZXR1cm4gJ3Byb2R1Y3Rpb24nO1xuICAgIGlmIChERVZFTE9QTUVOVF9QUk9GSUxFUy5oYXModmFsdWUpKSByZXR1cm4gJ2RldmVsb3BtZW50JztcbiAgICB1bnJlY29uZ25pc2VkUHJvZmlsZSA9IHZhbHVlO1xuICB9XG5cbiAgLy8gTm90IG9uIEVBUyDigJQgbG9jYWwgcHJlYnVpbGQuIFhjb2RlIG92ZXJyaWRlcyBhcHMtZW52aXJvbm1lbnQgZnJvbSB0aGVcbiAgLy8gcHJvdmlzaW9uaW5nIHByb2ZpbGUgYXQgYnVpbGQgdGltZSwgc28gdGhlIHZhbHVlIGhlcmUgZG9lc24ndCBtYXR0ZXIuXG4gIC8vIERlZmF1bHQgc2lsZW50bHkgdG8gZGV2ZWxvcG1lbnQuXG4gIGlmICghcHJvY2Vzcy5lbnYuRUFTX0JVSUxEKSB7XG4gICAgcmV0dXJuICdkZXZlbG9wbWVudCc7XG4gIH1cblxuICBjb25zdCBwcm9maWxlSGludCA9IHVucmVjb25nbmlzZWRQcm9maWxlXG4gICAgPyBgICh1bnJlY29nbmlzZWQgRUFTIHByb2ZpbGU6IFwiJHt1bnJlY29uZ25pc2VkUHJvZmlsZX1cIilgXG4gICAgOiAnJztcbiAgY29uc29sZS53YXJuKFxuICAgIGBbcmVhY3QtbmF0aXZlLW9tZXRyaWFdIENvdWxkIG5vdCBkZXRlcm1pbmUgQVBOcyBlbnZpcm9ubWVudCBmcm9tIGJ1aWxkIGNvbnRleHQke3Byb2ZpbGVIaW50fS4gYCArXG4gICAgICAnRGVmYXVsdGluZyBhcHMtZW52aXJvbm1lbnQgdG8gXCJwcm9kdWN0aW9uXCIuICcgK1xuICAgICAgJ1NldCBhcHNFbnZpcm9ubWVudCBpbiB0aGUgcGx1Z2luIGNvbmZpZyBvciBPTUVUUklBX0FQU19FTlZJUk9OTUVOVCBlbnYgdmFyIHRvIHNpbGVuY2UgdGhpcyB3YXJuaW5nLidcbiAgKTtcbiAgcmV0dXJuICdwcm9kdWN0aW9uJztcbn1cblxuLyoqXG4gKiBBZGRzIHB1c2ggbm90aWZpY2F0aW9uIGFuZCBhcHAgZ3JvdXAgZW50aXRsZW1lbnRzIHRvIHRoZSBtYWluIGFwcFxuICovXG5jb25zdCB3aXRoT21ldHJpYUVudGl0bGVtZW50czogQ29uZmlnUGx1Z2luPEludGVybmFsUGx1Z2luUHJvcHM+ID0gKFxuICBjb25maWcsXG4gIHByb3BzXG4pID0+IHtcbiAgcmV0dXJuIHdpdGhFbnRpdGxlbWVudHNQbGlzdChjb25maWcsIChtb2RDb25maWcpID0+IHtcbiAgICAvLyBBZGQgcHVzaCBub3RpZmljYXRpb24gZW50aXRsZW1lbnRcbiAgICBtb2RDb25maWcubW9kUmVzdWx0c1snYXBzLWVudmlyb25tZW50J10gPSBwcm9wcy5hcHNFbnZpcm9ubWVudDtcblxuICAgIC8vIEFkZCBhcHAgZ3JvdXAgZW50aXRsZW1lbnQgb25seSBpZiBhcHBHcm91cElkZW50aWZpZXIgaXMgcHJvdmlkZWQgKGZvciBOU0UpXG4gICAgaWYgKHByb3BzLmFwcEdyb3VwSWRlbnRpZmllcikge1xuICAgICAgY29uc3QgYXBwR3JvdXBzID1cbiAgICAgICAgbW9kQ29uZmlnLm1vZFJlc3VsdHNbJ2NvbS5hcHBsZS5zZWN1cml0eS5hcHBsaWNhdGlvbi1ncm91cHMnXTtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGFwcEdyb3VwcykpIHtcbiAgICAgICAgaWYgKCFhcHBHcm91cHMuaW5jbHVkZXMocHJvcHMuYXBwR3JvdXBJZGVudGlmaWVyKSkge1xuICAgICAgICAgIGFwcEdyb3Vwcy5wdXNoKHByb3BzLmFwcEdyb3VwSWRlbnRpZmllcik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1vZENvbmZpZy5tb2RSZXN1bHRzWydjb20uYXBwbGUuc2VjdXJpdHkuYXBwbGljYXRpb24tZ3JvdXBzJ10gPSBbXG4gICAgICAgICAgcHJvcHMuYXBwR3JvdXBJZGVudGlmaWVyLFxuICAgICAgICBdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBtb2RDb25maWc7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBXcml0ZXMgdGhlIGRlZmF1bHQgYXBwR3JvdXBJZGVudGlmaWVyIHRvIEluZm8ucGxpc3QgZm9yIEV4cG8gYXBwcy5cbiAqIFRoZSBuYXRpdmUgU0RLIHJlYWRzIHRoaXMgYXMgYSBmYWxsYmFjayB3aGVuIG5vIGFwcEdyb3VwSWRlbnRpZmllciBpcyBwYXNzZWQgYXQgcnVudGltZS5cbiAqL1xuY29uc3Qgd2l0aE9tZXRyaWFJbmZvUGxpc3Q6IENvbmZpZ1BsdWdpbjxJbnRlcm5hbFBsdWdpblByb3BzPiA9IChcbiAgY29uZmlnLFxuICBwcm9wc1xuKSA9PiB7XG4gIHJldHVybiB3aXRoSW5mb1BsaXN0KGNvbmZpZywgKG1vZENvbmZpZykgPT4ge1xuICAgIC8vIE9ubHkgd3JpdGUgaWYgTlNFIGlzIGVuYWJsZWQgYW5kIHdlIGhhdmUgYW4gYXBwR3JvdXBJZGVudGlmaWVyXG4gICAgaWYgKCFwcm9wcy5za2lwTlNFICYmIHByb3BzLmFwcEdyb3VwSWRlbnRpZmllcikge1xuICAgICAgbW9kQ29uZmlnLm1vZFJlc3VsdHNbJ09tZXRyaWFFeHBvRGVmYXVsdEFwcEdyb3VwSWRlbnRpZmllciddID1cbiAgICAgICAgcHJvcHMuYXBwR3JvdXBJZGVudGlmaWVyO1xuICAgIH1cbiAgICAvLyBXcml0ZSBSTiBTREsgdmVyc2lvbiBzbyBuYXRpdmUgY29kZSBjYW4gcmVhZCBpdCBpbnN0ZWFkIG9mIHVzaW5nIGEgaGFyZGNvZGVkIHZhbHVlXG4gICAgbW9kQ29uZmlnLm1vZFJlc3VsdHNbJ09tZXRyaWFSTlNka1ZlcnNpb24nXSA9IHByb3BzLnJuU2RrVmVyc2lvbjtcbiAgICByZXR1cm4gbW9kQ29uZmlnO1xuICB9KTtcbn07XG5cbi8qKlxuICogTW9kaWZpZXMgdGhlIFBvZGZpbGUgdG8gYWRkIE9tZXRyaWEtc3BlY2lmaWMgY29uZmlndXJhdGlvbnNcbiAqL1xuY29uc3Qgd2l0aE9tZXRyaWFQb2RmaWxlOiBDb25maWdQbHVnaW48SW50ZXJuYWxQbHVnaW5Qcm9wcz4gPSAoY29uZmlnLCBwcm9wcykgPT4ge1xuICByZXR1cm4gd2l0aFBvZGZpbGUoY29uZmlnLCAobW9kQ29uZmlnKSA9PiB7XG4gICAgLy8gUmVtaW5kIGFib3V0IHRoZSBpT1Mgc2V0dGluZ3MgUmVhY3QgTmF0aXZlIEZpcmViYXNlIG5lZWRzIHdpdGggT21ldHJpYSAyLnhcbiAgICBpZiAoaGFzUmVhY3ROYXRpdmVGaXJlYmFzZShtb2RDb25maWcubW9kUmVxdWVzdC5wcm9qZWN0Um9vdCkpIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgJ1tyZWFjdC1uYXRpdmUtb21ldHJpYV0gUmVhY3QgTmF0aXZlIEZpcmViYXNlIGRldGVjdGVkLiBPbiBpT1MsIE9tZXRyaWEgMi54IG5lZWRzIHN0YXRpYyBsaW5raW5nOiAnICtcbiAgICAgICAgICAnc2V0IFwidXNlRnJhbWV3b3Jrc1wiOiBcInN0YXRpY1wiIGFuZCBcImZvcmNlU3RhdGljTGlua2luZ1wiOiBbXCJSTkZCQXBwXCIsIFwiUk5GQk1lc3NhZ2luZ1wiXSBpbiBleHBvLWJ1aWxkLXByb3BlcnRpZXMsICcgK1xuICAgICAgICAgICdhbmQgd2l0aCBSZWFjdCBOYXRpdmUgRmlyZWJhc2UgMjYuMSBvciBsYXRlciBhbHNvIHNldCB7IFwiaW9zXCI6IHsgXCJkaXNhYmxlU1BNXCI6IHRydWUgfSB9IG9uIHRoZSAnICtcbiAgICAgICAgICAnXCJAcmVhY3QtbmF0aXZlLWZpcmViYXNlL2FwcFwiIHBsdWdpbi4gUmVhY3QgTmF0aXZlIEZpcmViYXNlIDI3IGlzblxcJ3Qgc3VwcG9ydGVkIG9uIDIueDsgaXQgd2lsbCBiZSBpbiB0aGUgbmV4dCBtYWpvciB2ZXJzaW9uLiAnICtcbiAgICAgICAgICAnU2VlOiBodHRwczovL21vYmlsZS1zZGsuZG9jcy5vbWV0cmlhLmNvbS9yZWFjdC1uYXRpdmUvaW5zdGFsbGF0aW9uJ1xuICAgICAgKTtcbiAgICB9XG5cbiAgICBsZXQgcG9kZmlsZSA9IG1vZENvbmZpZy5tb2RSZXN1bHRzLmNvbnRlbnRzO1xuXG4gICAgLy8gQWRkIFR1cmJvTW9kdWxlIHNjcmlwdCByZXF1aXJlIGF0IHRoZSB0b3AgKGFmdGVyIG90aGVyIHJlcXVpcmVzKVxuICAgIHBvZGZpbGUgPSBhZGRUdXJib01vZHVsZVJlcXVpcmUocG9kZmlsZSk7XG5cbiAgICAvLyBBZGQgcGF0Y2hfb21ldHJpYV90dXJib21vZHVsZSBjYWxsIGluIHBvc3RfaW5zdGFsbFxuICAgIHBvZGZpbGUgPSBhZGRUdXJib01vZHVsZVBhdGNoKHBvZGZpbGUpO1xuXG4gICAgLy8gQWRkIG9sZCBhcmNoaXRlY3R1cmUgbW9kdWxlbWFwIGZpeCBpbiBwb3N0X2luc3RhbGxcbiAgICBwb2RmaWxlID0gYWRkT2xkQXJjaE1vZHVsZW1hcEZpeChwb2RmaWxlKTtcblxuICAgIC8vIEFkZCBOU0UgdGFyZ2V0IGZvciByaWNoIHB1c2ggbm90aWZpY2F0aW9ucyAob25seSBpZiBub3Qgc2tpcHBlZClcbiAgICBpZiAoIXByb3BzLnNraXBOU0UpIHtcbiAgICAgIHBvZGZpbGUgPSBhZGROb3RpZmljYXRpb25TZXJ2aWNlVGFyZ2V0KFxuICAgICAgICBwb2RmaWxlLFxuICAgICAgICBwcm9wcy5vbWV0cmlhSW9zU2RrVmVyc2lvblxuICAgICAgKTtcbiAgICB9XG5cbiAgICBtb2RDb25maWcubW9kUmVzdWx0cy5jb250ZW50cyA9IHBvZGZpbGU7XG4gICAgcmV0dXJuIG1vZENvbmZpZztcbiAgfSk7XG59O1xuXG5mdW5jdGlvbiBoYXNSZWFjdE5hdGl2ZUZpcmViYXNlKHByb2plY3RSb290OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwa2dQYXRoID0gcGF0aC5qb2luKHByb2plY3RSb290LCAncGFja2FnZS5qc29uJyk7XG4gICAgY29uc3QgcGtnID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocGtnUGF0aCwgJ3V0ZjgnKSkgPz8ge307XG4gICAgY29uc3QgZGVwcyA9IHsgLi4ucGtnLmRlcGVuZGVuY2llcywgLi4ucGtnLmRldkRlcGVuZGVuY2llcyB9O1xuICAgIHJldHVybiBCb29sZWFuKGRlcHNbJ0ByZWFjdC1uYXRpdmUtZmlyZWJhc2UvYXBwJ10pO1xuICB9IGNhdGNoIHtcbiAgICAvLyBpZ25vcmUg4oCUIHBhY2thZ2UuanNvbiB1bnJlYWRhYmxlXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogTWFrZXMgc3VyZSBGaXJlYmFzZUFwcC5jb25maWd1cmUoKSBydW5zIGF0IGxhdW5jaCBvbiBFeHBvIGFwcHMgdXNpbmcgUmVhY3QgTmF0aXZlIEZpcmViYXNlLlxuICpcbiAqIFByb2JsZW06IEV4cG8gU0RLIDU4IG1vdmVkIHRvIGEgc2NlbmUtYmFzZWQgQXBwRGVsZWdhdGUgKFNjZW5lRGVsZWdhdGUgc3RhcnRzIFJlYWN0IE5hdGl2ZSkuXG4gKiBAcmVhY3QtbmF0aXZlLWZpcmViYXNlL2FwcCdzIGNvbmZpZyBwbHVnaW4gdXAgdG8gMjYueCBsb29rcyBmb3IgYGZhY3Rvcnkuc3RhcnRSZWFjdE5hdGl2ZShgLFxuICogZG9lc24ndCBmaW5kIGl0IGFuZCBza2lwcyBGaXJlYmFzZUFwcC5jb25maWd1cmUoKSB3aXRoIG9ubHkgYSBwcmVidWlsZCB3YXJuaW5nLCBzbyBGaXJlYmFzZVxuICogbmV2ZXIgaW5pdGlhbGlzZXMgYW5kIG5vIEZDTSB0b2tlbiBpcyBpc3N1ZWQuIFRoZSBmaXggb25seSBzaGlwcyBpbiBSTkZCIDI3LCB3aGljaCBPbWV0cmlhIDIueFxuICogY2FuJ3QgdXNlIChSTkZCIDI3IGlzIFNQTS1vbmx5KS5cbiAqXG4gKiBTb2x1dGlvbjogaW5zZXJ0IHRoZSBjYWxsIG91cnNlbHZlcyB3aGVuIGl0J3MgbWlzc2luZywgdXNpbmcgdGhlIHNhbWUgYW5jaG9ycyBhcyBSTkZCIDI3LlxuICogSWYgUk5GQidzIHBsdWdpbiBhbHJlYWR5IGluc2VydGVkIGl0IChFeHBvIDw9IDU3LCBvciBSTkZCIDI3KyksIHRoaXMgaXMgYSBuby1vcC5cbiAqL1xuY29uc3Qgd2l0aE9tZXRyaWFGaXJlYmFzZUNvbmZpZ3VyZTogQ29uZmlnUGx1Z2luID0gKGNvbmZpZykgPT4ge1xuICByZXR1cm4gd2l0aEFwcERlbGVnYXRlKGNvbmZpZywgKG1vZENvbmZpZykgPT4ge1xuICAgIGlmIChcbiAgICAgICFzaG91bGRBZGRGaXJlYmFzZUNvbmZpZ3VyZShcbiAgICAgICAgbW9kQ29uZmlnLm1vZFJlc3VsdHMubGFuZ3VhZ2UsXG4gICAgICAgIG1vZENvbmZpZy5pb3M/Lmdvb2dsZVNlcnZpY2VzRmlsZSxcbiAgICAgICAgbW9kQ29uZmlnLm1vZFJlcXVlc3QucHJvamVjdFJvb3RcbiAgICAgIClcbiAgICApIHtcbiAgICAgIHJldHVybiBtb2RDb25maWc7XG4gICAgfVxuXG4gICAgY29uc3QgY29udGVudHMgPSBhZGRGaXJlYmFzZUNvbmZpZ3VyZShtb2RDb25maWcubW9kUmVzdWx0cy5jb250ZW50cyk7XG4gICAgaWYgKGNvbnRlbnRzICE9PSBtb2RDb25maWcubW9kUmVzdWx0cy5jb250ZW50cykge1xuICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICdbcmVhY3QtbmF0aXZlLW9tZXRyaWFdIEFkZGVkIEZpcmViYXNlQXBwLmNvbmZpZ3VyZSgpIHRvIEFwcERlbGVnYXRlLnN3aWZ0ICcgK1xuICAgICAgICAgICcodGhlIEByZWFjdC1uYXRpdmUtZmlyZWJhc2UvYXBwIHBsdWdpbiBza2lwcGVkIGl0OyBpdHMgXCJTa2lwcGluZyBGaXJlYmFzZSBhZGRpdGlvblwiIHdhcm5pbmcgY2FuIGJlIGlnbm9yZWQpLidcbiAgICAgICk7XG4gICAgfVxuICAgIG1vZENvbmZpZy5tb2RSZXN1bHRzLmNvbnRlbnRzID0gY29udGVudHM7XG4gICAgcmV0dXJuIG1vZENvbmZpZztcbiAgfSk7XG59O1xuXG4vKipcbiAqIE9ubHkgU3dpZnQgQXBwRGVsZWdhdGVzIG9mIGFwcHMgdGhhdCB1c2UgUmVhY3QgTmF0aXZlIEZpcmViYXNlIHdpdGggYSBHb29nbGVTZXJ2aWNlLUluZm8ucGxpc3RcbiAqIGdldCBGaXJlYmFzZUFwcC5jb25maWd1cmUoKTsgd2l0aG91dCB0aGUgcGxpc3QsIGNvbmZpZ3VyZSgpIHdvdWxkIGNyYXNoIGF0IGxhdW5jaC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNob3VsZEFkZEZpcmViYXNlQ29uZmlndXJlKFxuICBsYW5ndWFnZTogc3RyaW5nLFxuICBnb29nbGVTZXJ2aWNlc0ZpbGU6IHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgcHJvamVjdFJvb3Q6IHN0cmluZ1xuKTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgbGFuZ3VhZ2UgPT09ICdzd2lmdCcgJiZcbiAgICBCb29sZWFuKGdvb2dsZVNlcnZpY2VzRmlsZSkgJiZcbiAgICBoYXNSZWFjdE5hdGl2ZUZpcmViYXNlKHByb2plY3RSb290KVxuICApO1xufVxuXG5jb25zdCBGSVJFQkFTRV9DT05GSUdVUkVfQU5DSE9SID1cbiAgLyg/OnNlbGZcXC5tb2R1bGVOYW1lXFxzKj1cXHMqXCJbXlwiXSpcIil8KD86ZmFjdG9yeVxcLnN0YXJ0UmVhY3ROYXRpdmVcXCgpfCg/OnJldHVyblxccytzdXBlclxcLmFwcGxpY2F0aW9uXFwoXFxzKmFwcGxpY2F0aW9uXFxzKixcXHMqZGlkRmluaXNoTGF1bmNoaW5nV2l0aE9wdGlvbnM6XFxzKmxhdW5jaE9wdGlvbnNcXHMqXFwpKS87XG5cbi8vIGBpbXBvcnQgRmlyZWJhc2VDb3JlYCBvciB0aGUgYEZpcmViYXNlYCB1bWJyZWxsYSwgd2l0aCBhbnkgYXR0cmlidXRlcyBvciBhY2Nlc3MgbGV2ZWxcbmNvbnN0IEZJUkVCQVNFX0lNUE9SVCA9XG4gIC9eWyBcXHRdKig/OkBcXHcrWyBcXHRdKykqKD86KD86cHVibGljfHBhY2thZ2V8aW50ZXJuYWx8ZmlsZXByaXZhdGV8cHJpdmF0ZSlbIFxcdF0rKT9pbXBvcnRbIFxcdF0rKD86RmlyZWJhc2VDb3JlfEZpcmViYXNlKVxcYi9tO1xuXG5leHBvcnQgZnVuY3Rpb24gYWRkRmlyZWJhc2VDb25maWd1cmUoYXBwRGVsZWdhdGU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICgvRmlyZWJhc2VBcHBcXC5jb25maWd1cmVcXCgvLnRlc3QoYXBwRGVsZWdhdGUpKSB7XG4gICAgcmV0dXJuIGFwcERlbGVnYXRlO1xuICB9XG5cbiAgY29uc3QgYW5jaG9yID0gYXBwRGVsZWdhdGUubWF0Y2goRklSRUJBU0VfQ09ORklHVVJFX0FOQ0hPUik7XG4gIGlmICghYW5jaG9yIHx8IGFuY2hvci5pbmRleCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc29sZS53YXJuKFxuICAgICAgJ1tyZWFjdC1uYXRpdmUtb21ldHJpYV0gQ291bGQgbm90IGZpbmQgd2hlcmUgdG8gYWRkIEZpcmViYXNlQXBwLmNvbmZpZ3VyZSgpIGluIEFwcERlbGVnYXRlLnN3aWZ0LiAnICtcbiAgICAgICAgJ0FkZCBpdCBtYW51YWxseSB0byBhcHBsaWNhdGlvbihfOmRpZEZpbmlzaExhdW5jaGluZ1dpdGhPcHRpb25zOiksIG90aGVyd2lzZSBwdXNoIG5vdGlmaWNhdGlvbnMgd2lsbCBub3Qgd29yay4nXG4gICAgKTtcbiAgICByZXR1cm4gYXBwRGVsZWdhdGU7XG4gIH1cblxuICBjb25zdCBsaW5lU3RhcnQgPSBhcHBEZWxlZ2F0ZS5sYXN0SW5kZXhPZignXFxuJywgYW5jaG9yLmluZGV4KSArIDE7XG4gIGNvbnN0IGluZGVudCA9IGFwcERlbGVnYXRlLnNsaWNlKGxpbmVTdGFydCkubWF0Y2goL15bIFxcdF0qLyk/LlswXSA/PyAnJztcbiAgbGV0IGNvbnRlbnRzID1cbiAgICBhcHBEZWxlZ2F0ZS5zbGljZSgwLCBsaW5lU3RhcnQpICtcbiAgICBgJHtpbmRlbnR9Ly8gW09tZXRyaWFdIENvbmZpZ3VyZSBGaXJlYmFzZSAoUk5GQiA8PSAyNiBza2lwcyB0aGlzIG9uIEV4cG8gNTgrKVxcbmAgK1xuICAgIGAke2luZGVudH1pZiBGaXJlYmFzZUFwcC5hcHAoKSA9PSBuaWwge1xcbmAgK1xuICAgIGAke2luZGVudH0gIEZpcmViYXNlQXBwLmNvbmZpZ3VyZSgpXFxuYCArXG4gICAgYCR7aW5kZW50fX1cXG5gICtcbiAgICBhcHBEZWxlZ2F0ZS5zbGljZShsaW5lU3RhcnQpO1xuXG4gIGlmICghRklSRUJBU0VfSU1QT1JULnRlc3QoY29udGVudHMpKSB7XG4gICAgY29uc3QgaW1wb3J0QW5jaG9yID1cbiAgICAgIGNvbnRlbnRzLm1hdGNoKC9eWyBcXHRdKig/OmludGVybmFsXFxzKyk/aW1wb3J0XFxzK0V4cG9bIFxcdF0qJC9tKSA/P1xuICAgICAgY29udGVudHMubWF0Y2goL15bIFxcdF0qaW1wb3J0XFxiW15cXHJcXG5dKiQvbSk7XG4gICAgaWYgKGltcG9ydEFuY2hvciAmJiBpbXBvcnRBbmNob3IuaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgaW5zZXJ0SW5kZXggPSBpbXBvcnRBbmNob3IuaW5kZXggKyBpbXBvcnRBbmNob3JbMF0ubGVuZ3RoO1xuICAgICAgY29udGVudHMgPVxuICAgICAgICBjb250ZW50cy5zbGljZSgwLCBpbnNlcnRJbmRleCkgK1xuICAgICAgICAnXFxuaW1wb3J0IEZpcmViYXNlQ29yZScgK1xuICAgICAgICBjb250ZW50cy5zbGljZShpbnNlcnRJbmRleCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRlbnRzID0gYGltcG9ydCBGaXJlYmFzZUNvcmVcXG4ke2NvbnRlbnRzfWA7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbnRlbnRzO1xufVxuXG5mdW5jdGlvbiBhZGRUdXJib01vZHVsZVJlcXVpcmUocG9kZmlsZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgcmVxdWlyZVN0YXRlbWVudCA9XG4gICAgXCJyZXF1aXJlX3JlbGF0aXZlICcuLi9ub2RlX21vZHVsZXMvcmVhY3QtbmF0aXZlLW9tZXRyaWEvc2NyaXB0cy9vbWV0cmlhX3R1cmJvbW9kdWxlJ1wiO1xuXG4gIGlmIChwb2RmaWxlLmluY2x1ZGVzKCdvbWV0cmlhX3R1cmJvbW9kdWxlJykpIHtcbiAgICByZXR1cm4gcG9kZmlsZTtcbiAgfVxuXG4gIC8vIEZpbmQgYSBnb29kIHBsYWNlIHRvIGluc2VydCAtIGFmdGVyIHBsYXRmb3JtIGRlY2xhcmF0aW9uIG9yIGFmdGVyIG90aGVyIHJlcXVpcmVzXG4gIGNvbnN0IHBsYXRmb3JtTWF0Y2ggPSBwb2RmaWxlLm1hdGNoKC9wbGF0Zm9ybSA6aW9zLipcXG4vKTtcbiAgaWYgKHBsYXRmb3JtTWF0Y2gpIHtcbiAgICBjb25zdCBpbnNlcnRJbmRleCA9IChwbGF0Zm9ybU1hdGNoLmluZGV4IHx8IDApICsgcGxhdGZvcm1NYXRjaFswXS5sZW5ndGg7XG4gICAgcmV0dXJuIChcbiAgICAgIHBvZGZpbGUuc2xpY2UoMCwgaW5zZXJ0SW5kZXgpICtcbiAgICAgIGBcXG4jIFtPbWV0cmlhXSBUdXJib01vZHVsZSByZWdpc3RyYXRpb24gZm9yIE5ldyBBcmNoaXRlY3R1cmVcXG4ke3JlcXVpcmVTdGF0ZW1lbnR9XFxuYCArXG4gICAgICBwb2RmaWxlLnNsaWNlKGluc2VydEluZGV4KVxuICAgICk7XG4gIH1cblxuICAvLyBGYWxsYmFjazogYWRkIGF0IHRoZSBiZWdpbm5pbmdcbiAgcmV0dXJuIGAjIFtPbWV0cmlhXSBUdXJib01vZHVsZSByZWdpc3RyYXRpb24gZm9yIE5ldyBBcmNoaXRlY3R1cmVcXG4ke3JlcXVpcmVTdGF0ZW1lbnR9XFxuXFxuJHtwb2RmaWxlfWA7XG59XG5cbmZ1bmN0aW9uIGFkZFR1cmJvTW9kdWxlUGF0Y2gocG9kZmlsZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKHBvZGZpbGUuaW5jbHVkZXMoJ3BhdGNoX29tZXRyaWFfdHVyYm9tb2R1bGUnKSkge1xuICAgIHJldHVybiBwb2RmaWxlO1xuICB9XG5cbiAgLy8gRmluZCBwb3N0X2luc3RhbGwgYmxvY2sgYW5kIGFkZCB0aGUgcGF0Y2ggY2FsbFxuICBjb25zdCBwb3N0SW5zdGFsbE1hdGNoID0gcG9kZmlsZS5tYXRjaCgvcG9zdF9pbnN0YWxsIGRvIFxcfGluc3RhbGxlclxcfC8pO1xuICBpZiAocG9zdEluc3RhbGxNYXRjaCAmJiBwb3N0SW5zdGFsbE1hdGNoLmluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICBjb25zdCBpbnNlcnRJbmRleCA9IHBvc3RJbnN0YWxsTWF0Y2guaW5kZXggKyBwb3N0SW5zdGFsbE1hdGNoWzBdLmxlbmd0aDtcbiAgICByZXR1cm4gKFxuICAgICAgcG9kZmlsZS5zbGljZSgwLCBpbnNlcnRJbmRleCkgK1xuICAgICAgJ1xcbiAgICAjIFtPbWV0cmlhXSBSZWdpc3RlciBUdXJib01vZHVsZSBmb3IgTmV3IEFyY2hpdGVjdHVyZVxcbiAgICBwYXRjaF9vbWV0cmlhX3R1cmJvbW9kdWxlKGluc3RhbGxlcilcXG4nICtcbiAgICAgIHBvZGZpbGUuc2xpY2UoaW5zZXJ0SW5kZXgpXG4gICAgKTtcbiAgfVxuXG4gIGNvbnNvbGUud2FybihcbiAgICAnW09tZXRyaWFdIENvdWxkIG5vdCBmaW5kIHBvc3RfaW5zdGFsbCBibG9jayBpbiBQb2RmaWxlLiAnICtcbiAgICAgICdUdXJib01vZHVsZSBwYXRjaCBtYXkgbmVlZCB0byBiZSBhZGRlZCBtYW51YWxseS4nXG4gICk7XG4gIHJldHVybiBwb2RmaWxlO1xufVxuXG4vKipcbiAqIEFkZHMgbW9kdWxlbWFwIGZpeCBmb3Igb2xkIGFyY2hpdGVjdHVyZSBjb21wYXRpYmlsaXR5IHdpdGggdXNlX21vZHVsYXJfaGVhZGVycyFcbiAqXG4gKiBQcm9ibGVtOiBXaGVuIHVzaW5nIHVzZV9tb2R1bGFyX2hlYWRlcnMhICsgb2xkIGFyY2hpdGVjdHVyZSArIFJOIDAuODErLFxuICogbXVsdGlwbGUgbW9kdWxlbWFwcyBpbiB0aGUgc2FtZSBkaXJlY3RvcnkgZGVmaW5lIGlkZW50aWNhbCBtb2R1bGUgbmFtZXMgd2l0aFxuICogdW1icmVsbGEgaGVhZGVycywgY2F1c2luZyBcIlJlZGVmaW5pdGlvbiBvZiBtb2R1bGVcIiBidWlsZCBlcnJvcnMuXG4gKlxuICogU29sdXRpb246IFJlcGxhY2UgY29uZmxpY3RpbmcgbW9kdWxlbWFwcyB3aXRoIGVtcHR5IG1vZHVsZXMgKGRpZmZlcmVudCBuYW1lcywgbm8gdW1icmVsbGEpXG4gKiBUaGlzIGZpeCBpcyBvbmx5IGFwcGxpZWQgd2hlbiBuZXdBcmNoRW5hYmxlZCBpcyBmYWxzZS5cbiAqL1xuZnVuY3Rpb24gYWRkT2xkQXJjaE1vZHVsZW1hcEZpeChwb2RmaWxlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoXG4gICAgcG9kZmlsZS5pbmNsdWRlcygncmVhY3RfanNpdG9vbGluZycpICYmXG4gICAgcG9kZmlsZS5pbmNsdWRlcygncmVhY3RfcnVudGltZWFwcGxlJylcbiAgKSB7XG4gICAgcmV0dXJuIHBvZGZpbGU7XG4gIH1cblxuICBjb25zdCBtb2R1bGVtYXBGaXggPSBgXG4gICAgIyBbT21ldHJpYV0gRml4IG1vZHVsZW1hcCByZWRlZmluaXRpb24gZXJyb3JzIHdoZW4gdXNpbmcgdXNlX21vZHVsYXJfaGVhZGVycyEgKyBvbGQgYXJjaCArIFJOIDAuODErXG4gICAgIyBQcm9ibGVtOiBNdWx0aXBsZSBtb2R1bGVtYXBzIGluIHNhbWUgZGlyZWN0b3J5IGRlZmluZSBpZGVudGljYWwgbW9kdWxlIG5hbWVzIHdpdGggdW1icmVsbGEgaGVhZGVyc1xuICAgICMgU29sdXRpb246IFJlcGxhY2UgY29uZmxpY3RpbmcgbW9kdWxlbWFwcyB3aXRoIGVtcHR5IG1vZHVsZXMgKGRpZmZlcmVudCBuYW1lcywgbm8gdW1icmVsbGEpXG4gICAgaWYgcG9kZmlsZV9wcm9wZXJ0aWVzWyduZXdBcmNoRW5hYmxlZCddID09ICdmYWxzZSdcbiAgICAgICMgRml4IDE6IHJlYWN0X3J1bnRpbWUgbW9kdWxlIHJlZGVmaW5pdGlvbiAoUmVhY3QtanNpdG9vbGluZyB2cyBSZWFjdC1SdW50aW1lQ29yZSlcbiAgICAgIGpzaXRvb2xpbmdfcGF0aCA9IFwiI3tpbnN0YWxsZXIuc2FuZGJveC5yb290fS9UYXJnZXQgU3VwcG9ydCBGaWxlcy9SZWFjdC1qc2l0b29saW5nL1JlYWN0LWpzaXRvb2xpbmcubW9kdWxlbWFwXCJcbiAgICAgIGlmIEZpbGUuZXhpc3Q/KGpzaXRvb2xpbmdfcGF0aClcbiAgICAgICAgRmlsZS53cml0ZShqc2l0b29saW5nX3BhdGgsIFwibW9kdWxlIHJlYWN0X2pzaXRvb2xpbmcge1xcXFxufVxcXFxuXCIpXG4gICAgICAgIHB1dHMgXCJbT21ldHJpYV0gRml4ZWQgUmVhY3QtanNpdG9vbGluZy5tb2R1bGVtYXAgKHJlYWN0X3J1bnRpbWUgY29uZmxpY3QpXCJcbiAgICAgIGVuZFxuXG4gICAgICAjIEZpeCAyOiBSZWFjdENvbW1vbiBtb2R1bGUgcmVkZWZpbml0aW9uIChSZWFjdC1SdW50aW1lQXBwbGUgdnMgUmVhY3RDb21tb24pXG4gICAgICBydW50aW1lYXBwbGVfcGF0aCA9IFwiI3tpbnN0YWxsZXIuc2FuZGJveC5yb290fS9UYXJnZXQgU3VwcG9ydCBGaWxlcy9SZWFjdC1SdW50aW1lQXBwbGUvUmVhY3QtUnVudGltZUFwcGxlLm1vZHVsZW1hcFwiXG4gICAgICBpZiBGaWxlLmV4aXN0PyhydW50aW1lYXBwbGVfcGF0aClcbiAgICAgICAgRmlsZS53cml0ZShydW50aW1lYXBwbGVfcGF0aCwgXCJtb2R1bGUgcmVhY3RfcnVudGltZWFwcGxlIHtcXFxcbn1cXFxcblwiKVxuICAgICAgICBwdXRzIFwiW09tZXRyaWFdIEZpeGVkIFJlYWN0LVJ1bnRpbWVBcHBsZS5tb2R1bGVtYXAgKFJlYWN0Q29tbW9uIGNvbmZsaWN0KVwiXG4gICAgICBlbmRcbiAgICBlbmRcbmA7XG5cbiAgLy8gRmluZCByZWFjdF9uYXRpdmVfcG9zdF9pbnN0YWxsIGFuZCBpdHMgY2xvc2luZyBwYXJlbnRoZXNpc1xuICAvLyBUaGUgZnVuY3Rpb24gY2FsbCBzcGFucyBtdWx0aXBsZSBsaW5lcywgc28gd2UgbmVlZCB0byBmaW5kIHRoZSBtYXRjaGluZyBjbG9zaW5nIClcbiAgY29uc3QgcG9zdEluc3RhbGxTdGFydCA9IHBvZGZpbGUuaW5kZXhPZigncmVhY3RfbmF0aXZlX3Bvc3RfaW5zdGFsbCgnKTtcbiAgaWYgKHBvc3RJbnN0YWxsU3RhcnQgIT09IC0xKSB7XG4gICAgLy8gQ291bnQgcGFyZW50aGVzZXMgdG8gZmluZCB0aGUgbWF0Y2hpbmcgY2xvc2luZyApXG4gICAgbGV0IGRlcHRoID0gMDtcbiAgICBsZXQgZm91bmRTdGFydCA9IGZhbHNlO1xuICAgIGxldCBlbmRJbmRleCA9IC0xO1xuXG4gICAgZm9yIChsZXQgaSA9IHBvc3RJbnN0YWxsU3RhcnQ7IGkgPCBwb2RmaWxlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocG9kZmlsZVtpXSA9PT0gJygnKSB7XG4gICAgICAgIGRlcHRoKys7XG4gICAgICAgIGZvdW5kU3RhcnQgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChwb2RmaWxlW2ldID09PSAnKScpIHtcbiAgICAgICAgZGVwdGgtLTtcbiAgICAgICAgaWYgKGZvdW5kU3RhcnQgJiYgZGVwdGggPT09IDApIHtcbiAgICAgICAgICBlbmRJbmRleCA9IGk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZW5kSW5kZXggIT09IC0xKSB7XG4gICAgICAvLyBGaW5kIHRoZSBlbmQgb2YgdGhlIGxpbmUgYWZ0ZXIgdGhlIGNsb3NpbmcgKVxuICAgICAgY29uc3QgbGluZUVuZCA9IHBvZGZpbGUuaW5kZXhPZignXFxuJywgZW5kSW5kZXgpO1xuICAgICAgaWYgKGxpbmVFbmQgIT09IC0xKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgcG9kZmlsZS5zbGljZSgwLCBsaW5lRW5kICsgMSkgK1xuICAgICAgICAgIG1vZHVsZW1hcEZpeCArXG4gICAgICAgICAgcG9kZmlsZS5zbGljZShsaW5lRW5kICsgMSlcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zb2xlLndhcm4oXG4gICAgJ1tPbWV0cmlhXSBDb3VsZCBub3QgZmluZCByZWFjdF9uYXRpdmVfcG9zdF9pbnN0YWxsIGluIFBvZGZpbGUuICcgK1xuICAgICAgJ09sZCBhcmNoaXRlY3R1cmUgbW9kdWxlbWFwIGZpeCBtYXkgbmVlZCB0byBiZSBhZGRlZCBtYW51YWxseS4nXG4gICk7XG4gIHJldHVybiBwb2RmaWxlO1xufVxuXG5mdW5jdGlvbiBhZGROb3RpZmljYXRpb25TZXJ2aWNlVGFyZ2V0KFxuICBwb2RmaWxlOiBzdHJpbmcsXG4gIHNka1ZlcnNpb246IHN0cmluZ1xuKTogc3RyaW5nIHtcbiAgaWYgKHBvZGZpbGUuaW5jbHVkZXMoXCJ0YXJnZXQgJ09tZXRyaWFOb3RpZmljYXRpb25TZXJ2aWNlRXh0ZW5zaW9uJ1wiKSkge1xuICAgIHJldHVybiBwb2RmaWxlO1xuICB9XG5cbiAgLy8gVXNlIGEgc3RhbmRhbG9uZSB0YXJnZXQgd2l0aCBpbmhlcml0ISA6c2VhcmNoX3BhdGhzXG4gIC8vIFRoaXMgdGVsbHMgQ29jb2FQb2RzIHRvIGluaGVyaXQgc2VhcmNoIHBhdGhzIGZyb20gdGhlIGltcGxpY2l0IHBhcmVudFxuICAvLyB3aXRob3V0IHJlcXVpcmluZyBzdHJpY3QgaG9zdCB0YXJnZXQgdmVyaWZpY2F0aW9uIGluIHRoZSBYY29kZSBwcm9qZWN0XG4gIC8vXG4gIC8vIE1pcnJvciB0aGUgbWFpbiB0YXJnZXQncyB1c2VfZnJhbWV3b3JrcyEgc2V0dGluZyBzbyBDb2NvYVBvZHMgZG9lc24ndFxuICAvLyBjb21wbGFpbiB0aGF0IHRoZSBob3N0IGFuZCBleHRlbnNpb24gdGFyZ2V0cyBkb24ndCBtYXRjaC5cbiAgY29uc3QgbnNlVGFyZ2V0ID0gYFxuIyBbT21ldHJpYV0gTm90aWZpY2F0aW9uIFNlcnZpY2UgRXh0ZW5zaW9uIGZvciByaWNoIHB1c2ggbm90aWZpY2F0aW9uc1xudGFyZ2V0ICdPbWV0cmlhTm90aWZpY2F0aW9uU2VydmljZUV4dGVuc2lvbicgZG9cbiAgaW5oZXJpdCEgOnNlYXJjaF9wYXRoc1xuICB1c2VfbW9kdWxhcl9oZWFkZXJzIVxuICB1c2VfZnJhbWV3b3JrcyEgOmxpbmthZ2UgPT4gcG9kZmlsZV9wcm9wZXJ0aWVzWydpb3MudXNlRnJhbWV3b3JrcyddLnRvX3N5bSBpZiBwb2RmaWxlX3Byb3BlcnRpZXNbJ2lvcy51c2VGcmFtZXdvcmtzJ11cbiAgcG9kICdPbWV0cmlhJywgJ34+ICR7c2RrVmVyc2lvbn0nXG5lbmRcbmA7XG5cbiAgLy8gQWRkIGF0IHRoZSBlbmQgb2YgdGhlIGZpbGUgKG91dHNpZGUgbWFpbiB0YXJnZXQpXG4gIHJldHVybiBwb2RmaWxlICsgbnNlVGFyZ2V0O1xufVxuXG4vKipcbiAqIE1haW4gaU9TIGNvbmZpZ3VyYXRpb24gZm9yIE9tZXRyaWFcbiAqL1xuZXhwb3J0IGNvbnN0IHdpdGhPbWV0cmlhSW9zOiBDb25maWdQbHVnaW48SW9zUGx1Z2luUHJvcHM+ID0gKGNvbmZpZywgcHJvcHMpID0+IHtcbiAgY29uc3QgeyBza2lwTlNFLCBvbWV0cmlhSW9zU2RrVmVyc2lvbiB9ID0gcHJvcHM7XG5cbiAgaWYgKHNraXBOU0UpIHtcbiAgICBjb25zb2xlLndhcm4oXG4gICAgICAn4pqg77iPICBbcmVhY3QtbmF0aXZlLW9tZXRyaWFdIHNraXBOU0UgaXMgZW5hYmxlZC4gUmljaCBwdXNoIG5vdGlmaWNhdGlvbiBjb250ZW50IChpbWFnZXMsIGV0Yy4pIHdpbGwgbm90IHdvcmsgb24gaU9TLidcbiAgICApO1xuICB9XG5cbiAgLy8gVXNlIGN1c3RvbSBhcHBHcm91cElkZW50aWZpZXIgaWYgcHJvdmlkZWQsIG90aGVyd2lzZSBhdXRvLWdlbmVyYXRlIGZyb20gYnVuZGxlSWRlbnRpZmllclxuICBjb25zdCBidW5kbGVJZGVudGlmaWVyID0gY29uZmlnLmlvcz8uYnVuZGxlSWRlbnRpZmllcjtcbiAgaWYgKCFidW5kbGVJZGVudGlmaWVyICYmICFza2lwTlNFICYmICFwcm9wcy5jdXN0b21BcHBHcm91cElkZW50aWZpZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnW3JlYWN0LW5hdGl2ZS1vbWV0cmlhXSBpb3MuYnVuZGxlSWRlbnRpZmllciBpcyByZXF1aXJlZCBpbiBhcHAuanNvbi9hcHAuY29uZmlnLmpzIGZvciBOU0Ugc2V0dXAuICcgK1xuICAgICAgICAnRWl0aGVyIHNldCBpb3MuYnVuZGxlSWRlbnRpZmllciwgcHJvdmlkZSBjdXN0b21BcHBHcm91cElkZW50aWZpZXIsIG9yIHVzZSBza2lwTlNFOiB0cnVlIHRvIHNraXAgcmljaCBub3RpZmljYXRpb25zLidcbiAgICApO1xuICB9XG5cbiAgY29uc3QgYXBwR3JvdXBJZGVudGlmaWVyID1cbiAgICBwcm9wcy5jdXN0b21BcHBHcm91cElkZW50aWZpZXIgPz9cbiAgICAoYnVuZGxlSWRlbnRpZmllciA/IGBncm91cC4ke2J1bmRsZUlkZW50aWZpZXJ9YCA6IHVuZGVmaW5lZCk7XG5cbiAgY29uc3QgaW50ZXJuYWxQcm9wcyA9IHtcbiAgICBhcHBHcm91cElkZW50aWZpZXIsXG4gICAgb21ldHJpYUlvc1Nka1ZlcnNpb24sXG4gICAgc2tpcE5TRSxcbiAgICByblNka1ZlcnNpb246IHByb3BzLnJuU2RrVmVyc2lvbixcbiAgICBhcHNFbnZpcm9ubWVudDogcmVzb2x2ZUFwc0Vudmlyb25tZW50KHByb3BzLmFwc0Vudmlyb25tZW50KSxcbiAgfTtcblxuICAvLyBBZGQgZW50aXRsZW1lbnRzXG4gIGNvbmZpZyA9IHdpdGhPbWV0cmlhRW50aXRsZW1lbnRzKGNvbmZpZywgaW50ZXJuYWxQcm9wcyk7XG5cbiAgLy8gV3JpdGUgZGVmYXVsdCBhcHBHcm91cElkZW50aWZpZXIgdG8gSW5mby5wbGlzdCBmb3IgRXhwbyBhdXRvLWNvbmZpZ3VyYXRpb25cbiAgY29uZmlnID0gd2l0aE9tZXRyaWFJbmZvUGxpc3QoY29uZmlnLCBpbnRlcm5hbFByb3BzKTtcblxuICAvLyBNb2RpZnkgUG9kZmlsZVxuICBjb25maWcgPSB3aXRoT21ldHJpYVBvZGZpbGUoY29uZmlnLCBpbnRlcm5hbFByb3BzKTtcblxuICAvLyBNYWtlIHN1cmUgRmlyZWJhc2UgaXMgY29uZmlndXJlZCBhdCBsYXVuY2ggKFJORkIgPD0gMjYgc2tpcHMgaXQgb24gRXhwbyA1OCspXG4gIGNvbmZpZyA9IHdpdGhPbWV0cmlhRmlyZWJhc2VDb25maWd1cmUoY29uZmlnKTtcblxuICAvLyBBZGQgTm90aWZpY2F0aW9uIFNlcnZpY2UgRXh0ZW5zaW9uIChvbmx5IGlmIG5vdCBza2lwcGVkIGFuZCBhcHBHcm91cElkZW50aWZpZXIgaXMgYXZhaWxhYmxlKVxuICBpZiAoIXNraXBOU0UgJiYgYXBwR3JvdXBJZGVudGlmaWVyKSB7XG4gICAgY29uZmlnID0gd2l0aE5vdGlmaWNhdGlvblNlcnZpY2VFeHRlbnNpb24oY29uZmlnLCB7XG4gICAgICBhcHBHcm91cElkZW50aWZpZXIsXG4gICAgICBvbWV0cmlhSW9zU2RrVmVyc2lvbixcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBjb25maWc7XG59O1xuIl19