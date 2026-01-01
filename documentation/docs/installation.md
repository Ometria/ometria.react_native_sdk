---
sidebar_position: 2
title: Installation
---

# Installation

This library targets React Native 0.81.4 and ships with support for both the classic bridge and the New Architecture.

## Install the Package

```bash
npm install react-native-ometria
# or
yarn add react-native-ometria
```

:::tip
If you have issues installing the library, consider excluding the example from your TypeScript config:

```json
{
  "exclude": ["example"]
}
```
:::

## iOS Setup

Install CocoaPods dependencies:

```bash
cd ios && pod install
```

:::note
If you encounter `The Swift pod 'Ometria' depends upon 'FirebaseMessaging'` error, add this to your Podfile:

```ruby
use_frameworks! :linkage => :static
```
:::

## Enabling the New Architecture

### iOS

1. Add the Ometria TurboModule setup to your `Podfile`:

```ruby
# At the top of your Podfile (after other require statements)
require_relative '../node_modules/react-native-ometria/scripts/ometria_turbomodule'

# In your post_install block
post_install do |installer|
  react_native_post_install(
    installer,
    config[:reactNativePath],
    :mac_catalyst_enabled => false
  )

  # Register Ometria TurboModule (required for New Architecture)
  patch_ometria_turbomodule(installer)
end
```

2. Run pod install with the New Architecture flag:

```bash
RCT_NEW_ARCH_ENABLED=1 pod install
```

### Android

Run your build with the New Architecture flag:

```bash
./gradlew assembleDebug -PnewArchEnabled=true
```

Or set it permanently in `android/gradle.properties`:

```properties
newArchEnabled=true
```

:::info
Android builds require `compileSdkVersion`/`targetSdkVersion` 36 and `minSdkVersion` 24.
:::

## Initialize the SDK

```js
import Ometria from 'react-native-ometria';

await Ometria.initializeWithApiToken('API_KEY', {
  notificationChannelName: 'Example Channel Name', // optional, Android only
  appGroupIdentifier: 'group.com.ometria.sampleRN', // optional, iOS only
});
```

:::warning
Any other Ometria methods must be called **after** initialization.
:::

### Optional Parameters

| Parameter | Platform | Description |
|-----------|----------|-------------|
| `notificationChannelName` | Android | Custom name for the notification channel. Default is blank. |
| `appGroupIdentifier` | iOS | Required for Notification Service Extension. See [iOS Push Setup](./push-notifications/ios). |

### Debugging

Enable advanced logging to see what's happening in the background:

```js
Ometria.isLoggingEnabled(true);
```
