---
sidebar_position: 1
title: Firebase Setup
---

# Push Notifications Setup

Ometria uses [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) to send push notifications.

## Prerequisites

1. Ometria SDK initialized
2. Firebase account configured
3. Push notifications enabled in your app

## Install Firebase

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
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
Foreground notifications are **not** automatically shown to the user. You need to trigger a local notification or update the UI.
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
