import {
  ConfigPlugin,
  withEntitlementsPlist,
  withPodfile,
} from '@expo/config-plugins';
import { withNotificationServiceExtension } from './withNotificationServiceExtension';
import type { OmetriaPluginProps } from './index';

type IosPluginProps = OmetriaPluginProps & {
  ometriaIosSdkVersion: string;
};

/**
 * Adds push notification and app group entitlements to the main app
 */
const withOmetriaEntitlements: ConfigPlugin<IosPluginProps> = (
  config,
  props
) => {
  return withEntitlementsPlist(config, (modConfig) => {
    // Add push notification entitlement
    modConfig.modResults['aps-environment'] = 'development';

    // Add app group entitlement
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

    return modConfig;
  });
};

/**
 * Modifies the Podfile to add Ometria-specific configurations
 */
const withOmetriaPodfile: ConfigPlugin<IosPluginProps> = (config, props) => {
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

    // Add NSE target for rich push notifications
    podfile = addNotificationServiceTarget(podfile, props.ometriaIosSdkVersion);

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
  // Add entitlements
  config = withOmetriaEntitlements(config, props);

  // Modify Podfile
  config = withOmetriaPodfile(config, props);

  // Add Notification Service Extension
  config = withNotificationServiceExtension(config, props);

  return config;
};
