import { Platform } from 'react-native';

import type {
  NativeModuleType,
  OmetriaNotificationData,
  OmetriaOnBackgroundMessagePayload,
  OmetriaRemoteMessage,
} from '../types';
import { withParsedOmetriaPayload, parseOmetriaData } from '../utils';

export const createNotificationMethods = (OmetriaSDK: NativeModuleType) => {
  const onNotificationReceived = (remoteMessage: OmetriaRemoteMessage) => {
    const payload =
      Platform.OS === 'ios'
        ? withParsedOmetriaPayload(remoteMessage)
        : remoteMessage;
    void OmetriaSDK.onNotificationReceived(
      payload as unknown as Record<string, unknown>
    );
  };

  const parseNotification = async (
    notification: OmetriaRemoteMessage
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
    notification: OmetriaRemoteMessage
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
