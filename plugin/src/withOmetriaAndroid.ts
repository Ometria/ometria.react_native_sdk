import {
  ConfigPlugin,
  withAndroidManifest,
} from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

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
  // Warn if Firebase is detected — user must configure it via @react-native-firebase/app plugin
  const projectRoot = (config as any)._internal?.projectRoot ?? process.cwd();
  const pkgPath = path.join(projectRoot, 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) ?? {};
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps['@react-native-firebase/app']) {
      const plugins: unknown[] = (config as any).plugins ?? [];
      const hasFirebasePlugin = plugins.some(
        (p) => p === '@react-native-firebase/app' || (Array.isArray(p) && p[0] === '@react-native-firebase/app')
      );
      if (!hasFirebasePlugin) {
        console.warn(
          '[react-native-ometria] Firebase detected. Add "@react-native-firebase/app" to your ' +
          'plugins array in app.json to configure Google Services for Android. ' +
          'See: https://rnfirebase.io (Expo setup section).'
        );
      }
    }
  } catch {
    // ignore — package.json unreadable
  }

  config = withOmetriaRnSdkVersion(config, props);
  return config;
};
