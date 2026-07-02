# SDK Upgrade Guide

## Upgrading to iOS SDK 1.8.9 (from 1.8.4)

### Breaking Change — Minimum iOS deployment target raised to 15.0

The Ometria iOS native SDK now requires iOS 15.0 as the minimum deployment target (previously 11.0).

**1. Update `ometria-react-native-sdk.podspec`:**
```ruby
s.platforms = { :ios => "15.0" }
```

**2. Update `example/ios/Podfile`:**
```ruby
platform :ios, '15.0'
```

**3. Update Xcode project** — set `IPHONEOS_DEPLOYMENT_TARGET` to `15.0` in all build configurations.

> Any app consuming this SDK must also target iOS 15.0 or higher.

### Non-breaking changes

| Version | Change |
|---------|--------|
| 1.8.5 | Added `import UIKit` to fix SPM compilation error — no impact on CocoaPods users |
| 1.8.6 | Firebase upper version cap removed; notification delegate now guarded with `#if !APP_EXTENSION` to fix incorrect behaviour in Notification Service Extensions |
| 1.8.7 | Firebase re-capped at `<999.0.0` (cosmetic SPM change) |
| 1.8.9 | Swift tools version bumped from 5.3 to 5.9 in `Package.swift` |

---

## Upgrading to Android SDK 1.11.1 (from 1.11.0)

### No breaking changes

### Fix — Default deep link handler now supports custom schemes

The default `onNotificationInteraction` handler previously used `URLUtil.isValidUrl()` to validate URLs before opening them, which rejected custom deep link schemes (e.g. `myapp://`, `ometria://`). It now uses a `try-catch` on `ActivityNotFoundException` instead, so any registered scheme works out of the box.

The React Native SDK does not use `onNotificationInteraction` — notification taps are handled at the JS level via `onDeepLinkInteracted` instead. No changes required in the RN wrapper or consuming apps.

---

## Sample App — Deep Link Handling Fix

Both the Android and iOS `Linking.canOpenURL()` API require custom schemes to be explicitly whitelisted before they can be checked:
- **Android**: scheme must be declared in `AndroidManifest.xml` under `<queries>`
- **iOS**: scheme must be declared in `Info.plist` under `LSApplicationQueriesSchemes`

Without this, `canOpenURL()` returns `false` for custom schemes and the deep link is silently ignored.

**Replace `Linking.canOpenURL()` with `Linking.openURL()` directly**, which attempts to open the URL without any whitelist requirement and rejects if nothing can handle it — equivalent to the native 1.11.1 fix.

**Before:**
```ts
const handleDeepLinking = ({ url }: any) => {
  Linking.canOpenURL(url).then(supported => {
    if (supported) {
      Ometria.processUniversalLink(url).then(
        response => {
          Alert.alert('🔗 URL processed:', response);
        },
        error => {
          console.log(error);
          Alert.alert('🔗 Unable to process URL: ' + url);
        },
      );
    }
  });
};
```

**After:**
```ts
const handleDeepLinking = ({ url }: any) => {
  if (url.startsWith('https://') || url.startsWith('http://')) {
    Ometria.processUniversalLink(url).then(
      response => {
        Alert.alert('🔗 URL processed:', response);
      },
      error => {
        console.log(error);
        Alert.alert('🔗 Unable to process URL: ' + url);
      },
    );
  } else {
    Linking.openURL(url).catch(() => {
      Alert.alert('🔗 Unable to open URL: ' + url);
    });
  }
};
```

> `processUniversalLink` is a native method that parses HTTPS universal links via the Ometria SDK. Custom schemes bypass this and are opened directly by the OS.
