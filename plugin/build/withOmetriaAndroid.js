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
exports.withOmetriaAndroid = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const FIREBASE_DEFAULT_CHANNEL_META = 'com.google.firebase.messaging.default_notification_channel_id';
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
const withOmetriaDefaultNotificationChannel = (config) => {
    return (0, config_plugins_1.withAndroidManifest)(config, (modConfig) => {
        const manifest = modConfig.modResults.manifest;
        // `tools:replace` requires the tools namespace to be declared on <manifest>
        manifest.$ = manifest.$ || {};
        if (!manifest.$['xmlns:tools']) {
            manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
        }
        const application = manifest.application?.[0];
        if (application) {
            application['meta-data'] = application['meta-data'] || [];
            // Idempotent: drop any prior entry before re-adding
            application['meta-data'] = application['meta-data'].filter((item) => item.$?.['android:name'] !== FIREBASE_DEFAULT_CHANNEL_META);
            application['meta-data'].push({
                $: {
                    'android:name': FIREBASE_DEFAULT_CHANNEL_META,
                    'android:value': OMETRIA_PUSH_CHANNEL_ID,
                    'tools:replace': 'android:value',
                },
            });
        }
        return modConfig;
    });
};
/**
 * Writes the RN SDK version to AndroidManifest.xml as meta-data
 * so the native module can read it instead of using a hardcoded value.
 */
