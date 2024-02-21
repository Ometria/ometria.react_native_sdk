import { NativeModules, Platform } from 'react-native';

import type {
  OmetriaNotificationData,
  OmetriaOptions,
  OmetriaBasketItem,
  OmetriaBasket,
  OmetriaNotification,
  OmetriaReactNativeSdkType,
} from './types';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

const OmetriaReactNativeSdk =
  NativeModules.OmetriaReactNativeSdk as OmetriaReactNativeSdkType;

// 🛟 Save original implementations
const _onNotificationReceived = OmetriaReactNativeSdk.onNotificationReceived;
const _initializeWithApi = OmetriaReactNativeSdk.initializeWithApiToken;
const _parseNotification = OmetriaReactNativeSdk.parseNotification;
const _onNotificationInteracted = (
  OmetriaReactNativeSdk as unknown as OmetriaReactNativeSdkInternalType
).onNotificationInteracted;

// 🛠️ Custom Implementation: initializeWithApiToken()
OmetriaReactNativeSdk.initializeWithApiToken = (
  token: string,
  options?: OmetriaOptions
) => _initializeWithApi(token, options ?? {});

// 🛠️ Custom Implementation: onNotificationOpenedApp()
OmetriaReactNativeSdk.onNotificationOpenedApp = async (remoteMessage) => {
  const iOSRemoteMessage = {
    ...remoteMessage,
    data: {
      ometria: JSON.parse(
        remoteMessage?.data?.ometria || '{}'
      ) as OmetriaNotificationData,
    },
  };

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

// 🛠️ Custom Implementation: 🤖 only - onBackgroundMessage()
OmetriaReactNativeSdk.onAndroidBackgroundMessage = async ({
  ometriaToken,
  remoteMessage,
  ometriaOptions,
}) => {
  Platform.OS === 'android' &&
    OmetriaReactNativeSdk.initializeWithApiToken(
      ometriaToken,
      ometriaOptions
    ).then(async () => {
      OmetriaReactNativeSdk.onNotificationReceived(remoteMessage);
    });
};

// 🛠️ Deprecated Implementations
OmetriaReactNativeSdk.setBackgroundMessageHandler = async () => {
  console.warn(
    'setBackgroundMessageHandler is deprecated, no longer works and will be removed in the next major version'
  );
  Promise.resolve();
};

OmetriaReactNativeSdk.onNotificationInteracted = () => {
  console.warn(
    'onNotificationInteracted is deprecated, no longer works and will be removed in the next major version'
  );
  return () => {};
};

// 🪦 onNotificationInteracted is a private method that was deprecated for the public API
type OmetriaReactNativeSdkInternalType = Omit<
  OmetriaReactNativeSdkType,
  'onNotificationInteracted'
> & {
  onNotificationInteracted: (
    notification: Omit<FirebaseMessagingTypes.RemoteMessage, 'data'> & {
      data?:
        | {
            ometria: OmetriaNotificationData;
          }
        | { [key: string]: string };
    }
  ) => void;
};

export default OmetriaReactNativeSdk;

export {
  OmetriaBasket,
  OmetriaBasketItem,
  OmetriaNotificationData,
  OmetriaOptions,
  OmetriaNotification,
};
