import {
  ConfigPlugin,
  withAppDelegate,
  withEntitlementsPlist,
  withInfoPlist,
  withPodfile,
} from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';
import { withNotificationServiceExtension } from './withNotificationServiceExtension';

type IosPluginProps = {
  customAppGroupIdentifier?: string;
  ometriaIosSdkVersion: string;
  skipNSE: boolean;
  rnSdkVersion: string;
  apsEnvironment?: 'development' | 'production';
};

type InternalPluginProps = {
  appGroupIdentifier: string | undefined;
  ometriaIosSdkVersion: string;
  skipNSE: boolean;
  rnSdkVersion: string;
  apsEnvironment: 'development' | 'production';
};

const PRODUCTION_PROFILES = new Set([
  'production',
  'release',
  'staging',
  'preview',
  'qa',
  'testflight',
]);

const DEVELOPMENT_PROFILES = new Set(['development', 'dev', 'debug', 'local']);

function resolveApsEnvironment(
  explicit: 'development' | 'production' | undefined
): 'development' | 'production' {
  if (explicit) {
    return explicit;
  }

  const overrideEnv = process.env.OMETRIA_APS_ENVIRONMENT;
  if (overrideEnv === 'development' || overrideEnv === 'production') {
    return overrideEnv;
  }

  let unrecongnisedProfile: string | undefined;
  for (const envVar of ['EAS_BUILD_PROFILE', 'EXPO_PUBLIC_APP_ENV']) {
    const value = process.env[envVar]?.toLowerCase();
    if (!value) continue;
    if (PRODUCTION_PROFILES.has(value)) return 'production';
    if (DEVELOPMENT_PROFILES.has(value)) return 'development';
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
  console.warn(
    `[react-native-ometria] Could not determine APNs environment from build context${profileHint}. ` +
      'Defaulting aps-environment to "production". ' +
      'Set apsEnvironment in the plugin config or OMETRIA_APS_ENVIRONMENT env var to silence this warning.'
  );
  return 'production';
}

/**
 * Adds push notification and app group entitlements to the main app
 */
const withOmetriaEntitlements: ConfigPlugin<InternalPluginProps> = (
  config,
  props
) => {
  return withEntitlementsPlist(config, (modConfig) => {
    // Add push notification entitlement
    modConfig.modResults['aps-environment'] = props.apsEnvironment;

    // Add app group entitlement only if appGroupIdentifier is provided (for NSE)
    if (props.appGroupIdentifier) {
      const appGroups =
        modConfig.modResults['com.apple.security.application-groups'];
      if (Array.isArray(appGroups)) {
        if (!appGroups.includes(props.appGroupIdentifier)) {
          appGroups.push(props.appGroupIdentifier);
        }
      } else {
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
const withOmetriaInfoPlist: ConfigPlugin<InternalPluginProps> = (
  config,
  props
) => {
  return withInfoPlist(config, (modConfig) => {
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
const withOmetriaPodfile: ConfigPlugin<InternalPluginProps> = (config, props) => {
  return withPodfile(config, (modConfig) => {
    // Remind about the iOS settings React Native Firebase needs with Ometria 2.x
    if (hasReactNativeFirebase(modConfig.modRequest.projectRoot)) {
      console.warn(
        '[react-native-ometria] React Native Firebase detected. On iOS, Ometria 2.x needs static linking: ' +
          'set "useFrameworks": "static" and "forceStaticLinking": ["RNFBApp", "RNFBMessaging"] in expo-build-properties, ' +
          'and with React Native Firebase 26.1 or later also set { "ios": { "disableSPM": true } } on the ' +
          '"@react-native-firebase/app" plugin. React Native Firebase 27 isn\'t supported on 2.x; it will be in the next major version. ' +
          'See: https://mobile-sdk.docs.ometria.com/react-native/installation'
      );
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
      podfile = addNotificationServiceTarget(
        podfile,
        props.ometriaIosSdkVersion
      );
    }

    modConfig.modResults.contents = podfile;
    return modConfig;
  });
};

function hasReactNativeFirebase(projectRoot: string): boolean {
  try {
    const pkgPath = path.join(projectRoot, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) ?? {};
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    return Boolean(deps['@react-native-firebase/app']);
  } catch {
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
const withOmetriaFirebaseConfigure: ConfigPlugin = (config) => {
  return withAppDelegate(config, (modConfig) => {
    if (
      !shouldAddFirebaseConfigure(
        modConfig.modResults.language,
        modConfig.ios?.googleServicesFile,
        modConfig.modRequest.projectRoot
      )
    ) {
      return modConfig;
    }

    const contents = addFirebaseConfigure(modConfig.modResults.contents);
    if (contents !== modConfig.modResults.contents) {
      console.log(
        '[react-native-ometria] Added FirebaseApp.configure() to AppDelegate.swift ' +
          '(the @react-native-firebase/app plugin skipped it; its "Skipping Firebase addition" warning can be ignored).'
      );
    }
    modConfig.modResults.contents = contents;
    return modConfig;
  });
};

/**
 * Only Swift AppDelegates of apps that use React Native Firebase with a GoogleService-Info.plist
 * get FirebaseApp.configure(); without the plist, configure() would crash at launch.
 */
export function shouldAddFirebaseConfigure(
  language: string,
  googleServicesFile: string | undefined,
  projectRoot: string
): boolean {
  return (
    language === 'swift' &&
    Boolean(googleServicesFile) &&
    hasReactNativeFirebase(projectRoot)
  );
}

const FIREBASE_CONFIGURE_ANCHOR =
  /(?:self\.moduleName\s*=\s*"[^"]*")|(?:factory\.startReactNative\()|(?:return\s+super\.application\(\s*application\s*,\s*didFinishLaunchingWithOptions:\s*launchOptions\s*\))/;

// `import FirebaseCore` or the `Firebase` umbrella, with any attributes or access level
const FIREBASE_IMPORT =
  /^[ \t]*(?:@\w+[ \t]+)*(?:(?:public|package|internal|fileprivate|private)[ \t]+)?import[ \t]+(?:FirebaseCore|Firebase)\b/m;

export function addFirebaseConfigure(appDelegate: string): string {
  if (/FirebaseApp\.configure\(/.test(appDelegate)) {
    return appDelegate;
  }

  const anchor = appDelegate.match(FIREBASE_CONFIGURE_ANCHOR);
  if (!anchor || anchor.index === undefined) {
    console.warn(
      '[react-native-ometria] Could not find where to add FirebaseApp.configure() in AppDelegate.swift. ' +
        'Add it manually to application(_:didFinishLaunchingWithOptions:), otherwise push notifications will not work.'
    );
    return appDelegate;
  }

  const lineStart = appDelegate.lastIndexOf('\n', anchor.index) + 1;
  const indent = appDelegate.slice(lineStart).match(/^[ \t]*/)?.[0] ?? '';
  let contents =
    appDelegate.slice(0, lineStart) +
    `${indent}// [Ometria] Configure Firebase (RNFB <= 26 skips this on Expo 58+)\n` +
    `${indent}if FirebaseApp.app() == nil {\n` +
    `${indent}  FirebaseApp.configure()\n` +
    `${indent}}\n` +
    appDelegate.slice(lineStart);

  if (!FIREBASE_IMPORT.test(contents)) {
    const importAnchor =
      contents.match(/^[ \t]*(?:internal\s+)?import\s+Expo[ \t]*$/m) ??
      contents.match(/^[ \t]*import\b[^\r\n]*$/m);
    if (importAnchor && importAnchor.index !== undefined) {
      const insertIndex = importAnchor.index + importAnchor[0].length;
      contents =
        contents.slice(0, insertIndex) +
        '\nimport FirebaseCore' +
        contents.slice(insertIndex);
    } else {
      contents = `import FirebaseCore\n${contents}`;
    }
  }

  return contents;
}

function addTurboModuleRequire(podfile: string): string {
  const requireStatement =
    "require_relative '../node_modules/react-native-ometria/scripts/ometria_turbomodule'";

  if (podfile.includes('ometria_turbomodule')) {
    return podfile;
  }

  // Find a good place to insert - after platform declaration or after other requires
  const platformMatch = podfile.match(/platform :ios.*\n/);
  if (platformMatch) {
    const insertIndex = (platformMatch.index || 0) + platformMatch[0].length;
    return (
      podfile.slice(0, insertIndex) +
      `\n# [Ometria] TurboModule registration for New Architecture\n${requireStatement}\n` +
      podfile.slice(insertIndex)
    );
  }

  // Fallback: add at the beginning
  return `# [Ometria] TurboModule registration for New Architecture\n${requireStatement}\n\n${podfile}`;
}

function addTurboModulePatch(podfile: string): string {
  if (podfile.includes('patch_ometria_turbomodule')) {
    return podfile;
  }

  // Find post_install block and add the patch call
  const postInstallMatch = podfile.match(/post_install do \|installer\|/);
  if (postInstallMatch && postInstallMatch.index !== undefined) {
    const insertIndex = postInstallMatch.index + postInstallMatch[0].length;
    return (
      podfile.slice(0, insertIndex) +
      '\n    # [Ometria] Register TurboModule for New Architecture\n    patch_ometria_turbomodule(installer)\n' +
      podfile.slice(insertIndex)
    );
  }

  console.warn(
    '[Ometria] Could not find post_install block in Podfile. ' +
      'TurboModule patch may need to be added manually.'
  );
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
function addOldArchModulemapFix(podfile: string): string {
  if (
    podfile.includes('react_jsitooling') &&
    podfile.includes('react_runtimeapple')
  ) {
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
      } else if (podfile[i] === ')') {
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
        return (
          podfile.slice(0, lineEnd + 1) +
          modulemapFix +
          podfile.slice(lineEnd + 1)
        );
      }
    }
  }

  console.warn(
    '[Ometria] Could not find react_native_post_install in Podfile. ' +
      'Old architecture modulemap fix may need to be added manually.'
  );
  return podfile;
}

function addNotificationServiceTarget(
  podfile: string,
  sdkVersion: string
): string {
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
export const withOmetriaIos: ConfigPlugin<IosPluginProps> = (config, props) => {
  const { skipNSE, ometriaIosSdkVersion } = props;

  if (skipNSE) {
    console.warn(
      '⚠️  [react-native-ometria] skipNSE is enabled. Rich push notification content (images, etc.) will not work on iOS.'
    );
  }

  // Use custom appGroupIdentifier if provided, otherwise auto-generate from bundleIdentifier
  const bundleIdentifier = config.ios?.bundleIdentifier;
  if (!bundleIdentifier && !skipNSE && !props.customAppGroupIdentifier) {
    throw new Error(
      '[react-native-ometria] ios.bundleIdentifier is required in app.json/app.config.js for NSE setup. ' +
        'Either set ios.bundleIdentifier, provide customAppGroupIdentifier, or use skipNSE: true to skip rich notifications.'
    );
  }

  const appGroupIdentifier =
    props.customAppGroupIdentifier ??
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
    config = withNotificationServiceExtension(config, {
      appGroupIdentifier,
      ometriaIosSdkVersion,
    });
  }

  return config;
};
