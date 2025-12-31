import { Platform } from 'react-native';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

import type {
  NativeModuleType,
  OmetriaNotificationData,
  OmetriaOnBackgroundMessagePayload,
} from '../types';
import { withParsedOmetriaPayload, parseOmetriaData } from '../utils';

export const createNotificationMethods = (OmetriaSDK: NativeModuleType) => {
  const onNotificationReceived = (
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ) => {
    const payload =
      Platform.OS === 'ios'
        ? withParsedOmetriaPayload(remoteMessage)
        : remoteMessage;
    OmetriaSDK.onNotificationReceived(
      payload as unknown as Record<string, unknown>
    );
  };

  const parseNotification = async (
    notification: FirebaseMessagingTypes.RemoteMessage
  ): Promise<OmetriaNotificationData | undefined> => {
    if (Platform.OS === 'android') {
      const parsed = (await OmetriaSDK.parseNotification(
        notification as unknown as Record<string, unknown>
      )) as OmetriaNotificationData | null;
      return parsed ?? undefined;
    }

    return notification?.data?.ometria
      ? (parseOmetriaData(notification.data.ometria) as OmetriaNotificationData)
      : undefined;
  };

  const onNotificationOpenedApp = async (
    notification: FirebaseMessagingTypes.RemoteMessage
  ) => {
    const payload =
      Platform.OS === 'ios'
        ? withParsedOmetriaPayload(notification)
        : notification;

    await OmetriaSDK.onNotificationInteracted(
      payload as unknown as Record<string, unknown>
    );
    await OmetriaSDK.flush();
  };

  const onAndroidBackgroundMessage = async (
    payload: OmetriaOnBackgroundMessagePayload
  ) => {
    if (Platform.OS !== 'android') {
      return;
    }

    await OmetriaSDK.initializeWithApiToken(
      payload.ometriaToken,
      payload.ometriaOptions ?? {} // Keep it coerced
    );
    onNotificationReceived(payload.remoteMessage);
  };

  return {
    onNotificationReceived,
    parseNotification,
    onNotificationOpenedApp,
    onAndroidBackgroundMessage,
  };
};
