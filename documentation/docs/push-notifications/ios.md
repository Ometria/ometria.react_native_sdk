---
sidebar_position: 2
title: iOS Setup
---

# iOS Push Notifications

Additional iOS setup for rich notifications and background tracking.

## Notification Service Extension

The Notification Service Extension enables:

1. **Rich notifications** - Display images and media content (iOS 12+)
2. **Background tracking** - Track notifications received when app is quit

### Add the Extension

1. Go to **File > New > Target**
2. Select **Notification Service Extension > Next**
3. Name it (e.g., `NotificationService`)

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
4. Add a group identifier (e.g., `group.com.yourcompany.yourapp`)
5. Repeat for the **NotificationService** target

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
