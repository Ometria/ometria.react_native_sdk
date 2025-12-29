import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

import type { MaybeNull } from './types';

export const LINKING_ERROR =
  `The package 'react-native-ometria' is not linked correctly.\n` +
  `• For Expo: Run 'npx expo prebuild' and rebuild your development client.\n` +
  `• For bare React Native: Run 'pod install' in the ios directory and rebuild.\n` +
  `• Ensure you have installed all package dependencies.`;

export const coerce = <T>(value: MaybeNull<T>): T | null => value ?? null;

export const withParsedOmetriaPayload = (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): FirebaseMessagingTypes.RemoteMessage => ({
  ...remoteMessage,
  data: {
    ometria: JSON.parse(remoteMessage?.data?.ometria || '{}'),
  },
});
