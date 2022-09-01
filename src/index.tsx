import {
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';

export type OmetriaBasketItem = {
  productId: string;
  sku: string;
  quantity: number;
  price: number;
};

type OmetriaOptions = {
  notificationChannelName?: string; // only for Android
};

export type OmetriaBasket = {
  currency: string;
  totalPrice: number;
  items: OmetriaBasketItem[];
  link: string;
};

export type OmetriaNotificationData = {
  campaignType?: string;
  deepLinkActionUrl?: string;
  externalCustomerId?: string;
  imageUrl?: string;
  sendId?: string;
  tracking: {
    utm_medium?: string;
    utm_source: string;
    utm_campaign: string;
    om_campagin: string;
    [key: string]: string | undefined;
  };
};

type OmetriaReactNativeSdkType = {
  // iOS & Android
  initializeWithApiToken(
    token: string,
    options?: OmetriaOptions
  ): Promise<void>;
  trackProfileIdentifiedByCustomerIdEvent(customerId: string): () => void;
  trackProfileIdentifiedByEmailEvent(email: string): () => void;
  trackProfileDeidentifiedEvent(): () => void;
  trackProductViewedEvent(productId: string): () => void;
  trackProductListingViewedEvent(
    listingType: string,
    listingAttributes: any
  ): () => void;
  /**
   * @deprecated Deprecated since version 2.1.1.
   *
   * The event is no longer sent to the Ometria backend.
   *
   * Will be removed in the next major version.
   *
   */
  trackWishlistAddedToEvent(productId: string): () => void;
  /**
   * @deprecated Deprecated since version 2.1.1.
   *
   * The event is no longer sent to the Ometria backend.
   *
   * Will be removed in the next major version.
   *
   */
  trackWishlistRemovedFromEvent(productId: string): () => void;
  trackBasketViewedEvent(): () => void;
  trackBasketUpdatedEvent(basket: OmetriaBasket): () => void;
  trackCheckoutStartedEvent(orderId?: String): () => void;
  trackOrderCompletedEvent(orderId: String, basket?: OmetriaBasket): () => void;
  trackDeepLinkOpenedEvent(link: string, screenName: string): () => void;
  trackHomeScreenViewedEvent(): () => void;
  trackScreenViewedEvent(screenName: string, additionalInfo?: any): () => void;
  trackCustomEvent(customEventType: string, additionalInfo?: any): () => void;
  flush(): () => void;
  clear(): () => void;
  isLoggingEnabled(enabled: Boolean): Promise<void>;

  onDeepLinkInteracted(): Promise<string>;
  onNotificationInteracted(
    handler: (response: OmetriaNotificationData) => void
  ): () => void;

  processUniversalLink(url: string): Promise<string>;
  onNewToken(token: String): () => void;

  // Android only
  onMessageReceived(remoteMessage: String): () => void;
  onPushTokenRefreshed(token: String): () => void;
};

/**
 *  ReactNative custom implementation for
 * `.onNotificationInteracted()` EventListener
 */
const { OmetriaReactNativeSdk } = NativeModules;
const OmetriaEventEmitter = Platform.select({
  ios: new NativeEventEmitter(OmetriaReactNativeSdk),
  android: DeviceEventEmitter,
});

OmetriaReactNativeSdk.onNotificationInteracted = (
  handler: (response: OmetriaNotificationData) => void
) => {
  OmetriaEventEmitter &&
    OmetriaEventEmitter.addListener(
      'onNotificationInteracted',
      (response: OmetriaNotificationData) => {
        handler(response);
      }
    );
};

/**
 *  ReactNative custom implementation for
 * `.initializeWithApiToken` method
 */
const _initializeWithApi = OmetriaReactNativeSdk.initializeWithApiToken;

OmetriaReactNativeSdk.initializeWithApiToken = (
  token: string,
  options?: OmetriaOptions
) =>
  Platform.OS === 'android'
    ? _initializeWithApi(token, options ?? {})
    : _initializeWithApi(token);

export default OmetriaReactNativeSdk as OmetriaReactNativeSdkType;
