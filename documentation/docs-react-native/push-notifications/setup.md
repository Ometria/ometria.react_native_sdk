---
sidebar_position: 1
title: Setup
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Push Notifications Setup

Ometria uses [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) to send push notifications to the mobile devices. When correctly set up, Ometria can send personalised notifications for your mobile application. Follow these steps:

- Enable your app to receive push notifications by creating an appId and enabling the push notifications entitlement
- Set up a [Firebase](https://firebase.google.com/docs/cloud-messaging) account and connect it to Ometria
- Enable Cloud Messaging on your Firebase account and provide your application's **SSL push certificate**
- Configure push notifications in your application
- Add a **Notification Service Extension** to your app in order to enable receiving rich content notifications and to track notifications received in quit state of the app on iOS

## 1. Firebase Setup

<Tabs>
  <TabItem value="expo" label="Expo" default>

#### 1. Install Firebase packages

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

#### 2. Add Firebase configuration files

Add `GoogleService-Info.plist` (iOS) and `google-services.json` (Android) to your project, and reference them in your `app.json`:

```json
{
  "expo": {
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

The Ometria config plugin handles the Google Services Gradle configuration for Android automatically during `npx expo prebuild`.

  </TabItem>
  <TabItem value="bare" label="Bare React Native">

#### 1. Install Firebase packages

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

#### 2. Configure Firebase for each platform

- **Android**: Follow the [Firebase for Android](https://rnfirebase.io/#2-android-setup) guide
- **iOS**: Follow the [Firebase for iOS](https://rnfirebase.io/#3-ios-setup) guide

You will use Firebase in your app with the following imports:

```js
import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
```

:::warning[Firebase Version]

We recommend using Firebase CocoaPods version 10.10.0 or newer.

:::

  </TabItem>
</Tabs>

## 2. Request Notification Permission

You need to request notification permissions on both iOS and Android. Install [react-native-permissions](https://github.com/zoontek/react-native-permissions):

```bash
npm install react-native-permissions
```

<Tabs>
  <TabItem value="expo" label="Expo" default>

Add the `react-native-permissions` Expo plugin to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      ["react-native-ometria"],
      [
        "react-native-permissions",
        {
          "iosPermissions": ["Notifications"]
        }
      ]
    ]
  }
}
```

:::note

Only `iosPermissions` is needed in the plugin config — this tells the build which native iOS permission handlers to include. Android permissions don't require plugin configuration; they are handled via the manifest and runtime request automatically.

:::

  </TabItem>
  <TabItem value="bare" label="Bare React Native">

For Android 13 (API level 33) and higher, declare the permission in your `AndroidManifest.xml`:

```xml
<manifest ...>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    <application ...>
        ...
    </application>
</manifest>
```

Find more about [Notification runtime permissions on Android](https://developer.android.com/develop/ui/views/notifications/notification-permission).

  </TabItem>
</Tabs>

#### Request Permission at Runtime

After the platform-specific configuration above, request permissions in your app (both iOS and Android):

```js
import { requestNotifications, RESULTS } from 'react-native-permissions';

await requestNotifications(['alert', 'sound', 'badge']).then(({ status }) => {
  if (status === RESULTS.GRANTED) {
    console.log('Push Notification permissions granted!');
  }
});
```

## 3. Forward Push Token to Ometria

After Ometria initialisation, you **must forward the Firebase push notification token** (both iOS and Android).

You also have to forward the push notification token to Ometria every time it is refreshed.

<Tabs>
  <TabItem value="expo" label="Expo" default>

Expo uses the Firebase modular API:

```js
import Ometria from 'react-native-ometria';
import {
  getMessaging,
  getToken,
  onTokenRefresh,
} from '@react-native-firebase/messaging';

await Ometria.initializeWithApiToken('YOUR_API_KEY', {
  notificationChannelName: 'Promotions', // optional, Android only
});

const messagingInstance = getMessaging();

// Get initial token
getToken(messagingInstance).then((pushToken) => Ometria.onNewToken(pushToken));

// Listen for token refresh
onTokenRefresh(messagingInstance, (pushToken) => Ometria.onNewToken(pushToken));
```

:::tip
With Expo, the `appGroupIdentifier` is automatically generated as `group.{ios.bundleIdentifier}` and set via `Info.plist`. You don't need to pass it explicitly unless you need a custom value.

The `notificationChannelName` sets the Android notification channel name (Android 8.0+). If not specified, it defaults to blank.
:::

  </TabItem>
  <TabItem value="bare" label="Bare React Native">

```js
import Ometria from 'react-native-ometria';
import messaging from '@react-native-firebase/messaging';

await Ometria.initializeWithApiToken('YOUR_API_KEY', {
  notificationChannelName: 'Example Channel Name', // optional, Android only
  appGroupIdentifier: 'group.com.yourcompany.yourapp', // required for iOS NSE
});

// Get initial token
messaging()
  .getToken()
  .then((pushToken) => Ometria.onNewToken(pushToken));

// Listen for token refresh
messaging().onTokenRefresh((pushToken) => Ometria.onNewToken(pushToken));
```

:::note
The `appGroupIdentifier` must match the App Group you configure in Xcode for both the main app and the Notification Service Extension. See [Notification Service Extension](./notification-service-extension.md) for details.

The `notificationChannelName` sets the Android notification channel name (Android 8.0+). If not specified, it defaults to blank.
:::

  </TabItem>
</Tabs>

## 4. Handle Foreground Notifications

Subscribe to remote messages that your app gets while in foreground app state. You can do this by using the `onMessage` method from the `@react-native-firebase/messaging` package.

In the callback, you can use `Ometria.onNotificationReceived` to let the Ometria SDK know that a remote message has been received and the `notificationReceived` event will be fired. Use `Ometria.parseNotification` if you want to extract Ometria data from the remote message.

```js
messaging().onMessage(async (remoteMessage) => {
  Ometria.onNotificationReceived(remoteMessage);
  const ometriaData = Ometria.parseNotification(remoteMessage);
  // Handle notification display
});
```

:::note
Foreground notifications are **not** automatically displayed by the operating system. This is a [known Firebase behaviour](https://rnfirebase.io/messaging/notifications) — when the app is in the foreground, the notification data is delivered via an event but no visible notification is shown.

Since the app receives the notification data, you can display your own notification (custom UI or local system notification). Read more about [foreground state messages](https://rnfirebase.io/messaging/usage#foreground-state-messages).

If you implement a custom solution, don't forget to call `Ometria.onNotificationOpenedApp` when handling the notification interaction event.
:::

## 5. Handle Background & Quit State Notifications

<Tabs>
  <TabItem value="expo" label="Expo" default>

#### iOS

The Ometria Expo config plugin automatically creates the Notification Service Extension during `npx expo prebuild`. **No manual setup is needed** — just make sure `["react-native-ometria"]` is in your `app.json` plugins.

See [Notification Service Extension](./notification-service-extension.md) for plugin options like `customAppGroupIdentifier` and `skipNSE`.

#### Android

Add the background handler at the top level of your app entry point (e.g. `App.tsx`):

```js
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import Ometria from 'react-native-ometria';

// Android background message handler (must be at top level)
if (Platform.OS === 'android') {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    Ometria.onAndroidBackgroundMessage({
      ometriaToken: 'YOUR_OMETRIA_API_KEY',
      ometriaOptions: {
        notificationChannelName: 'Promotions', // optional, sets the notification channel
      },
      remoteMessage,
    });
  });
}
```

:::tip

You can pass `notificationChannelName` in `ometriaOptions` to set the Android notification channel when the SDK initializes in the background.

:::

  </TabItem>
  <TabItem value="bare" label="Bare React Native">

#### iOS

You must manually add a Notification Service Extension target in Xcode, configure App Groups, and update the `NotificationService.swift` file.

See [Notification Service Extension](./notification-service-extension.md) for the complete step-by-step guide.

#### Android

Add the background handler at the top level of your app entry point (e.g. `index.js`):

```js
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import Ometria from 'react-native-ometria';

// Android background message handler (must be at top level)
if (Platform.OS === 'android') {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    Ometria.onAndroidBackgroundMessage({
      ometriaToken: 'YOUR_OMETRIA_API_KEY',
      ometriaOptions: {
        notificationChannelName: 'Promotions', // optional, sets the notification channel
      },
      remoteMessage,
    });
  });
}
```

:::tip

You can pass `notificationChannelName` in `ometriaOptions` to set the Android notification channel when the SDK initializes in the background.

:::

  </TabItem>
</Tabs>

:::note

The `ometriaToken` is required because the SDK needs to initialize in the background context where your normal app initialization hasn't run.

:::

:::info[Deprecated Methods]

As of version 2.4.0, `Ometria.setBackgroundMessageHandler` is deprecated. Use `Ometria.onAndroidBackgroundMessage` instead.

:::

## 6. Handle Notification Interaction

When a user interacts with a notification in background or quit state, you have to let the Ometria SDK know that the notification has been interacted with and the app has been opened. You can do this by calling `Ometria.onNotificationOpenedApp` with the remote message as a parameter.

```js
// Check if the app was opened from quit state by a notification
messaging()
  .getInitialNotification()
  .then((remoteMessage) => {
    if (remoteMessage) {
      Ometria.onNotificationOpenedApp(remoteMessage);
    }
  });

// Subscribe to the app being opened from background state by a notification
messaging().onNotificationOpenedApp((remoteMessage) =>
  Ometria.onNotificationOpenedApp(remoteMessage)
);
```

:::info[Deprecated Methods]

As of version 2.4.0, `Ometria.onNotificationInteracted` is deprecated. Use `Ometria.onNotificationOpenedApp` instead.

:::

## 7. Handling Notification URLs

Ometria allows you to send URLs and tracking info alongside your push notifications and allows you to handle them on the device. When a notification opens the app, you can parse the notification remote message and check if it contains a deep link URL.

```js
const notif = await Ometria.parseNotification(remoteMessage);
if (notif?.deepLinkActionUrl) {
  Ometria.trackDeepLinkOpenedEvent(notif.deepLinkActionUrl, 'Browser');
  Linking.openURL(notif.deepLinkActionUrl);
}
```

#### OmetriaNotificationData

`Ometria.parseNotification` returns an object with `OmetriaNotificationData` type that looks like this:

```typescript
type OmetriaNotificationData = {
  campaignType?: 'trigger'; // represents automation campaigns
  deepLinkActionUrl?: string;
  externalCustomerId?: string;
  imageUrl?: string;
  sendId?: string;
  tracking: {
    // Can be overridden / added in your automation campaign's settings
    utm_medium?: string; // default is "push"
    utm_source: string;
    utm_campaign: string; // generated from campaign hash and title
    om_campaign: string; // generated from campaign hash, campaign version and node id
    [key: string]: string | undefined; // additional tracking data you add
  };
};
```
