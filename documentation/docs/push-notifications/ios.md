---
sidebar_position: 2
title: iOS Setup
---

# iOS Push Notifications

Additional iOS setup for rich notifications and background tracking.

:::tip Expo Users
If you're using Expo with the Ometria config plugin, the Notification Service Extension is created automatically during `npx expo prebuild`. You can skip this entire page!

The plugin automatically:
- Generates `appGroupIdentifier` as `group.{ios.bundleIdentifier}`
- Sets up all entitlements
- Creates the Notification Service Extension
- Configures `Info.plist` so the native SDK reads the value automatically

**No configuration needed** - just add `["react-native-ometria"]` to your plugins and run prebuild.

If you need a custom app group, use:
```json
["react-native-ometria", { "customAppGroupIdentifier": "group.com.custom.identifier" }]
```
:::

## Notification Service Extension

The Notification Service Extension enables:

1. **Rich notifications** - Display images and media content (iOS 12+)
2. **Background tracking** - Track notifications received when app is quit

### Add the Extension

1. Go to **File > New > Target**
2. Select **Notification Service Extension > Next**
3. Name it (e.g., `NotificationService`)

![Notification Service Extension](https://raw.githubusercontent.com/wiki/Ometria/ometria.ios_sdk/images/notification_service_extension.png)

A new item will appear in your target list:

![Project Targets](https://raw.githubusercontent.com/wiki/Ometria/ometria.ios_sdk/images/project_targets.png)

### Update Podfile

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

Run `pod install` after updating.

### Create App Group

Both the main app and extension need to share data via an App Group.

1. In Xcode, select your project
2. Go to **Signing & Capabilities**
3. Click **+ Capability** and add **App Groups**

![Add Capability](https://github.com/Ometria/ometria.ios_sdk/assets/6207062/dd8cd6e7-ff00-41be-9573-2589436a4616)

4. Add a group identifier (e.g., `group.com.yourcompany.yourapp`)
5. Repeat for the **NotificationService** target

![App Groups](https://github.com/Ometria/ometria.ios_sdk/assets/6207062/3d9d0500-3832-4312-a918-e5b05404886d)

### Update NotificationService

Replace the contents of `NotificationService.swift`:

```swift
import UserNotifications
import Ometria

class NotificationService: OmetriaNotificationServiceExtension {
  override func instantiateOmetria() -> Ometria? {
    Ometria.initializeForExtension(appGroupIdentifier: "group.com.yourcompany.yourapp")
  }
}
```

### Initialize with App Group

Update your Ometria initialization:

```js
await Ometria.initializeWithApiToken('API_KEY', {
  appGroupIdentifier: 'group.com.yourcompany.yourapp',
});
```

## Background/Quit State Handling

With the Notification Service Extension configured, notifications received when the app is quit will automatically:

1. Be tracked as `notificationReceived` events
2. Display rich content (images)

No additional code is needed in your React Native app for iOS background handling.

:::tip Sample App
For a complete example and use case, see the [Sample app](https://github.com/Ometria/ometria.react-native-sdk/tree/main/example/src/App.tsx).
:::
