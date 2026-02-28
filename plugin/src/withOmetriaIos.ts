import {
  ConfigPlugin,
  withEntitlementsPlist,
  withInfoPlist,
  withPodfile,
} from '@expo/config-plugins';
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

  for (const envVar of ['EAS_BUILD_PROFILE', 'EXPO_PUBLIC_APP_ENV']) {
    const value = process.env[envVar]?.toLowerCase();
    if (!value) continue;
    if (PRODUCTION_PROFILES.has(value)) return 'production';
    if (DEVELOPMENT_PROFILES.has(value)) return 'development';
  }

  console.warn(
    '[react-native-ometria] Could not determine APNs environment from build context. ' +
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
    let podfile = modConfig.modResults.contents;

    // Add TurboModule script require at the top (after other requires)
    podfile = addTurboModuleRequire(podfile);

    // Add use_frameworks! :linkage => :static if not present
    podfile = addUseFrameworks(podfile);

    // Add $RNFirebaseAsStaticFramework = true
    podfile = addFirebaseStaticFramework(podfile);

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

function addUseFrameworks(podfile: string): string {
  // Check if use_frameworks! is already present with static linkage
  if (podfile.includes('use_frameworks! :linkage => :static')) {
    // Still need to ensure modular headers is present
    return addModularHeaders(podfile);
  }

  // If use_frameworks! exists without static, we need to be careful
  if (podfile.includes('use_frameworks!')) {
    console.warn(
      '[Ometria] use_frameworks! already exists in Podfile. ' +
        'Ensure it uses :linkage => :static for Firebase compatibility.'
    );
    // Still add modular headers for Firebase/Ometria compatibility
    return addModularHeaders(podfile);
  }

  // Add before the main target
  const targetMatch = podfile.match(/target ['"].*['"] do/);
  if (targetMatch && targetMatch.index !== undefined) {
    return (
      podfile.slice(0, targetMatch.index) +
      '# [Ometria] Firebase requires static frameworks with modular headers\nuse_frameworks! :linkage => :static\nuse_modular_headers!\n$RNFirebaseAsStaticFramework = true\n\n' +
      podfile.slice(targetMatch.index)
    );
  }

  return podfile;
}

function addModularHeaders(podfile: string): string {
  if (podfile.includes('use_modular_headers!')) {
    return podfile;
  }

  // Add after use_frameworks! line
  const useFrameworksMatch = podfile.match(/use_frameworks!.*\n/);
  if (useFrameworksMatch && useFrameworksMatch.index !== undefined) {
    const insertIndex = useFrameworksMatch.index + useFrameworksMatch[0].length;
    return (
      podfile.slice(0, insertIndex) +
      '# [Ometria] Required for Firebase/Ometria static framework compatibility\nuse_modular_headers!\n' +
      podfile.slice(insertIndex)
    );
  }

  // Fallback: add before the main target
  const targetMatch = podfile.match(/target ['"].*['"] do/);
  if (targetMatch && targetMatch.index !== undefined) {
    return (
      podfile.slice(0, targetMatch.index) +
      '# [Ometria] Required for Firebase/Ometria static framework compatibility\nuse_modular_headers!\n\n' +
      podfile.slice(targetMatch.index)
    );
  }

  return podfile;
}

function addFirebaseStaticFramework(podfile: string): string {
  if (podfile.includes('$RNFirebaseAsStaticFramework')) {
    return podfile;
  }

  // This is typically added with use_frameworks, so check if it was added there
  // If not, add it before the target
  const targetMatch = podfile.match(/target ['"].*['"] do/);
  if (targetMatch && targetMatch.index !== undefined) {
    return (
      podfile.slice(0, targetMatch.index) +
      '# [Ometria] Firebase static framework flag\n$RNFirebaseAsStaticFramework = true\n\n' +
      podfile.slice(targetMatch.index)
    );
  }

  return podfile;
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
  const nseTarget = `
# [Ometria] Notification Service Extension for rich push notifications
target 'OmetriaNotificationServiceExtension' do
  inherit! :search_paths
  use_modular_headers!
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

  // Add Notification Service Extension (only if not skipped and appGroupIdentifier is available)
  if (!skipNSE && appGroupIdentifier) {
    config = withNotificationServiceExtension(config, {
      appGroupIdentifier,
      ometriaIosSdkVersion,
    });
  }

  return config;
};
