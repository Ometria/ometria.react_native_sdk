import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

export type OmetriaReactNativeSdkType = {
  /**
   * Initializes the Ometria SDK with the API token.
   *
   * @param token - Ometria API token
   * @param options - Additional options
   */
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
  trackBasketViewedEvent(): () => void;
  trackBasketUpdatedEvent(basket: OmetriaBasket): () => void;
  trackCheckoutStartedEvent(orderId?: string): () => void;
  trackOrderCompletedEvent(orderId: string, basket?: OmetriaBasket): () => void;
  trackDeepLinkOpenedEvent(link: string, screenName: string): () => void;
  trackHomeScreenViewedEvent(): () => void;
  trackScreenViewedEvent(screenName: string, additionalInfo?: any): () => void;
  trackCustomEvent(customEventType: string, additionalInfo?: any): () => void;

  flush(): () => void;
  clear(): () => void;
  isLoggingEnabled(enabled: Boolean): Promise<void>;
  processUniversalLink(url: string): Promise<string>;
  onNewToken(token: string): () => void;

  /**
   * Only for iOS
   * @param handler - Function that will be called when the notification is interacted with
   */
  onNotificationInteracted(
    handler: (response: OmetriaNotificationData) => void
  ): () => void;

  /**
   * Only for Android
   * @param handler - Function that will be called when a notification is received while the app is in the quit state
   */
  setBackgroundMessageHandler(
    handler: OmetriaNotificationHandlerInit
  ): Promise<void>;

  /**
   * Only for Android
   * @param handler - Function that will be called when a notification is interacted with
   */
  onNotificationOpenedApp(handler: OmetriaNotificationHandler): Promise<void>;

  /**
   * Only for Android
   * @param handler - Function that will be called when a notification is received
   */
  onNotificationReceived(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): () => void;

  /**
   * Only for Android
   * @param remoteMessage - Remote message received from the Firebase SDK
   * @returns Promise with the parsed notification data
   */
  parseNotification(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): Promise<OmetriaNotificationData>;

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
};

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
  notificationChannelName?: string; // only for Android
  appGroupIdentifier?: string; // only for iOS
};

export type OmetriaNotificationHandler = {
  remoteMessage: FirebaseMessagingTypes.RemoteMessage;
};

export interface OmetriaNotificationHandlerInit
  extends OmetriaNotificationHandler {
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
