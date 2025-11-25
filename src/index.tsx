import { NativeModules, Platform } from 'react-native';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

import NativeOmetriaReactNativeSdk, {
  isTurboModuleEnabled,
  type Spec as NativeOmetriaReactNativeSdkSpec,
} from './NativeOmetriaReactNativeSdk';
import type {
  MaybeNull,
  OmetriaBasket,
  OmetriaBasketItem,
  OmetriaNotification,
  OmetriaNotificationData,
  OmetriaOnBackgroundMessagePayload,
  OmetriaOptions,
  OmetriaReactNativeSdkType,
} from './types';

type NativeRemoteMessage = FirebaseMessagingTypes.RemoteMessage;

type NativeModuleType = NativeOmetriaReactNativeSdkSpec & {
  onNotificationInteracted(remoteMessage: unknown): Promise<void>;
};

const LINKING_ERROR =
  `The package 'react-native-ometria' is not linked correctly.\n` +
  `• Make sure you have installed the package dependencies.\n` +
  `• For iOS, run 'pod install' in the example app directory.\n` +
  `• For Android, rebuild the app after installing.\n` +
  `• If you are integrating manually, verify you have added the package modules.`;

const nativeModule = (isTurboModuleEnabled
  ? NativeOmetriaReactNativeSdk
  : NativeModules.OmetriaReactNativeSdk) as NativeModuleType | undefined;

if (!nativeModule) {
  throw new Error(LINKING_ERROR);
}

const {
  initializeWithApiToken: nativeInitializeWithApiToken,
  trackProfileIdentifiedByCustomerIdEvent: nativeTrackProfileIdentifiedByCustomerIdEvent,
  trackProfileIdentifiedByEmailEvent: nativeTrackProfileIdentifiedByEmailEvent,
  trackProfileIdentifiedEvent: nativeTrackProfileIdentifiedEvent,
  updateStoreId: nativeUpdateStoreId,
  trackProfileDeidentifiedEvent: nativeTrackProfileDeidentifiedEvent,
  trackProductViewedEvent: nativeTrackProductViewedEvent,
  trackProductListingViewedEvent: nativeTrackProductListingViewedEvent,
  trackWishlistAddedToEvent: nativeTrackWishlistAddedToEvent,
  trackWishlistRemovedFromEvent: nativeTrackWishlistRemovedFromEvent,
  trackBasketViewedEvent: nativeTrackBasketViewedEvent,
  trackBasketUpdatedEvent: nativeTrackBasketUpdatedEvent,
  trackCheckoutStartedEvent: nativeTrackCheckoutStartedEvent,
  trackOrderCompletedEvent: nativeTrackOrderCompletedEvent,
  trackHomeScreenViewedEvent: nativeTrackHomeScreenViewedEvent,
  trackDeepLinkOpenedEvent: nativeTrackDeepLinkOpenedEvent,
  trackScreenViewedEvent: nativeTrackScreenViewedEvent,
  trackCustomEvent: nativeTrackCustomEvent,
  flush: nativeFlush,
  clear: nativeClear,
  isLoggingEnabled,
  processUniversalLink,
  onNewToken: nativeOnNewToken,
  onMessageReceived: nativeOnMessageReceived,
  onNotificationReceived: nativeOnNotificationReceived,
  parseNotification: nativeParseNotification,
  onNotificationInteracted: nativeOnNotificationInteracted,
  onDeepLinkInteracted,
} = nativeModule;

const coerceStoreId = (storeId: MaybeNull<string>) => storeId ?? null;

const withParsedOmetriaPayload = (
  remoteMessage: NativeRemoteMessage
): NativeRemoteMessage => ({
  ...remoteMessage,
  data: {
    ometria: JSON.parse(remoteMessage?.data?.ometria || '{}'),
  },
});


const trackProfileIdentifiedByCustomerIdEvent = (
  customerId: string,
  storeId: MaybeNull<string> = null
) => {
  void nativeTrackProfileIdentifiedByCustomerIdEvent(
    customerId,
    coerceStoreId(storeId)
  );
};

const trackProfileIdentifiedByEmailEvent = (
  email: string,
  storeId: MaybeNull<string> = null
) => {
  void nativeTrackProfileIdentifiedByEmailEvent(email, coerceStoreId(storeId));
};

const trackProfileIdentifiedEvent = (
  customerId: string,
  email: string,
  storeId: MaybeNull<string> = null
) => {
  void nativeTrackProfileIdentifiedEvent(customerId, email, coerceStoreId(storeId));
};

const trackOrderCompletedEvent = (
  orderId: string,
  basket: MaybeNull<OmetriaBasket> = null
) => {
  void nativeTrackOrderCompletedEvent(orderId, basket ?? null);
};

const trackScreenViewedEvent = (
  screenName: string,
  additionalInfo: MaybeNull<object> = null
) => {
  void nativeTrackScreenViewedEvent(screenName, additionalInfo ?? null);
};

const trackCustomEvent = (
  customEventType: string,
  additionalInfo: MaybeNull<object> = null
) => {
  void nativeTrackCustomEvent(customEventType, additionalInfo ?? null);
};

