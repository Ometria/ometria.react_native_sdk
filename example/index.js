/**
 * @format
 */

import App from './src/App';
import { name as appName } from './app.json';

// Add these libraries import to your index.js file
import Ometria from 'react-native-ometria';
import { AppRegistry, Platform } from 'react-native';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';

// Utils & data
import { getOmetriaTokenFromStorage } from './src/utils';
import { customOmetriaOptions } from './src/data';

// Early subscribe to background PN messages on Android - Quit notifications will be handled by the Ometria SDK
Platform.OS === 'android' &&
  setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
    Ometria.onAndroidBackgroundMessage({
      // 🏹 Ometria Event Logged: onNotificationReceived
      ometriaToken: await getOmetriaTokenFromStorage(),
      ometriaOptions: customOmetriaOptions,
      remoteMessage,
    });
  });

AppRegistry.registerComponent(appName, () => App);
