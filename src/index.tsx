import { NativeModules, Platform } from 'react-native';

import type {
  OmetriaNotificationData,
  OmetriaNotificationHandlerInit,
  OmetriaOptions,
  OmetriaBasketItem,
  OmetriaReactNativeSdkType,
  OmetriaBasket,
  OmetriaNotificationHandler,
} from './types';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

const OmetriaReactNativeSdk =
  NativeModules.OmetriaReactNativeSdk as OmetriaReactNativeSdkType;

// 🛟 Save original implementations
const _initializeWithApi = OmetriaReactNativeSdk.initializeWithApiToken;
const _parseNotification = OmetriaReactNativeSdk.parseNotification;
const _onNotificationReceived = OmetriaReactNativeSdk.onNotificationReceived;
const _onNotificationInteracted =
  /* This is marked as deprecated to the end user,
  as the method has changed its signature and
  we don't want to expose it anymore to the end user
  However, we still need to use it internally */
  OmetriaReactNativeSdk.onNotificationInteracted;

// 🛠️ Custom Implementation: initializeWithApiToken()
OmetriaReactNativeSdk.initializeWithApiToken = (
  token: string,
  options?: OmetriaOptions
) => _initializeWithApi(token, options ?? {});

// 🛠️ Custom Implementation: onNotificationOpenedApp()
OmetriaReactNativeSdk.onNotificationOpenedApp = async ({
  remoteMessage,
}: {
  remoteMessage: any;
}) => {
  const iOSRemoteMessage = {
    ...remoteMessage,
    data: {
      ometria: JSON.parse(remoteMessage?.data?.ometria || '{}'),
    },
  };
  // This is marked as deprecated to the end user, but we still need to use it internally
  _onNotificationInteracted(
    Platform.OS === 'ios' ? iOSRemoteMessage : remoteMessage
  );
  OmetriaReactNativeSdk.flush();
};

// 🛠️ Custom Implementation: onNotificationReceived()
OmetriaReactNativeSdk.onNotificationReceived = (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
) => {
  const iOSRemoteMessage = {
    ...remoteMessage,
    data: {
      ometria: JSON.parse(remoteMessage?.data?.ometria || '{}'),
    },
  };
  _onNotificationReceived(
    Platform.OS === 'ios' ? iOSRemoteMessage : remoteMessage
  );
};

// 🛠️ Custom Implementation: parseNotification()
OmetriaReactNativeSdk.parseNotification = async (
  notification: FirebaseMessagingTypes.RemoteMessage
) => {
  const parsedNotification =
    Platform.OS === 'android'
      ? await _parseNotification(notification)
      : (Promise.resolve(
          notification?.data?.ometria
            ? JSON.parse(notification.data.ometria)
            : undefined
        ) as unknown as OmetriaNotificationData);

  return parsedNotification;
};

// 🛠️ Custom Implementation: 🤖 only - setBackgroundMessageHandler()
OmetriaReactNativeSdk.setBackgroundMessageHandler = async ({
  ometriaToken,
  remoteMessage,
  ometriaOptions,
}: OmetriaNotificationHandlerInit) => {
  Platform.OS === 'android' &&
    OmetriaReactNativeSdk.initializeWithApiToken(
      ometriaToken,
      ometriaOptions
    ).then(async () => {
      OmetriaReactNativeSdk.onNotificationReceived(remoteMessage);
    });
};

export default OmetriaReactNativeSdk;

export {
  OmetriaBasket,
  OmetriaBasketItem,
  OmetriaNotificationData,
  OmetriaOptions,
  OmetriaNotificationHandler,
};
