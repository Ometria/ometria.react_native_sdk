# Upgrading Native SDK Versions

Use this guide when bumping the underlying Ometria iOS or Android native SDK dependency.

---

## iOS

### 1. Check for breaking changes

Review the iOS SDK changelog between the old and new version:
```
https://github.com/Ometria/ometria.ios_sdk/compare/vOLD...vNEW
```

Pay attention to:
- Minimum iOS deployment target changes
- API removals or renames
- New required configuration

### 2. Update the version

**`package.json`** — `ometria_sdk_version.ios`:
```json
"ometria_sdk_version": {
  "ios": "1.8.9"
}
```

**`ometria-react-native-sdk.podspec`** — reads from `package.json` automatically, no manual change needed.
However, if the minimum iOS deployment target changed, update:
```ruby
s.platforms = { :ios => "15.0" }
```

**`example/ios/Podfile`** — the `NotificationsService` extension target pins the version explicitly:
```ruby
pod 'Ometria', '1.8.9' # Keep in sync with ometria_sdk_version.ios in package.json
```

> The main app target resolves the version via the podspec automatically.
> The extension target needs a manual pin because it doesn't go through the podspec.

### 3. Run pod install

```sh
cd example/ios && pod install
```

### 4. If the minimum iOS deployment target changed

Update the Xcode project deployment target in Xcode:
**Project → sampleApp → Build Settings → iOS Deployment Target**

Also update `example-expo/ios/Podfile` if it pins a version.

---

## Android

### 1. Check for breaking changes

Review the Android SDK changelog between the old and new version:
```
https://github.com/Ometria/ometria.android_sdk/compare/OLD...NEW
```

### 2. Update the version

**`android/gradle.properties`**:
```properties
OmetriaReactNativeSdk_ometriaAndroidSdkVersion=1.11.1
```

That's it — `android/build.gradle` reads this property and passes it to:
```groovy
implementation "com.ometria:android-sdk:$ometria_android_sdk_version"
```

### 3. Sync Gradle

Sync Gradle in Android Studio, or run:
```sh
cd example/android && ./gradlew build
```

---

## After upgrading both

- Update `CHANGELOG.md` with the new native SDK versions
- If there are breaking changes or migration steps for consumers, add a section to `UPGRADE.md`
