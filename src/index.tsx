import { NativeModules } from 'react-native';

import { LINKING_ERROR } from './utils';
import NativeOmetriaReactNativeSdk, {
  isNewArchitecture,
  isRunningInJest,
  isTurboModuleEnabled,
} from './NativeOmetriaReactNativeSdk';
import {
  createNativeMethods,
  createNotificationMethods,
  deprecatedMethods,
} from './methods';
import type {
  NativeModuleType,
  OmetriaBasket,
  OmetriaBasketItem,
  OmetriaNotification,
  OmetriaNotificationData,
  OmetriaOptions,
  OmetriaReactNativeSdkType,
  OmetriaRemoteMessage,
} from './types';

const OmetriaSDK = (
  isTurboModuleEnabled
    ? NativeOmetriaReactNativeSdk
    : NativeModules.OmetriaReactNativeSdk
) as NativeModuleType | undefined;

if (!OmetriaSDK) {
  throw new Error(LINKING_ERROR);
}

// 2.9.x is the last release line that supports the Old Architecture
if (__DEV__ && !isNewArchitecture && !isRunningInJest) {
  console.warn(
    '[react-native-ometria] The Old Architecture is deprecated. 2.9.x is the last version that supports it; ' +
      'the next major version will require the New Architecture. Old Architecture apps can stay on 2.9.x.'
  );
}

const OmetriaReactNativeSdk: OmetriaReactNativeSdkType = {
  ...createNativeMethods(OmetriaSDK),
  ...createNotificationMethods(OmetriaSDK),
  ...deprecatedMethods,
};

export default OmetriaReactNativeSdk;

export {
  OmetriaBasket,
  OmetriaBasketItem,
  OmetriaNotification,
  OmetriaNotificationData,
  OmetriaOptions,
  OmetriaRemoteMessage,
};