const withOmetriaRnSdkVersion = (config, props) => {
    return (0, config_plugins_1.withAndroidManifest)(config, (modConfig) => {
        const mainApplication = modConfig.modResults.manifest.application?.[0];
        if (mainApplication) {
            mainApplication['meta-data'] = mainApplication['meta-data'] || [];
            // Remove existing entry if present
            mainApplication['meta-data'] = mainApplication['meta-data'].filter((item) => item.$?.['android:name'] !== 'OmetriaRNSdkVersion');
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
const withOmetriaAndroid = (config, props) => {
    // Warn if Firebase is detected — user must configure it via @react-native-firebase/app plugin
    const projectRoot = config._internal?.projectRoot ?? process.cwd();
    const pkgPath = path.join(projectRoot, 'package.json');
    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) ?? {};
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps['@react-native-firebase/app']) {
            const plugins = config.plugins ?? [];
            const hasFirebasePlugin = plugins.some((p) => p === '@react-native-firebase/app' || (Array.isArray(p) && p[0] === '@react-native-firebase/app'));
            if (!hasFirebasePlugin) {
                console.warn('[react-native-ometria] Firebase detected. Add "@react-native-firebase/app" to your ' +
                    'plugins array in app.json to configure Google Services for Android. ' +
                    'See: https://rnfirebase.io (Expo setup section).');
            }
        }
    }
    catch {
        // ignore — package.json unreadable
    }
    config = withOmetriaRnSdkVersion(config, props);
    config = withOmetriaDefaultNotificationChannel(config);
    return config;
};
exports.withOmetriaAndroid = withOmetriaAndroid;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2l0aE9tZXRyaWFBbmRyb2lkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3dpdGhPbWV0cmlhQW5kcm9pZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx5REFHOEI7QUFDOUIsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQU03QixNQUFNLDZCQUE2QixHQUNqQywrREFBK0QsQ0FBQztBQUVsRSw2Q0FBNkM7QUFDN0MsaUZBQWlGO0FBQ2pGLE1BQU0sdUJBQXVCLEdBQUcseUJBQXlCLENBQUM7QUFFMUQ7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxxQ0FBcUMsR0FBaUIsQ0FBQyxNQUFNLEVBQUUsRUFBRTtJQUNyRSxPQUFPLElBQUEsb0NBQW1CLEVBQUMsTUFBTSxFQUFFLENBQUMsU0FBUyxFQUFFLEVBQUU7UUFDL0MsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7UUFFL0MsNEVBQTRFO1FBQzVFLFFBQVEsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDOUIsSUFBSSxDQUFFLFFBQVEsQ0FBQyxDQUFTLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztZQUN2QyxRQUFRLENBQUMsQ0FBUyxDQUFDLGFBQWEsQ0FBQyxHQUFHLGtDQUFrQyxDQUFDO1FBQzFFLENBQUM7UUFFRCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUMsSUFBSSxXQUFXLEVBQUUsQ0FBQztZQUNoQixXQUFXLENBQUMsV0FBVyxDQUFDLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMxRCxvREFBb0Q7WUFDcEQsV0FBVyxDQUFDLFdBQVcsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxNQUFNLENBQ3hELENBQUMsSUFBUyxF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ckMsQ0FBQztJQUVELE1BQU0sR0FBRyx1QkFBdUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEQsTUFBTSxHQUFHLHFDQUFxQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3ZELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUMsQ0FBQztBQTlCVyxRQUFBLGtCQUFrQixzQkE4QjdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ29uZmlnUGx1Z2luLFxuICB3aXRoQW5kcm9pZE1hbmlmZXN0LFxufSBmcm9tICdAZXhwby9jb25maWctcGx1Z2lucyc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG50eXBlIEFuZHJvaWRQbHVnaW5Qcm9wcyA9IHtcbiAgcm5TZGtWZXJzaW9uOiBzdHJpbmc7XG59O1xuXG5jb25zdCBGSVJFQkFTRV9ERUZBVUxUX0NIQU5ORUxfTUVUQSA9XG4gICdjb20uZ29vZ2xlLmZpcmViYXNlLm1lc3NhZ2luZy5kZWZhdWx0X25vdGlmaWNhdGlvbl9jaGFubmVsX2lkJztcblxuLy8gTXVzdCBtYXRjaCBQVVNIX05PVElGSUNBVElPTl9DSEFOTkVMX0lEIGluXG4vLyBhbmRyb2lkL3NyYy9tYWluL2phdmEvY29tL29tZXRyaWFyZWFjdG5hdGl2ZXNkay9PbWV0cmlhUmVhY3ROYXRpdmVTZGtNb2R1bGUua3RcbmNvbnN0IE9NRVRSSUFfUFVTSF9DSEFOTkVMX0lEID0gJ29tZXRyaWFfaGlnaF9pbXBvcnRhbmNlJztcblxuLyoqXG4gKiBQb2ludHMgRmlyZWJhc2UgYXQgdGhlIGhpZ2gtaW1wb3J0YW5jZSBub3RpZmljYXRpb24gY2hhbm5lbCB0aGUgU0RLIGNyZWF0ZXMgb25cbiAqIGBpbml0aWFsaXplV2l0aEFwaVRva2VuYCwgc28gT21ldHJpYSdzIGBub3RpZmljYXRpb25gLXR5cGUgcHVzaGVzIHNob3cgYXMgaGVhZHMtdXAgcG9wLXVwcy5cbiAqXG4gKiBGaXJlYmFzZSBvbmx5IGRpc3BsYXlzIGEgbm90aWZpY2F0aW9uIG9uIGEgY2hhbm5lbCB0aGF0IGBkZWZhdWx0X25vdGlmaWNhdGlvbl9jaGFubmVsX2lkYFxuICogbmFtZXMuIFJlYWN0IE5hdGl2ZSBGaXJlYmFzZSBkZWNsYXJlcyB0aGF0IG1ldGEtZGF0YSAoZW1wdHkgYnkgZGVmYXVsdCkgaW4gaXRzIG93biBsaWJyYXJ5XG4gKiBtYW5pZmVzdCwgc28gd2Ugc2V0IGl0IG9uIHRoZSBhcHAgbWFuaWZlc3Qgd2l0aCBgdG9vbHM6cmVwbGFjZWAg4oCUIGFuIGFwcC1sZXZlbCB2YWx1ZSByZWxpYWJseVxuICogb3ZlcnJpZGVzIGEgbGlicmFyeSB2YWx1ZSBkdXJpbmcgbWFuaWZlc3QgbWVyZ2UuIFRoaXMgZ2l2ZXMgRXhwbyBhcHBzIGhlYWRzLXVwIG5vdGlmaWNhdGlvbnNcbiAqIHdpdGggbm8gbWFudWFsIGNvbmZpZyAobm8gZmlyZWJhc2UuanNvbiBuZWVkZWQpLlxuICovXG5jb25zdCB3aXRoT21ldHJpYURlZmF1bHROb3RpZmljYXRpb25DaGFubmVsOiBDb25maWdQbHVnaW4gPSAoY29uZmlnKSA9PiB7XG4gIHJldHVybiB3aXRoQW5kcm9pZE1hbmlmZXN0KGNvbmZpZywgKG1vZENvbmZpZykgPT4ge1xuICAgIGNvbnN0IG1hbmlmZXN0ID0gbW9kQ29uZmlnLm1vZFJlc3VsdHMubWFuaWZlc3Q7XG5cbiAgICAvLyBgdG9vbHM6cmVwbGFjZWAgcmVxdWlyZXMgdGhlIHRvb2xzIG5hbWVzcGFjZSB0byBiZSBkZWNsYXJlZCBvbiA8bWFuaWZlc3Q+XG4gICAgbWFuaWZlc3QuJCA9IG1hbmlmZXN0LiQgfHwge307XG4gICAgaWYgKCEobWFuaWZlc3QuJCBhcyBhbnkpWyd4bWxuczp0b29scyddKSB7XG4gICAgICAobWFuaWZlc3QuJCBhcyBhbnkpWyd4bWxuczp0b29scyddID0gJ2h0dHA6Ly9zY2hlbWFzLmFuZHJvaWQuY29tL3Rvb2xzJztcbiAgICB9XG5cbiAgICBjb25zdCBhcHBsaWNhdGlvbiA9IG1hbmlmZXN0LmFwcGxpY2F0aW9uPy5bMF07XG4gICAgaWYgKGFwcGxpY2F0aW9uKSB7XG4gICAgICBhcHBsaWNhdGlvblsnbWV0YS1kYXRhJ10gPSBhcHBsaWNhdGlvblsnbWV0YS1kYXRhJ10gfHwgW107XG4gICAgICAvLyBJZGVtcG90ZW50OiBkcm9wIGFueSBwcmlvciBlbnRyeSBiZWZvcmUgcmUtYWRkaW5nXG4gICAgICBhcHBsaWNhdGlvblsnbWV0YS1kYXRhJ10gPSBhcHBsaWNhdGlvblsnbWV0YS1kYXRhJ10uZmlsdGVyKFxuICAgICAgICAoaXRlbTogYW55KSA9PiBpdGVtLiQ/LlsnYW5kcm9pZDpuYW1lJ10gIT09IEZJUkVCQVNFX0RFRkFVTFRfQ0hBTk5FTF9NRVRBXG4gICAgICApO1xuICAgICAgYXBwbGljYXRpb25bJ21ldGEtZGF0YSddLnB1c2goe1xuICAgICAgICAkOiB7XG4gICAgICAgICAgJ2FuZHJvaWQ6bmFtZSc6IEZJUkVCQVNFX0RFRkFVTFRfQ0hBTk5FTF9NRVRBLFxuICAgICAgICAgICdhbmRyb2lkOnZhbHVlJzogT01FVFJJQV9QVVNIX0NIQU5ORUxfSUQsXG4gICAgICAgICAgJ3Rvb2xzOnJlcGxhY2UnOiAnYW5kcm9pZDp2YWx1ZScsXG4gICAgICAgIH0gYXMgYW55LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1vZENvbmZpZztcbiAgfSk7XG59O1xuXG4vKipcbiAqIFdyaXRlcyB0aGUgUk4gU0RLIHZlcnNpb24gdG8gQW5kcm9pZE1hbmlmZXN0LnhtbCBhcyBtZXRhLWRhdGFcbiAqIHNvIHRoZSBuYXRpdmUgbW9kdWxlIGNhbiByZWFkIGl0IGluc3RlYWQgb2YgdXNpbmcgYSBoYXJkY29kZWQgdmFsdWUuXG4gKi9cbmNvbnN0IHdpdGhPbWV0cmlhUm5TZGtWZXJzaW9uOiBDb25maWdQbHVnaW48QW5kcm9pZFBsdWdpblByb3BzPiA9IChcbiAgY29uZmlnLFxuICBwcm9wc1xuKSA9PiB7XG4gIHJldHVybiB3aXRoQW5kcm9pZE1hbmlmZXN0KGNvbmZpZywgKG1vZENvbmZpZykgPT4ge1xuICAgIGNvbnN0IG1haW5BcHBsaWNhdGlvbiA9XG4gICAgICBtb2RDb25maWcubW9kUmVzdWx0cy5tYW5pZmVzdC5hcHBsaWNhdGlvbj8uWzBdO1xuICAgIGlmIChtYWluQXBwbGljYXRpb24pIHtcbiAgICAgIG1haW5BcHBsaWNhdGlvblsnbWV0YS1kYXRhJ10gPSBtYWluQXBwbGljYXRpb25bJ21ldGEtZGF0YSddIHx8IFtdO1xuICAgICAgLy8gUmVtb3ZlIGV4aXN0aW5nIGVudHJ5IGlmIHByZXNlbnRcbiAgICAgIG1haW5BcHBsaWNhdGlvblsnbWV0YS1kYXRhJ10gPSBtYWluQXBwbGljYXRpb25bJ21ldGEtZGF0YSddLmZpbHRlcihcbiAgICAgICAgKGl0ZW06IGFueSkgPT4gaXRlbS4kPy5bJ2FuZHJvaWQ6bmFtZSddICE9PSAnT21ldHJpYVJOU2RrVmVyc2lvbidcbiAgICAgICk7XG4gICAgICBtYWluQXBwbGljYXRpb25bJ21ldGEtZGF0YSddLnB1c2goe1xuICAgICAgICAkOiB7XG4gICAgICAgICAgJ2FuZHJvaWQ6bmFtZSc6ICdPbWV0cmlhUk5TZGtWZXJzaW9uJyxcbiAgICAgICAgICAnYW5kcm9pZDp2YWx1ZSc6IHByb3BzLnJuU2RrVmVyc2lvbixcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbW9kQ29uZmlnO1xuICB9KTtcbn07XG5cbi8qKlxuICogTWFpbiBBbmRyb2lkIGNvbmZpZ3VyYXRpb24gZm9yIE9tZXRyaWFcbiAqL1xuZXhwb3J0IGNvbnN0IHdpdGhPbWV0cmlhQW5kcm9pZDogQ29uZmlnUGx1Z2luPEFuZHJvaWRQbHVnaW5Qcm9wcz4gPSAoXG4gIGNvbmZpZyxcbiAgcHJvcHNcbikgPT4ge1xuICAvLyBXYXJuIGlmIEZpcmViYXNlIGlzIGRldGVjdGVkIOKAlCB1c2VyIG11c3QgY29uZmlndXJlIGl0IHZpYSBAcmVhY3QtbmF0aXZlLWZpcmViYXNlL2FwcCBwbHVnaW5cbiAgY29uc3QgcHJvamVjdFJvb3QgPSAoY29uZmlnIGFzIGFueSkuX2ludGVybmFsPy5wcm9qZWN0Um9vdCA/PyBwcm9jZXNzLmN3ZCgpO1xuICBjb25zdCBwa2dQYXRoID0gcGF0aC5qb2luKHByb2plY3RSb290LCAncGFja2FnZS5qc29uJyk7XG4gIHRyeSB7XG4gICAgY29uc3QgcGtnID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocGtnUGF0aCwgJ3V0ZjgnKSkgPz8ge307XG4gICAgY29uc3QgZGVwcyA9IHsgLi4ucGtnLmRlcGVuZGVuY2llcywgLi4ucGtnLmRldkRlcGVuZGVuY2llcyB9O1xuICAgIGlmIChkZXBzWydAcmVhY3QtbmF0aXZlLWZpcmViYXNlL2FwcCddKSB7XG4gICAgICBjb25zdCBwbHVnaW5zOiB1bmtub3duW10gPSAoY29uZmlnIGFzIGFueSkucGx1Z2lucyA/PyBbXTtcbiAgICAgIGNvbnN0IGhhc0ZpcmViYXNlUGx1Z2luID0gcGx1Z2lucy5zb21lKFxuICAgICAgICAocCkgPT4gcCA9PT0gJ0ByZWFjdC1uYXRpdmUtZmlyZWJhc2UvYXBwJyB8fCAoQXJyYXkuaXNBcnJheShwKSAmJiBwWzBdID09PSAnQHJlYWN0LW5hdGl2ZS1maXJlYmFzZS9hcHAnKVxuICAgICAgKTtcbiAgICAgIGlmICghaGFzRmlyZWJhc2VQbHVnaW4pIHtcbiAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICdbcmVhY3QtbmF0aXZlLW9tZXRyaWFdIEZpcmViYXNlIGRldGVjdGVkLiBBZGQgXCJAcmVhY3QtbmF0aXZlLWZpcmViYXNlL2FwcFwiIHRvIHlvdXIgJyArXG4gICAgICAgICAgJ3BsdWdpbnMgYXJyYXkgaW4gYXBwLmpzb24gdG8gY29uZmlndXJlIEdvb2dsZSBTZXJ2aWNlcyBmb3IgQW5kcm9pZC4gJyArXG4gICAgICAgICAgJ1NlZTogaHR0cHM6Ly9ybmZpcmViYXNlLmlvIChFeHBvIHNldHVwIHNlY3Rpb24pLidcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIC8vIGlnbm9yZSDigJQgcGFja2FnZS5qc29uIHVucmVhZGFibGVcbiAgfVxuXG4gIGNvbmZpZyA9IHdpdGhPbWV0cmlhUm5TZGtWZXJzaW9uKGNvbmZpZywgcHJvcHMpO1xuICBjb25maWcgPSB3aXRoT21ldHJpYURlZmF1bHROb3RpZmljYXRpb25DaGFubmVsKGNvbmZpZyk7XG4gIHJldHVybiBjb25maWc7XG59O1xuIl19