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
        // Warn if Firebase is detected — user must configure it via expo-build-properties
        const projectRoot = config._internal?.projectRoot ?? process.cwd();
        const pkgPath = path.join(projectRoot, 'package.json');
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) ?? {};
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (deps['@react-native-firebase/app']) {
                console.warn('[react-native-ometria] Firebase detected. Add expo-build-properties with ' +
                    '"useFrameworks": "static" and "forceStaticLinking" for RNFB pods to your app.json, ' +
                    'and add "@react-native-firebase/app" to your plugins array. ' +
                    'See: https://rnfirebase.io (Expo setup section).');
            }
        }
        catch {
            // ignore — package.json unreadable
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2l0aE9tZXRyaWFJb3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvd2l0aE9tZXRyaWFJb3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEseURBSzhCO0FBQzlCLHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFDN0IseUZBQXNGO0FBa0J0RixNQUFNLG1CQUFtQixHQUFHLElBQUksR0FBRyxDQUFDO0lBQ2xDLFlBQVk7SUFDWixTQUFTO0lBQ1QsU0FBUztJQUNULFNBQVM7SUFDVCxJQUFJO0lBQ0osWUFBWTtDQUNiLENBQUMsQ0FBQztBQUVILE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxhQUFhLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBRS9FLFNBQVMscUJBQXFCLENBQzVCLFFBQWtEO0lBRWxELElBQUksUUFBUSxFQUFFLENBQUM7UUFDYixPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBRUQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQztJQUN4RCxJQUFJLFdBQVcsS0FBSyxhQUFhLElBQUksV0FBVyxLQUFLLFlBQVksRUFBRSxDQUFDO1FBQ2xFLE9BQU8sV0FBVyxDQUFDO0lBQ3JCLENBQUM7SUFFRCxJQUFJLG9CQUF3QyxDQUFDO0lBQzdDLEtBQUssTUFBTSxNQUFNLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxxQkFBcUIsQ0FBQyxFQUFFLENBQUM7UUFDbEUsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUNqRCxJQUFJLENBQUMsS0FBSztZQUFFLFNBQVM7UUFDckIsSUFBSSxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO1lBQUUsT0FBTyxZQUFZLENBQUM7UUFDeEQsSUFB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UUFBQSxjQUFjLGtCQWdEekIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDb25maWdQbHVnaW4sXG4gIHdpdGhFbnRpdGxlbWVudHNQbGlzdCxcbiAgd2l0aEluZm9QbGlzdCxcbiAgd2l0aFBvZGZpbGUsXG59IGZyb20gJ0BleHBvL2NvbmZpZy1wbHVnaW5zJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyB3aXRoTm90aWZpY2F0aW9uU2VydmljZUV4dGVuc2lvbiB9IGZyb20gJy4vd2l0aE5vdGlmaWNhdGlvblNlcnZpY2VFeHRlbnNpb24nO1xuXG50eXBlIElvc1BsdWdpblByb3BzID0ge1xuICBjdXN0b21BcHBHcm91cElkZW50aWZpZXI/OiBzdHJpbmc7XG4gIG9tZXRyaWFJb3NTZGtWZXJzaW9uOiBzdHJpbmc7XG4gIHNraXBOU0U6IGJvb2xlYW47XG4gIHJuU2RrVmVyc2lvbjogc3RyaW5nO1xuICBhcHNFbnZpcm9ubWVudD86ICdkZXZlbG9wbWVudCcgfCAncHJvZHVjdGlvbic7XG59O1xuXG50eXBlIEludGVybmFsUGx1Z2luUHJvcHMgPSB7XG4gIGFwcEdyb3VwSWRlbnRpZmllcjogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBvbWV0cmlhSW9zU2RrVmVyc2lvbjogc3RyaW5nO1xuICBza2lwTlNFOiBib29sZWFuO1xuICByblNka1ZlcnNpb246IHN0cmluZztcbiAgYXBzRW52aXJvbm1lbnQ6ICdkZXZlbG9wbWVudCcgfCAncHJvZHVjdGlvbic7XG59O1xuXG5jb25zdCBQUk9EVUNUSU9OX1BST0ZJTEVTID0gbmV3IFNldChbXG4gICdwcm9kdWN0aW9uJyxcbiAgJ3JlbGVhc2UnLFxuICAnc3RhZ2luZycsXG4gICdwcmV2aWV3JyxcbiAgJ3FhJyxcbiAgJ3Rlc3RmbGlnaHQnLFxuXSk7XG5cbmNvbnN0IERFVkVMT1BNRU5UX1BST0ZJTEVTID0gbmV3IFNldChbJ2RldmVsb3BtZW50JywgJ2RldicsICdkZWJ1ZycsICdsb2NhbCddKTtcblxuZnVuY3Rpb24gcmVzb2x2ZUFwc0Vudmlyb25tZW50KFxuICBleHBsaWNpdDogJ2RldmVsb3BtZW50JyB8ICdwcm9kdWN0aW9uJyB8IHVuZGVmaW5lZFxuKTogJ2RldmVsb3BtZW50JyB8ICdwcm9kdWN0aW9uJyB7XG4gIGlmIChleHBsaWNpdCkge1xuICAgIHJldHVybiBleHBsaWNpdDtcbiAgfVxuXG4gIGNvbnN0IG92ZXJyaWRlRW52ID0gcHJvY2Vzcy5lbnYuT01FVFJJQV9BUFNfRU5WSVJPTk1FTlQ7XG4gIGlmIChvdmVycmlkZUVudiA9PT0gJ2RldmVsb3BtZW50JyB8fCBvdmVycmlkZUVudiA9PT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgcmV0dXJuIG92ZXJyaWRlRW52O1xuICB9XG5cbiAgbGV0IHVucmVjb25nbmlzZWRQcm9maWxlOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGZvciAoY29uc3QgZW52VmFyIG9mIFsnRUFTX0JVSUxEX1BST0ZJTEUnLCAnRVhQT19QVUJMSUNfQVBQX0VOViddKSB7XG4gICAgY29uc3QgdmFsdWUgPSBwcm9jZXNzLmVudltlbnZWYXJdPy50b0xvd2VyQ2FzZSgpO1xuICAgIGlmICghdmFsdWUpIGNvbnRpbnVlO1xuICAgIGlmIChQUk9EVUNUSU9OX1BST0ZJTEVTLmhhcyh2YWx1ZSkpIHJldHVybiAncHJvZHVjdGlvbic7XG4gICAgaWYgKERFVkVMT1BNRU5UX1BST0ZJTEVTLmhhcyh2YWx1ZSkpIHJldHVybiAnZGV2ZWxvcG1lbnQnO1xuICAgIHVucmVjb25nbmlzZWRQcm9maWxlID0gdmFsdWU7XG4gIH1cblxuICAvLyBOb3Qgb24gRUFTIOKAlCBsb2NhbCBwcmVidWlsZC4gWGNvZGUgb3ZlcnJpZGVzIGFwcy1lbnZpcm9ubWVudCBmcm9tIHRoZVxuICAvLyBwcm92aXNpb25pbmcgcHJvZmlsZSBhdCBidWlsZCB0aW1lLCBzbyB0aGUgdmFsdWUgaGVyZSBkb2Vzbid0IG1hdHRlci5cbiAgLy8gRGVmYXVsdCBzaWxlbnRseSB0byBkZXZlbG9wbWVudC5cbiAgaWYgKCFwcm9jZXNzLmVudi5FQVNfQlVJTEQpIHtcbiAgICByZXR1cm4gJ2RldmVsb3BtZW50JztcbiAgfVxuXG4gIGNvbnN0IHByb2ZpbGVIaW50ID0gdW5yZWNvbmduaXNlZFByb2ZpbGVcbiAgICA/IGAgKHVucmVjb2duaXNlZCBFQVMgcHJvZmlsZTogXCIke3VucmVjb25nbmlzZWRQcm9maWxlfVwiKWBcbiAgICA6ICcnO1xuICBjb25zb2xlLndhcm4oXG4gICAgYFtyZWFjdC1uYXRpdmUtb21ldHJpYV0gQ291bGQgbm90IGRldGVybWluZSBBUE5zIGVudmlyb25tZW50IGZyb20gYnVpbGQgY29udGV4dCR7cHJvZmlsZUhpbnR9LiBgICtcbiAgICAgICdEZWZhdWx0aW5nIGFwcy1lbnZpcm9ubWVudCB0byBcInByb2R1Y3Rpb25cIi4gJyArXG4gICAgICAnU2V0IGFwc0Vudmlyb25tZW50IGluIHRoZSBwbHVnaW4gY29uZmlnIG9yIE9NRVRSSUFfQVBTX0VOVklST05NRU5UIGVudiB2YXIgdG8gc2lsZW5jZSB0aGlzIHdhcm5pbmcuJ1xuICApO1xuICByZXR1cm4gJ3Byb2R1Y3Rpb24nO1xufVxuXG4vKipcbiAqIEFkZHMgcHVzaCBub3RpZmljYXRpb24gYW5kIGFwcCBncm91cCBlbnRpdGxlbWVudHMgdG8gdGhlIG1haW4gYXBwXG4gKi9cbmNvbnN0IHdpdGhPbWV0cmlhRW50aXRsZW1lbnRzOiBDb25maWdQbHVnaW48SW50ZXJuYWxQbHVnaW5Qcm9wcz4gPSAoXG4gIGNvbmZpZyxcbiAgcHJvcHNcbikgPT4ge1xuICByZXR1cm4gd2l0aEVudGl0bGVtZW50c1BsaXN0KGNvbmZpZywgKG1vZENvbmZpZykgPT4ge1xuICAgIC8vIEFkZCBwdXNoIG5vdGlmaWNhdGlvbiBlbnRpdGxlbWVudFxuICAgIG1vZENvbmZpZy5tb2RSZXN1bHRzWydhcHMtZW52aXJvbm1lbnQnXSA9IHByb3BzLmFwc0Vudmlyb25tZW50O1xuXG4gICAgLy8gQWRkIGFwcCBncm91cCBlbnRpdGxlbWVudCBvbmx5IGlmIGFwcEdyb3VwSWRlbnRpZmllciBpcyBwcm92aWRlZCAoZm9yIE5TRSlcbiAgICBpZiAocHJvcHMuYXBwR3JvdXBJZGVudGlmaWVyKSB7XG4gICAgICBjb25zdCBhcHBHcm91cHMgPVxuICAgICAgICBtb2RDb25maWcubW9kUmVzdWx0c1snY29tLmFwcGxlLnNlY3VyaXR5LmFwcGxpY2F0aW9uLWdyb3VwcyddO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYXBwR3JvdXBzKSkge1xuICAgICAgICBpZiAoIWFwcEdyb3Vwcy5pbmNsdWRlcyhwcm9wcy5hcHBHcm91cElkZW50aWZpZXIpKSB7XG4gICAgICAgICAgYXBwR3JvdXBzLnB1c2gocHJvcHMuYXBwR3JvdXBJZGVudGlmaWVyKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbW9kQ29uZmlnLm1vZFJlc3VsdHNbJ2NvbS5hcHBsZS5zZWN1cml0eS5hcHBsaWNhdGlvbi1ncm91cHMnXSA9IFtcbiAgICAgICAgICBwcm9wcy5hcHBHcm91cElkZW50aWZpZXIsXG4gICAgICAgIF07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1vZENvbmZpZztcbiAgfSk7XG59O1xuXG4vKipcbiAqIFdyaXRlcyB0aGUgZGVmYXVsdCBhcHBHcm91cElkZW50aWZpZXIgdG8gSW5mby5wbGlzdCBmb3IgRXhwbyBhcHBzLlxuICogVGhlIG5hdGl2ZSBTREsgcmVhZHMgdGhpcyBhcyBhIGZhbGxiYWNrIHdoZW4gbm8gYXBwR3JvdXBJZGVudGlmaWVyIGlzIHBhc3NlZCBhdCBydW50aW1lLlxuICovXG5jb25zdCB3aXRoT21ldHJpYUluZm9QbGlzdDogQ29uZmlnUGx1Z2luPEludGVybmFsUGx1Z2luUHJvcHM+ID0gKFxuICBjb25maWcsXG4gIHByb3BzXG4pID0+IHtcbiAgcmV0dXJuIHdpdGhJbmZvUGxpc3QoY29uZmlnLCAobW9kQ29uZmlnKSA9PiB7XG4gICAgLy8gT25seSB3cml0ZSBpZiBOU0UgaXMgZW5hYmxlZCBhbmQgd2UgaGF2ZSBhbiBhcHBHcm91cElkZW50aWZpZXJcbiAgICBpZiAoIXByb3BzLnNraXBOU0UgJiYgcHJvcHMuYXBwR3JvdXBJZGVudGlmaWVyKSB7XG4gICAgICBtb2RDb25maWcubW9kUmVzdWx0c1snT21ldHJpYUV4cG9EZWZhdWx0QXBwR3JvdXBJZGVudGlmaWVyJ10gPVxuICAgICAgICBwcm9wcy5hcHBHcm91cElkZW50aWZpZXI7XG4gICAgfVxuICAgIC8vIFdyaXRlIFJOIFNESyB2ZXJzaW9uIHNvIG5hdGl2ZSBjb2RlIGNhbiByZWFkIGl0IGluc3RlYWQgb2YgdXNpbmcgYSBoYXJkY29kZWQgdmFsdWVcbiAgICBtb2RDb25maWcubW9kUmVzdWx0c1snT21ldHJpYVJOU2RrVmVyc2lvbiddID0gcHJvcHMucm5TZGtWZXJzaW9uO1xuICAgIHJldHVybiBtb2RDb25maWc7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBNb2RpZmllcyB0aGUgUG9kZmlsZSB0byBhZGQgT21ldHJpYS1zcGVjaWZpYyBjb25maWd1cmF0aW9uc1xuICovXG5jb25zdCB3aXRoT21ldHJpYVBvZGZpbGU6IENvbmZpZ1BsdWdpbjxJbnRlcm5hbFBsdWdpblByb3BzPiA9IChjb25maWcsIHByb3BzKSA9PiB7XG4gIHJldHVybiB3aXRoUG9kZmlsZShjb25maWcsIChtb2RDb25maWcpID0+IHtcbiAgICAvLyBXYXJuIGlmIEZpcmViYXNlIGlzIGRldGVjdGVkIOKAlCB1c2VyIG11c3QgY29uZmlndXJlIGl0IHZpYSBleHBvLWJ1aWxkLXByb3BlcnRpZXNcbiAgICBjb25zdCBwcm9qZWN0Um9vdCA9IChjb25maWcgYXMgYW55KS5faW50ZXJuYWw/LnByb2plY3RSb290ID8/IHByb2Nlc3MuY3dkKCk7XG4gICAgY29uc3QgcGtnUGF0aCA9IHBhdGguam9pbihwcm9qZWN0Um9vdCwgJ3BhY2thZ2UuanNvbicpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwa2cgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwa2dQYXRoLCAndXRmOCcpKSA/PyB7fTtcbiAgICAgIGNvbnN0IGRlcHMgPSB7IC4uLnBrZy5kZXBlbmRlbmNpZXMsIC4uLnBrZy5kZXZEZXBlbmRlbmNpZXMgfTtcbiAgICAgIGlmIChkZXBzWydAcmVhY3QtbmF0aXZlLWZpcmViYXNlL2FwcCddKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAnW3JlYWN0LW5hdGl2ZS1vbWV0cmlhXSBGaXJlYmFzZSBkZXRlY3RlZC4gQWRkIGV4cG8tYnVpbGQtcHJvcGVydGllcyB3aXRoICcgK1xuICAgICAgICAgICdcInVzZUZyYW1ld29ya3NcIjogXCJzdGF0aWNcIiBhbmQgXCJmb3JjZVN0YXRpY0xpbmtpbmdcIiBmb3IgUk5GQiBwb2RzIHRvIHlvdXIgYXBwLmpzb24sICcgK1xuICAgICAgICAgICdhbmQgYWRkIFwiQHJlYWN0LW5hdGl2ZS1maXJlYmFzZS9hcHBcIiB0byB5b3VyIHBsdWdpbnMgYXJyYXkuICcgK1xuICAgICAgICAgICdTZWU6IGh0dHBzOi8vcm5maXJlYmFzZS5pbyAoRXhwbyBzZXR1cCBzZWN0aW9uKS4nXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBpZ25vcmUg4oCUIHBhY2thZ2UuanNvbiB1bnJlYWRhYmxlXG4gICAgfVxuXG4gICAgbGV0IHBvZGZpbGUgPSBtb2RDb25maWcubW9kUmVzdWx0cy5jb250ZW50cztcblxuICAgIC8vIEFkZCBUdXJib01vZHVsZSBzY3JpcHQgcmVxdWlyZSBhdCB0aGUgdG9wIChhZnRlciBvdGhlciByZXF1aXJlcylcbiAgICBwb2RmaWxlID0gYWRkVHVyYm9Nb2R1bGVSZXF1aXJlKHBvZGZpbGUpO1xuXG4gICAgLy8gQWRkIHBhdGNoX29tZXRyaWFfdHVyYm9tb2R1bGUgY2FsbCBpbiBwb3N0X2luc3RhbGxcbiAgICBwb2RmaWxlID0gYWRkVHVyYm9Nb2R1bGVQYXRjaChwb2RmaWxlKTtcblxuICAgIC8vIEFkZCBvbGQgYXJjaGl0ZWN0dXJlIG1vZHVsZW1hcCBmaXggaW4gcG9zdF9pbnN0YWxsXG4gICAgcG9kZmlsZSA9IGFkZE9sZEFyY2hNb2R1bGVtYXBGaXgocG9kZmlsZSk7XG5cbiAgICAvLyBBZGQgTlNFIHRhcmdldCBmb3IgcmljaCBwdXNoIG5vdGlmaWNhdGlvbnMgKG9ubHkgaWYgbm90IHNraXBwZWQpXG4gICAgaWYgKCFwcm9wcy5za2lwTlNFKSB7XG4gICAgICBwb2RmaWxlID0gYWRkTm90aWZpY2F0aW9uU2VydmljZVRhcmdldChcbiAgICAgICAgcG9kZmlsZSxcbiAgICAgICAgcHJvcHMub21ldHJpYUlvc1Nka1ZlcnNpb25cbiAgICAgICk7XG4gICAgfVxuXG4gICAgbW9kQ29uZmlnLm1vZFJlc3VsdHMuY29udGVudHMgPSBwb2RmaWxlO1xuICAgIHJldHVybiBtb2RDb25maWc7XG4gIH0pO1xufTtcblxuZnVuY3Rpb24gYWRkVHVyYm9Nb2R1bGVSZXF1aXJlKHBvZGZpbGU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHJlcXVpcmVTdGF0ZW1lbnQgPVxuICAgIFwicmVxdWlyZV9yZWxhdGl2ZSAnLi4vbm9kZV9tb2R1bGVzL3JlYWN0LW5hdGl2ZS1vbWV0cmlhL3NjcmlwdHMvb21ldHJpYV90dXJib21vZHVsZSdcIjtcblxuICBpZiAocG9kZmlsZS5pbmNsdWRlcygnb21ldHJpYV90dXJib21vZHVsZScpKSB7XG4gICAgcmV0dXJuIHBvZGZpbGU7XG4gIH1cblxuICAvLyBGaW5kIGEgZ29vZCBwbGFjZSB0byBpbnNlcnQgLSBhZnRlciBwbGF0Zm9ybSBkZWNsYXJhdGlvbiBvciBhZnRlciBvdGhlciByZXF1aXJlc1xuICBjb25zdCBwbGF0Zm9ybU1hdGNoID0gcG9kZmlsZS5tYXRjaCgvcGxhdGZvcm0gOmlvcy4qXFxuLyk7XG4gIGlmIChwbGF0Zm9ybU1hdGNoKSB7XG4gICAgY29uc3QgaW5zZXJ0SW5kZXggPSAocGxhdGZvcm1NYXRjaC5pbmRleCB8fCAwKSArIHBsYXRmb3JtTWF0Y2hbMF0ubGVuZ3RoO1xuICAgIHJldHVybiAoXG4gICAgICBwb2RmaWxlLnNsaWNlKDAsIGluc2VydEluZGV4KSArXG4gICAgICBgXFxuIyBbT21ldHJpYV0gVHVyYm9Nb2R1bGUgcmVnaXN0cmF0aW9uIGZvciBOZXcgQXJjaGl0ZWN0dXJlXFxuJHtyZXF1aXJlU3RhdGVtZW50fVxcbmAgK1xuICAgICAgcG9kZmlsZS5zbGljZShpbnNlcnRJbmRleClcbiAgICApO1xuICB9XG5cbiAgLy8gRmFsbGJhY2s6IGFkZCBhdCB0aGUgYmVnaW5uaW5nXG4gIHJldHVybiBgIyBbT21ldHJpYV0gVHVyYm9Nb2R1bGUgcmVnaXN0cmF0aW9uIGZvciBOZXcgQXJjaGl0ZWN0dXJlXFxuJHtyZXF1aXJlU3RhdGVtZW50fVxcblxcbiR7cG9kZmlsZX1gO1xufVxuXG5mdW5jdGlvbiBhZGRUdXJib01vZHVsZVBhdGNoKHBvZGZpbGU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmIChwb2RmaWxlLmluY2x1ZGVzKCdwYXRjaF9vbWV0cmlhX3R1cmJvbW9kdWxlJykpIHtcbiAgICByZXR1cm4gcG9kZmlsZTtcbiAgfVxuXG4gIC8vIEZpbmQgcG9zdF9pbnN0YWxsIGJsb2NrIGFuZCBhZGQgdGhlIHBhdGNoIGNhbGxcbiAgY29uc3QgcG9zdEluc3RhbGxNYXRjaCA9IHBvZGZpbGUubWF0Y2goL3Bvc3RfaW5zdGFsbCBkbyBcXHxpbnN0YWxsZXJcXHwvKTtcbiAgaWYgKHBvc3RJbnN0YWxsTWF0Y2ggJiYgcG9zdEluc3RhbGxNYXRjaC5pbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgaW5zZXJ0SW5kZXggPSBwb3N0SW5zdGFsbE1hdGNoLmluZGV4ICsgcG9zdEluc3RhbGxNYXRjaFswXS5sZW5ndGg7XG4gICAgcmV0dXJuIChcbiAgICAgIHBvZGZpbGUuc2xpY2UoMCwgaW5zZXJ0SW5kZXgpICtcbiAgICAgICdcXG4gICAgIyBbT21ldHJpYV0gUmVnaXN0ZXIgVHVyYm9Nb2R1bGUgZm9yIE5ldyBBcmNoaXRlY3R1cmVcXG4gICAgcGF0Y2hfb21ldHJpYV90dXJib21vZHVsZShpbnN0YWxsZXIpXFxuJyArXG4gICAgICBwb2RmaWxlLnNsaWNlKGluc2VydEluZGV4KVxuICAgICk7XG4gIH1cblxuICBjb25zb2xlLndhcm4oXG4gICAgJ1tPbWV0cmlhXSBDb3VsZCBub3QgZmluZCBwb3N0X2luc3RhbGwgYmxvY2sgaW4gUG9kZmlsZS4gJyArXG4gICAgICAnVHVyYm9Nb2R1bGUgcGF0Y2ggbWF5IG5lZWQgdG8gYmUgYWRkZWQgbWFudWFsbHkuJ1xuICApO1xuICByZXR1cm4gcG9kZmlsZTtcbn1cblxuLyoqXG4gKiBBZGRzIG1vZHVsZW1hcCBmaXggZm9yIG9sZCBhcmNoaXRlY3R1cmUgY29tcGF0aWJpbGl0eSB3aXRoIHVzZV9tb2R1bGFyX2hlYWRlcnMhXG4gKlxuICogUHJvYmxlbTogV2hlbiB1c2luZyB1c2VfbW9kdWxhcl9oZWFkZXJzISArIG9sZCBhcmNoaXRlY3R1cmUgKyBSTiAwLjgxKyxcbiAqIG11bHRpcGxlIG1vZHVsZW1hcHMgaW4gdGhlIHNhbWUgZGlyZWN0b3J5IGRlZmluZSBpZGVudGljYWwgbW9kdWxlIG5hbWVzIHdpdGhcbiAqIHVtYnJlbGxhIGhlYWRlcnMsIGNhdXNpbmcgXCJSZWRlZmluaXRpb24gb2YgbW9kdWxlXCIgYnVpbGQgZXJyb3JzLlxuICpcbiAqIFNvbHV0aW9uOiBSZXBsYWNlIGNvbmZsaWN0aW5nIG1vZHVsZW1hcHMgd2l0aCBlbXB0eSBtb2R1bGVzIChkaWZmZXJlbnQgbmFtZXMsIG5vIHVtYnJlbGxhKVxuICogVGhpcyBmaXggaXMgb25seSBhcHBsaWVkIHdoZW4gbmV3QXJjaEVuYWJsZWQgaXMgZmFsc2UuXG4gKi9cbmZ1bmN0aW9uIGFkZE9sZEFyY2hNb2R1bGVtYXBGaXgocG9kZmlsZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKFxuICAgIHBvZGZpbGUuaW5jbHVkZXMoJ3JlYWN0X2pzaXRvb2xpbmcnKSAmJlxuICAgIHBvZGZpbGUuaW5jbHVkZXMoJ3JlYWN0X3J1bnRpbWVhcHBsZScpXG4gICkge1xuICAgIHJldHVybiBwb2RmaWxlO1xuICB9XG5cbiAgY29uc3QgbW9kdWxlbWFwRml4ID0gYFxuICAgICMgW09tZXRyaWFdIEZpeCBtb2R1bGVtYXAgcmVkZWZpbml0aW9uIGVycm9ycyB3aGVuIHVzaW5nIHVzZV9tb2R1bGFyX2hlYWRlcnMhICsgb2xkIGFyY2ggKyBSTiAwLjgxK1xuICAgICMgUHJvYmxlbTogTXVsdGlwbGUgbW9kdWxlbWFwcyBpbiBzYW1lIGRpcmVjdG9yeSBkZWZpbmUgaWRlbnRpY2FsIG1vZHVsZSBuYW1lcyB3aXRoIHVtYnJlbGxhIGhlYWRlcnNcbiAgICAjIFNvbHV0aW9uOiBSZXBsYWNlIGNvbmZsaWN0aW5nIG1vZHVsZW1hcHMgd2l0aCBlbXB0eSBtb2R1bGVzIChkaWZmZXJlbnQgbmFtZXMsIG5vIHVtYnJlbGxhKVxuICAgIGlmIHBvZGZpbGVfcHJvcGVydGllc1snbmV3QXJjaEVuYWJsZWQnXSA9PSAnZmFsc2UnXG4gICAgICAjIEZpeCAxOiByZWFjdF9ydW50aW1lIG1vZHVsZSByZWRlZmluaXRpb24gKFJlYWN0LWpzaXRvb2xpbmcgdnMgUmVhY3QtUnVudGltZUNvcmUpXG4gICAgICBqc2l0b29saW5nX3BhdGggPSBcIiN7aW5zdGFsbGVyLnNhbmRib3gucm9vdH0vVGFyZ2V0IFN1cHBvcnQgRmlsZXMvUmVhY3QtanNpdG9vbGluZy9SZWFjdC1qc2l0b29saW5nLm1vZHVsZW1hcFwiXG4gICAgICBpZiBGaWxlLmV4aXN0Pyhqc2l0b29saW5nX3BhdGgpXG4gICAgICAgIEZpbGUud3JpdGUoanNpdG9vbGluZ19wYXRoLCBcIm1vZHVsZSByZWFjdF9qc2l0b29saW5nIHtcXFxcbn1cXFxcblwiKVxuICAgICAgICBwdXRzIFwiW09tZXRyaWFdIEZpeGVkIFJlYWN0LWpzaXRvb2xpbmcubW9kdWxlbWFwIChyZWFjdF9ydW50aW1lIGNvbmZsaWN0KVwiXG4gICAgICBlbmRcblxuICAgICAgIyBGaXggMjogUmVhY3RDb21tb24gbW9kdWxlIHJlZGVmaW5pdGlvbiAoUmVhY3QtUnVudGltZUFwcGxlIHZzIFJlYWN0Q29tbW9uKVxuICAgICAgcnVudGltZWFwcGxlX3BhdGggPSBcIiN7aW5zdGFsbGVyLnNhbmRib3gucm9vdH0vVGFyZ2V0IFN1cHBvcnQgRmlsZXMvUmVhY3QtUnVudGltZUFwcGxlL1JlYWN0LVJ1bnRpbWVBcHBsZS5tb2R1bGVtYXBcIlxuICAgICAgaWYgRmlsZS5leGlzdD8ocnVudGltZWFwcGxlX3BhdGgpXG4gICAgICAgIEZpbGUud3JpdGUocnVudGltZWFwcGxlX3BhdGgsIFwibW9kdWxlIHJlYWN0X3J1bnRpbWVhcHBsZSB7XFxcXG59XFxcXG5cIilcbiAgICAgICAgcHV0cyBcIltPbWV0cmlhXSBGaXhlZCBSZWFjdC1SdW50aW1lQXBwbGUubW9kdWxlbWFwIChSZWFjdENvbW1vbiBjb25mbGljdClcIlxuICAgICAgZW5kXG4gICAgZW5kXG5gO1xuXG4gIC8vIEZpbmQgcmVhY3RfbmF0aXZlX3Bvc3RfaW5zdGFsbCBhbmQgaXRzIGNsb3NpbmcgcGFyZW50aGVzaXNcbiAgLy8gVGhlIGZ1bmN0aW9uIGNhbGwgc3BhbnMgbXVsdGlwbGUgbGluZXMsIHNvIHdlIG5lZWQgdG8gZmluZCB0aGUgbWF0Y2hpbmcgY2xvc2luZyApXG4gIGNvbnN0IHBvc3RJbnN0YWxsU3RhcnQgPSBwb2RmaWxlLmluZGV4T2YoJ3JlYWN0X25hdGl2ZV9wb3N0X2luc3RhbGwoJyk7XG4gIGlmIChwb3N0SW5zdGFsbFN0YXJ0ICE9PSAtMSkge1xuICAgIC8vIENvdW50IHBhcmVudGhlc2VzIHRvIGZpbmQgdGhlIG1hdGNoaW5nIGNsb3NpbmcgKVxuICAgIGxldCBkZXB0aCA9IDA7XG4gICAgbGV0IGZvdW5kU3RhcnQgPSBmYWxzZTtcbiAgICBsZXQgZW5kSW5kZXggPSAtMTtcblxuICAgIGZvciAobGV0IGkgPSBwb3N0SW5zdGFsbFN0YXJ0OyBpIDwgcG9kZmlsZS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHBvZGZpbGVbaV0gPT09ICcoJykge1xuICAgICAgICBkZXB0aCsrO1xuICAgICAgICBmb3VuZFN0YXJ0ID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAocG9kZmlsZVtpXSA9PT0gJyknKSB7XG4gICAgICAgIGRlcHRoLS07XG4gICAgICAgIGlmIChmb3VuZFN0YXJ0ICYmIGRlcHRoID09PSAwKSB7XG4gICAgICAgICAgZW5kSW5kZXggPSBpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGVuZEluZGV4ICE9PSAtMSkge1xuICAgICAgLy8gRmluZCB0aGUgZW5kIG9mIHRoZSBsaW5lIGFmdGVyIHRoZSBjbG9zaW5nIClcbiAgICAgIGNvbnN0IGxpbmVFbmQgPSBwb2RmaWxlLmluZGV4T2YoJ1xcbicsIGVuZEluZGV4KTtcbiAgICAgIGlmIChsaW5lRW5kICE9PSAtMSkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIHBvZGZpbGUuc2xpY2UoMCwgbGluZUVuZCArIDEpICtcbiAgICAgICAgICBtb2R1bGVtYXBGaXggK1xuICAgICAgICAgIHBvZGZpbGUuc2xpY2UobGluZUVuZCArIDEpXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc29sZS53YXJuKFxuICAgICdbT21ldHJpYV0gQ291bGQgbm90IGZpbmQgcmVhY3RfbmF0aXZlX3Bvc3RfaW5zdGFsbCBpbiBQb2RmaWxlLiAnICtcbiAgICAgICdPbGQgYXJjaGl0ZWN0dXJlIG1vZHVsZW1hcCBmaXggbWF5IG5lZWQgdG8gYmUgYWRkZWQgbWFudWFsbHkuJ1xuICApO1xuICByZXR1cm4gcG9kZmlsZTtcbn1cblxuZnVuY3Rpb24gYWRkTm90aWZpY2F0aW9uU2VydmljZVRhcmdldChcbiAgcG9kZmlsZTogc3RyaW5nLFxuICBzZGtWZXJzaW9uOiBzdHJpbmdcbik6IHN0cmluZyB7XG4gIGlmIChwb2RmaWxlLmluY2x1ZGVzKFwidGFyZ2V0ICdPbWV0cmlhTm90aWZpY2F0aW9uU2VydmljZUV4dGVuc2lvbidcIikpIHtcbiAgICByZXR1cm4gcG9kZmlsZTtcbiAgfVxuXG4gIC8vIFVzZSBhIHN0YW5kYWxvbmUgdGFyZ2V0IHdpdGggaW5oZXJpdCEgOnNlYXJjaF9wYXRoc1xuICAvLyBUaGlzIHRlbGxzIENvY29hUG9kcyB0byBpbmhlcml0IHNlYXJjaCBwYXRocyBmcm9tIHRoZSBpbXBsaWNpdCBwYXJlbnRcbiAgLy8gd2l0aG91dCByZXF1aXJpbmcgc3RyaWN0IGhvc3QgdGFyZ2V0IHZlcmlmaWNhdGlvbiBpbiB0aGUgWGNvZGUgcHJvamVjdFxuICAvL1xuICAvLyBNaXJyb3IgdGhlIG1haW4gdGFyZ2V0J3MgdXNlX2ZyYW1ld29ya3MhIHNldHRpbmcgc28gQ29jb2FQb2RzIGRvZXNuJ3RcbiAgLy8gY29tcGxhaW4gdGhhdCB0aGUgaG9zdCBhbmQgZXh0ZW5zaW9uIHRhcmdldHMgZG9uJ3QgbWF0Y2guXG4gIGNvbnN0IG5zZVRhcmdldCA9IGBcbiMgW09tZXRyaWFdIE5vdGlmaWNhdGlvbiBTZXJ2aWNlIEV4dGVuc2lvbiBmb3IgcmljaCBwdXNoIG5vdGlmaWNhdGlvbnNcbnRhcmdldCAnT21ldHJpYU5vdGlmaWNhdGlvblNlcnZpY2VFeHRlbnNpb24nIGRvXG4gIGluaGVyaXQhIDpzZWFyY2hfcGF0aHNcbiAgdXNlX21vZHVsYXJfaGVhZGVycyFcbiAgdXNlX2ZyYW1ld29ya3MhIDpsaW5rYWdlID0+IHBvZGZpbGVfcHJvcGVydGllc1snaW9zLnVzZUZyYW1ld29ya3MnXS50b19zeW0gaWYgcG9kZmlsZV9wcm9wZXJ0aWVzWydpb3MudXNlRnJhbWV3b3JrcyddXG4gIHBvZCAnT21ldHJpYScsICd+PiAke3Nka1ZlcnNpb259J1xuZW5kXG5gO1xuXG4gIC8vIEFkZCBhdCB0aGUgZW5kIG9mIHRoZSBmaWxlIChvdXRzaWRlIG1haW4gdGFyZ2V0KVxuICByZXR1cm4gcG9kZmlsZSArIG5zZVRhcmdldDtcbn1cblxuLyoqXG4gKiBNYWluIGlPUyBjb25maWd1cmF0aW9uIGZvciBPbWV0cmlhXG4gKi9cbmV4cG9ydCBjb25zdCB3aXRoT21ldHJpYUlvczogQ29uZmlnUGx1Z2luPElvc1BsdWdpblByb3BzPiA9IChjb25maWcsIHByb3BzKSA9PiB7XG4gIGNvbnN0IHsgc2tpcE5TRSwgb21ldHJpYUlvc1Nka1ZlcnNpb24gfSA9IHByb3BzO1xuXG4gIGlmIChza2lwTlNFKSB7XG4gICAgY29uc29sZS53YXJuKFxuICAgICAgJ+KaoO+4jyAgW3JlYWN0LW5hdGl2ZS1vbWV0cmlhXSBza2lwTlNFIGlzIGVuYWJsZWQuIFJpY2ggcHVzaCBub3RpZmljYXRpb24gY29udGVudCAoaW1hZ2VzLCBldGMuKSB3aWxsIG5vdCB3b3JrIG9uIGlPUy4nXG4gICAgKTtcbiAgfVxuXG4gIC8vIFVzZSBjdXN0b20gYXBwR3JvdXBJZGVudGlmaWVyIGlmIHByb3ZpZGVkLCBvdGhlcndpc2UgYXV0by1nZW5lcmF0ZSBmcm9tIGJ1bmRsZUlkZW50aWZpZXJcbiAgY29uc3QgYnVuZGxlSWRlbnRpZmllciA9IGNvbmZpZy5pb3M/LmJ1bmRsZUlkZW50aWZpZXI7XG4gIGlmICghYnVuZGxlSWRlbnRpZmllciAmJiAhc2tpcE5TRSAmJiAhcHJvcHMuY3VzdG9tQXBwR3JvdXBJZGVudGlmaWVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgJ1tyZWFjdC1uYXRpdmUtb21ldHJpYV0gaW9zLmJ1bmRsZUlkZW50aWZpZXIgaXMgcmVxdWlyZWQgaW4gYXBwLmpzb24vYXBwLmNvbmZpZy5qcyBmb3IgTlNFIHNldHVwLiAnICtcbiAgICAgICAgJ0VpdGhlciBzZXQgaW9zLmJ1bmRsZUlkZW50aWZpZXIsIHByb3ZpZGUgY3VzdG9tQXBwR3JvdXBJZGVudGlmaWVyLCBvciB1c2Ugc2tpcE5TRTogdHJ1ZSB0byBza2lwIHJpY2ggbm90aWZpY2F0aW9ucy4nXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IGFwcEdyb3VwSWRlbnRpZmllciA9XG4gICAgcHJvcHMuY3VzdG9tQXBwR3JvdXBJZGVudGlmaWVyID8/XG4gICAgKGJ1bmRsZUlkZW50aWZpZXIgPyBgZ3JvdXAuJHtidW5kbGVJZGVudGlmaWVyfWAgOiB1bmRlZmluZWQpO1xuXG4gIGNvbnN0IGludGVybmFsUHJvcHMgPSB7XG4gICAgYXBwR3JvdXBJZGVudGlmaWVyLFxuICAgIG9tZXRyaWFJb3NTZGtWZXJzaW9uLFxuICAgIHNraXBOU0UsXG4gICAgcm5TZGtWZXJzaW9uOiBwcm9wcy5yblNka1ZlcnNpb24sXG4gICAgYXBzRW52aXJvbm1lbnQ6IHJlc29sdmVBcHNFbnZpcm9ubWVudChwcm9wcy5hcHNFbnZpcm9ubWVudCksXG4gIH07XG5cbiAgLy8gQWRkIGVudGl0bGVtZW50c1xuICBjb25maWcgPSB3aXRoT21ldHJpYUVudGl0bGVtZW50cyhjb25maWcsIGludGVybmFsUHJvcHMpO1xuXG4gIC8vIFdyaXRlIGRlZmF1bHQgYXBwR3JvdXBJZGVudGlmaWVyIHRvIEluZm8ucGxpc3QgZm9yIEV4cG8gYXV0by1jb25maWd1cmF0aW9uXG4gIGNvbmZpZyA9IHdpdGhPbWV0cmlhSW5mb1BsaXN0KGNvbmZpZywgaW50ZXJuYWxQcm9wcyk7XG5cbiAgLy8gTW9kaWZ5IFBvZGZpbGVcbiAgY29uZmlnID0gd2l0aE9tZXRyaWFQb2RmaWxlKGNvbmZpZywgaW50ZXJuYWxQcm9wcyk7XG5cbiAgLy8gQWRkIE5vdGlmaWNhdGlvbiBTZXJ2aWNlIEV4dGVuc2lvbiAob25seSBpZiBub3Qgc2tpcHBlZCBhbmQgYXBwR3JvdXBJZGVudGlmaWVyIGlzIGF2YWlsYWJsZSlcbiAgaWYgKCFza2lwTlNFICYmIGFwcEdyb3VwSWRlbnRpZmllcikge1xuICAgIGNvbmZpZyA9IHdpdGhOb3RpZmljYXRpb25TZXJ2aWNlRXh0ZW5zaW9uKGNvbmZpZywge1xuICAgICAgYXBwR3JvdXBJZGVudGlmaWVyLFxuICAgICAgb21ldHJpYUlvc1Nka1ZlcnNpb24sXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gY29uZmlnO1xufTtcbiJdfQ==