import {
  ConfigPlugin,
  withAndroidManifest,
} from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

type AndroidPluginProps = {
  rnSdkVersion: string;
};

const FIREBASE_DEFAULT_CHANNEL_META =
  'com.google.firebase.messaging.default_notification_channel_id';

// Must match PUSH_NOTIFICATION_CHANNEL_ID in
// android/src/main/java/com/ometriareactnativesdk/OmetriaReactNativeSdkModule.kt
const OMETRIA_PUSH_CHANNEL_ID = 'ometria_high_importance';

/**
 * Points Firebase at the high-importance notification channel the SDK creates on
 * `initializeWithApiToken`, so Ometria's `notification`-type pushes show as heads-up pop-ups.
 *
 * Firebase only displays a notification on a channel that `default_notification_channel_id`
 * names. React Native Firebase declares that meta-data (empty by default) in its own library
 * manifest, so we set it on the app manifest with `tools:replace` — an app-level value reliably
 * overrides a library value during manifest merge. This gives Expo apps heads-up notifications
 * with no manual config (no firebase.json needed).
 */
const withOmetriaDefaultNotificationChannel: ConfigPlugin = (config) => {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;

    // `tools:replace` requires the tools namespace to be declared on <manifest>
    manifest.$ = manifest.$ || {};
    if (!(manifest.$ as any)['xmlns:tools']) {
      (manifest.$ as any)['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const application = manifest.application?.[0];
    if (application) {
      application['meta-data'] = application['meta-data'] || [];
      // Idempotent: drop any prior entry before re-adding
      application['meta-data'] = application['meta-data'].filter(
        (item: any) => item.$?.['android:name'] !== FIREBASE_DEFAULT_CHANNEL_META
      );
      application['meta-data'].push({
        $: {
          'android:name': FIREBASE_DEFAULT_CHANNEL_META,
          'android:value': OMETRIA_PUSH_CHANNEL_ID,
          'tools:replace': 'android:value',
        } as any,
      });
    }

    return modConfig;
  });
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
  config = withOmetriaDefaultNotificationChannel(config);
  return config;
};
