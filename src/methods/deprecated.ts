import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

import type {
  OmetriaNotificationData,
  OmetriaOnBackgroundMessagePayload,
} from '../types';

const deprecatedOnMessageReceived = (
  _remoteMessage: FirebaseMessagingTypes.RemoteMessage
) => {
  console.warn(
    'onMessageReceived is deprecated. Use your own implementation to listen for new notifications. Call onNotificationReceived for Android to let the SDK know that the notification was received.'
  );
};

const deprecatedSetBackgroundMessageHandler = async (
  _handler: OmetriaOnBackgroundMessagePayload
) => {
  console.warn(
    'setBackgroundMessageHandler is deprecated, no longer works and will be removed in the next major version'
  );
};

const deprecatedOnNotificationInteracted = (
  _handler: (response: OmetriaNotificationData) => void
) => {
  console.warn(
    'onNotificationInteracted is deprecated, no longer works and will be removed in the next major version'
  );
  return () => {};
};

const deprecatedOnDeepLinkInteracted = async (): Promise<string> => {
  console.warn(
    'onDeepLinkInteracted is deprecated. The SDK no longer handles notification interactions. Use your own implementation to listen for notification interactions.'
  );
  return '';
};

export const deprecatedMethods = {
  onMessageReceived: deprecatedOnMessageReceived,
  setBackgroundMessageHandler: deprecatedSetBackgroundMessageHandler,
  onNotificationInteracted: deprecatedOnNotificationInteracted,
  onDeepLinkInteracted: deprecatedOnDeepLinkInteracted,
};
