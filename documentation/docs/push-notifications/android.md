---
sidebar_position: 3
title: Android Setup
---

# Android Push Notifications

Additional Android setup for background notification tracking.

## Background Message Handler

To track notifications received when the app is in quit or background state, set up a background message handler in `index.js`:

```js
import { AppRegistry, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import Ometria from 'react-native-ometria';
import App from './App';

// Android background message handler
if (Platform.OS === 'android') {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    Ometria.onAndroidBackgroundMessage({
      ometriaToken: 'YOUR_OMETRIA_API_KEY',
      ometriaOptions: {},
      remoteMessage,
    });
  });
}

AppRegistry.registerComponent('YourApp', () => App);
```

:::note
The `ometriaToken` is required because the SDK needs to initialize in the background context.
:::

## Notification Channel

Android 8.0+ requires notification channels. Set a custom channel name during initialization:

```js
await Ometria.initializeWithApiToken('API_KEY', {
  notificationChannelName: 'Promotions',
});
```

If not specified, the channel name defaults to blank.

## Android Manifest

Ensure your `AndroidManifest.xml` has the notification permission (Android 13+):

```xml
<manifest ...>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    <application ...>
        ...
    </application>
</manifest>
```

## Complete Example

Here's a complete `index.js` setup:

```js
import { AppRegistry, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import Ometria from 'react-native-ometria';
import App from './App';
import { name as appName } from './app.json';

// Handle background messages on Android
if (Platform.OS === 'android') {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background message received:', remoteMessage);

    Ometria.onAndroidBackgroundMessage({
      ometriaToken: 'YOUR_OMETRIA_API_KEY',
      ometriaOptions: {
        notificationChannelName: 'Promotions',
      },
      remoteMessage,
    });
  });
}

AppRegistry.registerComponent(appName, () => App);
```

## Deprecated Methods

:::warning Deprecation Notice
As of version 2.4.0:
- `Ometria.setBackgroundMessageHandler` is deprecated. Use `Ometria.onAndroidBackgroundMessage` instead.
- `Ometria.onNotificationInteracted` is deprecated. Use `Ometria.onNotificationOpenedApp` instead.
:::
