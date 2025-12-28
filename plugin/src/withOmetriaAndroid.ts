import {
  ConfigPlugin,
  withProjectBuildGradle,
  withAppBuildGradle,
} from '@expo/config-plugins';

/**
 * Adds Google Services classpath to project-level build.gradle
 */
const withGoogleServicesClasspath: ConfigPlugin = (config) => {
  return withProjectBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language === 'groovy') {
      modConfig.modResults.contents = addGoogleServicesClasspath(
        modConfig.modResults.contents
      );
    } else {
      throw new Error(
        'Cannot configure Google Services classpath in Kotlin build.gradle'
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
    } else {
      throw new Error(
        'Cannot configure Google Services plugin in Kotlin build.gradle'
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

/**
 * Main Android configuration for Ometria
 */
export const withOmetriaAndroid: ConfigPlugin = (config) => {
  config = withGoogleServicesClasspath(config);
  config = withGoogleServicesPlugin(config);
  return config;
};
