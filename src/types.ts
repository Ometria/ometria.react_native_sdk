import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

type OmetriaReactNativeSdkCoreType = {
  /**
   * Initializes the Ometria SDK with the API token.
   *
   * @param token - Ometria API token
   * @param options - Additional options
   */
  initializeWithApiToken: (
    token: string,
    options?: OmetriaOptions
  ) => Promise<void>;

  trackProfileIdentifiedByCustomerIdEvent: (
    customerId: string,
    storeId?: string | null
  ) => void;

  trackProfileIdentifiedByEmailEvent: (
    email: string,
    storeId?: string | null
  ) => void;

  updateStoreId: (storeId: string | null) => void;

  trackProfileDeidentifiedEvent: () => void;

  trackProductViewedEvent: (productId: string) => void;

  trackProductListingViewedEvent: (
    listingType: string,
    listingAttributes: object
  ) => void;

  trackBasketViewedEvent: () => void;

  trackBasketUpdatedEvent: (basket: OmetriaBasket) => void;

  trackCheckoutStartedEvent: (orderId: string) => void;

  trackOrderCompletedEvent: (
    orderId: string,
    basket?: OmetriaBasket | null
  ) => void;

  trackDeepLinkOpenedEvent: (link: string, screenName: string) => void;

  trackHomeScreenViewedEvent: () => void;

  trackScreenViewedEvent: (
    screenName: string,
    additionalInfo?: object | null
  ) => void;

  trackCustomEvent: (
    customEventType: string,
    additionalInfo?: object | null
  ) => void;

  flush: () => void;

  clear: () => void;

  isLoggingEnabled: (enabled: Boolean) => Promise<void>;

  processUniversalLink: (url: string) => Promise<string>;

  onNewToken: (token: string) => void;

  /**
   * Function to call when the app is opened from a notification (quit or background state)
   * @param notification - {remoteMessage: RemoteMessage}
   */
  onNotificationOpenedApp: (
    notification: FirebaseMessagingTypes.RemoteMessage
  ) => void;

  /**
   * Only for Android
   * Function to call when a notification is received in the background state
   * @param payload - {remoteMessage: RemoteMessage, ometriaToken: string, ometriaOptions?: OmetriaOptions}
   */
  onAndroidBackgroundMessage: (
    payload: OmetriaOnBackgroundMessagePayload
  ) => Promise<void>;

  /**
   * Function to call when a notification is received in the foreground state
   * @param handler - Function that will be called when a notification is received
   */
  onNotificationReceived: (
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ) => void;

  /**
   * Function to parse the notification from the Firebase SDK
   * @param remoteMessage - Remote message received from the Firebase SDK
   * @returns Promise with the parsed notification data
   */
  parseNotification: (
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ) => Promise<OmetriaNotificationData | undefined>;
};

type OmetriaReactNativeSdkDeprecatedType = {
  /**
   * @deprecated Deprecated since version 2.2.0.
   * The event is no longer sent to the Ometria backend.
   * Will be removed in the next major version.
   */
  trackWishlistAddedToEvent(productId: string): () => void;

  /**
   * @deprecated Deprecated since version 2.2.0.
   * The event is no longer sent to the Ometria backend.
   * Will be removed in the next major version.
   */
  trackWishlistRemovedFromEvent(productId: string): () => void;

  /**
   * @deprecated Deprecated since version 2.3.0.
   * The SDK no longer handles notification interactions.
   * Use your own implementation to listen for notification interactions.
   * Use the new method `parseNotificationData` for Android to parse the notification data.
   * Will be removed in the next major version.
   */
  onDeepLinkInteracted(): Promise<string>;

  /**
   * @deprecated Deprecated since version 2.3.0.
   * Use your own implementation to listen for new notifications.
   * Call the new method `onNotificationReceived` for Android to let the SDK know that the notification was received.
   * Will be removed in the next major version.
   */
  onMessageReceived(remoteMessage: string): () => void;

  /**
   * Only for iOS
   * @deprecated Deprecated since version 2.4.0. use the new method `onNotificationOpenedApp` to handle notifications that oppened the app.
   * @param handler - Function that will be called when the notification is interacted with
   */
  onNotificationInteracted(
    handler: (response: OmetriaNotificationData) => void
  ): () => void;

  /**
   * Only for Android
   * @deprecated since version 2.4.0. Use the new method `onAndroidBackgroundMessage` to handle background messages.
   */
  setBackgroundMessageHandler(
    handler: OmetriaOnBackgroundMessagePayload
  ): Promise<void>;
};

export type OmetriaReactNativeSdkType = OmetriaReactNativeSdkCoreType &
  OmetriaReactNativeSdkDeprecatedType;

export type OmetriaBasketItem = {
  productId: string;
  sku?: string;
  quantity: number;
  price: number;
  variantId?: string;
};

export type OmetriaBasket = {
  id?: string;
  currency: string;
  totalPrice: number;
  items: OmetriaBasketItem[];
  link: string;
};

export type OmetriaOptions = {
  /**
   * Only for Android
   */
  notificationChannelName?: string;
  /**
   * Only for iOS
   */
  appGroupIdentifier?: string;
};

export type OmetriaNotification = {
  remoteMessage: FirebaseMessagingTypes.RemoteMessage;
};

export interface OmetriaOnBackgroundMessagePayload extends OmetriaNotification {
  ometriaToken: string;
  ometriaOptions?: OmetriaOptions;
}

export type OmetriaNotificationData = {
  campaignType?: 'trigger';
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
