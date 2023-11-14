import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

import type {
  OmetriaNotificationData as _OmetriaNotificationData,
  OmetriaNotificationHandlerInit,
  OmetriaOptions as _OmetriaOptions,
  OmetriaReactNativeSdkType,
} from './types';

const OmetriaReactNativeSdk = NativeModules.OmetriaReactNativeSdk as OmetriaReactNativeSdkType;

// Save original implementations
const _initializeWithApi = OmetriaReactNativeSdk.initializeWithApiToken;
const _onNotificationInteracted =
  OmetriaReactNativeSdk.onNotificationInteracted;

// initializeWithApiToken() custom implementation
OmetriaReactNativeSdk.initializeWithApiToken = (
  token: string,
  options?: _OmetriaOptions
) =>
  Platform.OS === 'android'
    ? _initializeWithApi(token, options ?? {})
    : _initializeWithApi(token);

// onNotificationOpenedApp() custom implementation
OmetriaReactNativeSdk.onNotificationOpenedApp = async ({
  remoteMessage,
}: {
  remoteMessage: any;
}) => {
  Platform.OS === 'android' && _onNotificationInteracted(remoteMessage);
};

// setBackgroundMessageHandler() custom implementation
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

// onNotificationInteracted() custom implementation for iOS only
const OmetriaEventEmitter =
  Platform.OS === 'ios' && new NativeEventEmitter(OmetriaReactNativeSdk as any);
(OmetriaReactNativeSdk as any).onNotificationInteracted = (
  handler: (response: _OmetriaNotificationData) => void
) => {
  OmetriaEventEmitter &&
    OmetriaEventEmitter.addListener(
      'onNotificationInteracted',
      (response: _OmetriaNotificationData) => handler(response)
    );
};

export default OmetriaReactNativeSdk;
export type OmetriaNotificationData = _OmetriaNotificationData;
export type OmetriaOptions = _OmetriaOptions;
