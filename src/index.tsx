import { NativeModules } from 'react-native';

import { LINKING_ERROR } from './utils';
import NativeOmetriaReactNativeSdk, {
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
} from './types';

const OmetriaSDK = (
  isTurboModuleEnabled
    ? NativeOmetriaReactNativeSdk
    : NativeModules.OmetriaReactNativeSdk
) as NativeModuleType | undefined;

if (!OmetriaSDK) {
  throw new Error(LINKING_ERROR);
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
};
