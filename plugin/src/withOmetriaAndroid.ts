import {
  ConfigPlugin,
  withProjectBuildGradle,
  withAppBuildGradle,
  withAndroidManifest,
} from '@expo/config-plugins';

/**
 * Adds Google Services classpath to project-level build.gradle
 */
const withGoogleServicesClasspath: ConfigPlugin = (config) => {
  return withProjectBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language === 'groovy' || modConfig.modResults.language === 'kt') {
      modConfig.modResults.contents = addGoogleServicesClasspath(
        modConfig.modResults.contents
      );
    } else {
      console.warn(
        '[Ometria] Unsupported build.gradle language; Google Services classpath was not added automatically.'
      );
    }
    return modConfig;
  });
};

/**
 * Adds Google Services plugin to app-level build.gradle
 */
const withGoogleServicesPlugin: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language === 'groovy') {
      modConfig.modResults.contents = addGoogleServicesPlugin(
        modConfig.modResults.contents
      );
    } else if (modConfig.modResults.language === 'kt') {
      modConfig.modResults.contents = addGoogleServicesPluginKts(
        modConfig.modResults.contents
      );
    } else {
      console.warn(
        '[Ometria] Unsupported build.gradle language; Google Services plugin was not added automatically.'
      );
    }
    return modConfig;
  });
};

function addGoogleServicesClasspath(buildGradle: string): string {
  const googleServicesClasspath =
    'classpath("com.google.gms:google-services:4.4.0")';

  // Check if already added
  if (buildGradle.includes('com.google.gms:google-services')) {
    return buildGradle;
  }

  // Find the dependencies block in buildscript and add the classpath
  const pattern = /(buildscript\s*\{[\s\S]*?dependencies\s*\{)/;
  const match = buildGradle.match(pattern);

  if (match) {
    return buildGradle.replace(
      pattern,
      `$1\n        // [Ometria] Google Services for Firebase\n        ${googleServicesClasspath}`
    );
  }

  // If no buildscript dependencies block found, warn and return unchanged
  console.warn(
    '[Ometria] Could not find buildscript dependencies block in project build.gradle'
  );
  return buildGradle;
}

function addGoogleServicesPlugin(buildGradle: string): string {
  const googleServicesPlugin = "apply plugin: 'com.google.gms.google-services'";

  // Check if already added
  if (buildGradle.includes('com.google.gms.google-services')) {
    return buildGradle;
  }

  // Add at the end of the file
  return `${buildGradle}\n// [Ometria] Google Services plugin for Firebase\n${googleServicesPlugin}\n`;
}

function addGoogleServicesPluginKts(buildGradle: string): string {
  const googleServicesPlugin = 'apply(plugin = "com.google.gms.google-services")';

  // Check if already added
  if (buildGradle.includes('com.google.gms.google-services')) {
    return buildGradle;
  }

  // Add at the end of the file
  return `${buildGradle}\n// [Ometria] Google Services plugin for Firebase\n${googleServicesPlugin}\n`;
}

type AndroidPluginProps = {
  rnSdkVersion: string;
};

/**
 * Writes the RN SDK version to AndroidManifest.xml as meta-data
 * so the native module can read it instead of using a hardcoded value.
 */
const withOmetriaRnSdkVersion: ConfigPlugin<AndroidPluginProps> = (
  config,
  props
) => {
  return withAndroidManifest(config, (modConfig) => {
    const mainApplication =
      modConfig.modResults.manifest.application?.[0];
    if (mainApplication) {
      mainApplication['meta-data'] = mainApplication['meta-data'] || [];
      // Remove existing entry if present
      mainApplication['meta-data'] = mainApplication['meta-data'].filter(
        (item: any) => item.$?.['android:name'] !== 'OmetriaRNSdkVersion'
      );
      mainApplication['meta-data'].push({
        $: {
          'android:name': 'OmetriaRNSdkVersion',
          'android:value': props.rnSdkVersion,
        },
      });
    }
    return modConfig;
  });
};

/**
 * Main Android configuration for Ometria
 */
export const withOmetriaAndroid: ConfigPlugin<AndroidPluginProps> = (
  config,
  props
) => {
  config = withGoogleServicesClasspath(config);
  config = withGoogleServicesPlugin(config);
  config = withOmetriaRnSdkVersion(config, props);
  return config;
};