const initializeWithApiToken = (token: string, options?: OmetriaOptions) =>
  nativeInitializeWithApiToken(token, options ?? {});

const updateStoreId = (storeId: MaybeNull<string>) => {
  void nativeUpdateStoreId(coerceStoreId(storeId));
};

const trackProfileDeidentifiedEvent = () => {
  void nativeTrackProfileDeidentifiedEvent();
};

const trackProductViewedEvent = (productId: string) => {
  void nativeTrackProductViewedEvent(productId);
};

const trackProductListingViewedEvent = (
  listingType?: MaybeNull<string>,
  listingAttributes?: MaybeNull<object>
) => {
  void nativeTrackProductListingViewedEvent(listingType ?? null, listingAttributes ?? null);
};

const trackWishlistAddedToEvent = (productId: string) => {
  if (nativeTrackWishlistAddedToEvent) {
    void nativeTrackWishlistAddedToEvent(productId);
  }
};

const trackWishlistRemovedFromEvent = (productId: string) => {
  if (nativeTrackWishlistRemovedFromEvent) {
    void nativeTrackWishlistRemovedFromEvent(productId);
  }
};

const trackBasketViewedEvent = () => {
  void nativeTrackBasketViewedEvent();
};

const trackBasketUpdatedEvent = (basket: OmetriaBasket) => {
  void nativeTrackBasketUpdatedEvent(basket);
};

const trackCheckoutStartedEvent = (orderId: string) => {
  void nativeTrackCheckoutStartedEvent(orderId);
};

const trackHomeScreenViewedEvent = () => {
  void nativeTrackHomeScreenViewedEvent();
};

const trackDeepLinkOpenedEvent = (link: string, screenName: string) => {
  void nativeTrackDeepLinkOpenedEvent(link, screenName);
};

const flush = () => {
  void nativeFlush();
};

const clear = () => {
  void nativeClear();
};

const onNewToken = (token: string) => {
  void nativeOnNewToken(token);
};

const onMessageReceived = (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
  void nativeOnMessageReceived(remoteMessage as unknown as Record<string, unknown>);
};

const onNotificationReceived = (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
) => {
  const payload = Platform.OS === 'ios'
    ? withParsedOmetriaPayload(remoteMessage)
    : remoteMessage;
  void nativeOnNotificationReceived(payload as unknown as Record<string, unknown>);
};

const parseNotification = async (
  notification: FirebaseMessagingTypes.RemoteMessage
): Promise<OmetriaNotificationData | undefined> => {
  if (Platform.OS === 'android') {
    const parsed = (await nativeParseNotification(
      notification as unknown as Record<string, unknown>
    )) as OmetriaNotificationData | null;
    return parsed ?? undefined;
  }

  return notification?.data?.ometria
    ? (JSON.parse(notification.data.ometria) as OmetriaNotificationData)
    : undefined;
};

const onNotificationOpenedApp = async (
  notification: FirebaseMessagingTypes.RemoteMessage
) => {
  const payload = Platform.OS === 'ios'
    ? withParsedOmetriaPayload(notification)
    : notification;

  await nativeOnNotificationInteracted(payload as unknown as Record<string, unknown>);
  await nativeFlush();
};

const onAndroidBackgroundMessage = async (
  payload: OmetriaOnBackgroundMessagePayload
) => {
  if (Platform.OS !== 'android') {
    return;
  }

  await initializeWithApiToken(payload.ometriaToken, payload.ometriaOptions);
  onNotificationReceived(payload.remoteMessage);
};

const setBackgroundMessageHandler = async (
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

const OmetriaReactNativeSdk: OmetriaReactNativeSdkType = {
  initializeWithApiToken,
  trackProfileIdentifiedByCustomerIdEvent,
  trackProfileIdentifiedByEmailEvent,
  trackProfileIdentifiedEvent,
  updateStoreId,
  trackProfileDeidentifiedEvent,
  trackProductViewedEvent,
  trackProductListingViewedEvent,
  trackWishlistAddedToEvent,
  trackWishlistRemovedFromEvent,
  trackBasketViewedEvent,
  trackBasketUpdatedEvent,
  trackCheckoutStartedEvent,
  trackOrderCompletedEvent,
  trackHomeScreenViewedEvent,
  trackDeepLinkOpenedEvent,
  trackScreenViewedEvent,
  trackCustomEvent,
  flush,
  clear,
  isLoggingEnabled,
  processUniversalLink,
  onNewToken,
  onNotificationReceived,
  onMessageReceived,
  parseNotification,
  onNotificationOpenedApp,
  onAndroidBackgroundMessage,
  onNotificationInteracted: deprecatedOnNotificationInteracted,
  onDeepLinkInteracted,
  setBackgroundMessageHandler,
};

export default OmetriaReactNativeSdk;

export {
  OmetriaBasket,
  OmetriaBasketItem,
  OmetriaNotification,
  OmetriaNotificationData,
  OmetriaOptions,
};
