---
sidebar_position: 2
title: Notification Service Extension
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# iOS Push Notifications

Additional iOS setup for rich notifications and background tracking.

## Notification Service Extension

The Notification Service Extension has two purposes:

1. **Rich notifications** — Starting with iOS 12.0, Apple enabled applications to receive and display notifications that contain media content such as images. Notifications must be processed by the Notification Service Extension before being shown to the user.
2. **Background tracking** — In order for Ometria to accurately track all notifications received when the app is in quit state, it needs a background service that has access to all notifications.

<Tabs>
  <TabItem value="expo" label="Expo" default>

If you're using Expo with the Ometria config plugin, the Notification Service Extension is created automatically during `npx expo prebuild`. **No manual Xcode configuration is needed.**

The plugin automatically:
- Creates the `OmetriaNotificationServiceExtension` target in Xcode
- Generates `appGroupIdentifier` as `group.{ios.bundleIdentifier}`
- Sets up all entitlements (push notifications + app groups) for both targets
- Configures `Info.plist` so the native SDK reads the app group value automatically
- Adds the required Podfile configuration (`use_frameworks!`, NSE pod target)

#### Plugin Options

Add to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      ["react-native-ometria"]
    ]
  }
}
```

If you need a custom app group identifier:

```json
{
  "expo": {
    "plugins": [
      ["react-native-ometria", { "customAppGroupIdentifier": "group.com.custom.identifier" }]
    ]
  }
}
```

To skip the NSE setup entirely (rich notifications and quit-state tracking will not work):

```json
{
  "expo": {
    "plugins": [
      ["react-native-ometria", { "skipNSE": true }]
    ]
  }
}
```

After configuring, run:

```bash
npx expo prebuild
```

  </TabItem>
  <TabItem value="bare" label="Bare React Native">

For bare React Native projects, you must manually set up the Notification Service Extension in Xcode.

### 1. Add the Extension Target

1. In Xcode, go to **File > New > Target**
2. Select **Notification Service Extension > Next**
3. Name it (e.g., `NotificationService`)

![Notification Service Extension](https://raw.githubusercontent.com/wiki/Ometria/ometria.ios_sdk/images/notification_service_extension.png)

A new item will appear in your target list:

![Project Targets](https://raw.githubusercontent.com/wiki/Ometria/ometria.ios_sdk/images/project_targets.png)

### 2. Update Podfile

Make sure the Ometria SDK is available to the new target by updating your Podfile:

```ruby
# Move this line before the App target
pod 'GoogleUtilities', :modular_headers => true

use_frameworks! :linkage => :static

target 'YourApp' do
  # Your app pods
end

# Add the extension target
target 'NotificationService' do
  use_frameworks! :linkage => :static
  pod 'Ometria'
end
```

Then run:

```bash
pod install
```

### 3. Create an App Group

The main application and the extension function as two separate entities. In order for the extension to obtain read and write access to data relevant for the SDK, both targets must be in the same App Group.

1. In Xcode, select your project in the navigator
2. Go to **Signing & Capabilities**
3. Click **+ Capability** in the top left corner and add **App Groups**

![Add Capability](https://github.com/Ometria/ometria.ios_sdk/assets/6207062/dd8cd6e7-ff00-41be-9573-2589436a4616)

4. Add a group identifier (e.g., `group.com.yourcompany.yourapp`) — retain this value as you will need it when initialising Ometria
5. **Repeat** the process for the **NotificationService** extension target

![App Groups](https://github.com/Ometria/ometria.ios_sdk/assets/6207062/3d9d0500-3832-4312-a918-e5b05404886d)

### 4. Update NotificationService

Open the `NotificationService` class that was automatically created alongside the extension, and replace its contents with:

```swift
import UserNotifications
import Ometria

class NotificationService: OmetriaNotificationServiceExtension {
  override func instantiateOmetria() -> Ometria? {
    Ometria.initializeForExtension(appGroupIdentifier: "group.com.yourcompany.yourapp")
  }
}
```

### 5. Initialize with App Group

Update your Ometria initialization to include the app group identifier:

```js
await Ometria.initializeWithApiToken('API_KEY', {
  appGroupIdentifier: 'group.com.yourcompany.yourapp',
});
```

:::warning
The `appGroupIdentifier` value must match exactly between:
- The App Group in Xcode Signing & Capabilities (main app target)
- The App Group in Xcode Signing & Capabilities (NotificationService target)
- The `NotificationService.swift` file
- The `initializeWithApiToken` call in your React Native code
:::

  </TabItem>
</Tabs>

## Background/Quit State Handling

With the Notification Service Extension configured, notifications received when the app is in quit state will automatically:

1. Be tracked as `notificationReceived` events
2. Display rich content (images)

No additional React Native code is needed for iOS background handling — the NSE handles everything natively.

:::tip Sample App
For a complete example, see the [Expo sample app](https://github.com/Ometria/ometria.react_native_sdk/tree/master/example-expo/src/App.tsx).
:::
