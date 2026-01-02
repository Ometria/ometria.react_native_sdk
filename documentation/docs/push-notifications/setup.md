---
sidebar_position: 1
title: Firebase Setup
---

# Push Notifications Setup

Ometria uses [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) to send push notifications.

:::tip Expo Users
If you're using Expo with the Ometria config plugin, the Google Services configuration for Android is handled automatically. You still need to:
1. Add your Firebase configuration files (`GoogleService-Info.plist` for iOS, `google-services.json` for Android)
2. Install the Firebase messaging package
3. Follow the code setup below
:::

## Overview

When correctly set up, Ometria can send personalised notifications for your mobile application. Follow these steps:

1. Enable your app to receive push notifications by creating an appId and enabling the push notifications entitlement
2. Set up a [Firebase](https://firebase.google.com/docs/cloud-messaging) account and connect it to Ometria
3. Enable Cloud Messaging on your Firebase account and provide your application's **SSL push certificate**
4. Configure push notifications in your application
5. Add a **Notification Service Extension** to your app (iOS) to enable rich content notifications and track notifications received in quit state

## Prerequisites

1. Ometria SDK initialized
2. Firebase account configured
3. Push notifications enabled in your app

## Install Firebase

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

You will use Firebase in your app with the following imports:

```js
import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
```

### Android Setup

Follow the [Firebase for Android](https://rnfirebase.io/#2-android-setup) guide.

### iOS Setup

Follow the [Firebase for iOS](https://rnfirebase.io/#3-ios-setup) guide.

:::warning Firebase Version
We recommend using Firebase CocoaPods version 10.10.0 or newer.
:::

## Request Notification Permission

### Android 13+

Add to `AndroidManifest.xml`:

```xml
<manifest ...>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    <application ...>
        ...
    </application>
</manifest>
```

### Request Permission

Using [react-native-permissions](https://github.com/zoontek/react-native-permissions):

```js
import { requestNotifications, RESULTS } from 'react-native-permissions';

await requestNotifications(['alert', 'sound', 'badge']).then(({ status }) => {
  if (status === RESULTS.GRANTED) {
    console.log('Push Notification permissions granted!');
  }
});
```

Find more about [Notification runtime permissions on Android](https://developer.android.com/develop/ui/views/notifications/notification-permission).

## Forward Push Token to Ometria

After initialization, forward the Firebase token:

```js
import Ometria from 'react-native-ometria';
import messaging from '@react-native-firebase/messaging';

await Ometria.initializeWithApiToken('API_KEY', {
  notificationChannelName: 'Example Channel Name',
  appGroupIdentifier: 'group.com.yourapp',
});

// Get initial token
messaging()
  .getToken()
  .then((pushToken) => Ometria.onNewToken(pushToken));

// Listen for token refresh
messaging().onTokenRefresh((pushToken) => Ometria.onNewToken(pushToken));
```

## Handle Foreground Notifications

```js
messaging().onMessage(async (remoteMessage) => {
  Ometria.onNotificationReceived(remoteMessage);
  const ometriaData = Ometria.parseNotification(remoteMessage);
  // Handle notification display
});
```

:::note
Foreground notifications are **not** automatically shown to the user. You need to trigger a local notification or update the UI. Read more about [foreground state messages](https://rnfirebase.io/messaging/usage#foreground-state-messages).

If you implement a custom solution, don't forget to call `Ometria.onNotificationOpenedApp` when handling the notification interaction event.
:::

## Handle Notification Interaction

When a user taps a notification:

```js
// App opened from quit state
messaging()
  .getInitialNotification()
  .then((remoteMessage) => {
    if (remoteMessage) {
      Ometria.onNotificationOpenedApp(remoteMessage);
    }
  });

// App opened from background
messaging().onNotificationOpenedApp((remoteMessage) =>
  Ometria.onNotificationOpenedApp(remoteMessage)
);
```

:::info Deprecated Methods
As of version 2.4.0, `Ometria.onNotificationInteracted` is deprecated. Use `Ometria.onNotificationOpenedApp` instead.
:::

## Handling Notification URLs

Ometria notifications can contain deep link URLs:

```js
const notif = await Ometria.parseNotification(remoteMessage);
if (notif?.deepLinkActionUrl) {
  Ometria.trackDeepLinkOpenedEvent(notif.deepLinkActionUrl, 'Browser');
  Linking.openURL(notif.deepLinkActionUrl);
}
```

### OmetriaNotificationData

```typescript
type OmetriaNotificationData = {
  campaignType?: 'trigger'; // automation campaigns
  deepLinkActionUrl?: string;
  externalCustomerId?: string;
  imageUrl?: string;
  sendId?: string;
  tracking: {
    utm_medium?: string; // default: "push"
    utm_source: string;
    utm_campaign: string;
    om_campaign: string;
    [key: string]: string | undefined;
  };
};
```
