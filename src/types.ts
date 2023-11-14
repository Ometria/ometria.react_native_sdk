export type OmetriaBasketItem = {
  productId: string;
  sku?: string;
  quantity: number;
  price: number;
  variantId?: string;
};

export type OmetriaOptions = {
  notificationChannelName?: string; // only for Android
};

export type OmetriaNotificationHandler = {
  remoteMessage: any;
};

export interface OmetriaNotificationHandlerInit
  extends OmetriaNotificationHandler {
  ometriaToken: string;
  ometriaOptions?: OmetriaOptions;
}
export type OmetriaBasket = {
  id?: string;
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

export type OmetriaReactNativeSdkType = {
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

  // iOS only
  onNotificationInteracted(
    handler: (response: OmetriaNotificationData) => void
  ): () => void;

  // Android only
  onPushTokenRefreshed(token: string): () => void;
  setBackgroundMessageHandler(
    handler: OmetriaNotificationHandlerInit
  ): Promise<void>;
  onNotificationOpenedApp(handler: OmetriaNotificationHandler): Promise<void>;
  onNotificationReceived(remoteMessage: any): () => void;
  parseNotification(remoteMessage: any): Promise<OmetriaNotificationData>;

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
   * Use the new method `parseNotificationData` instead.
   * See [TODO: add link to the docs] how to parse remoteMessage.
   * Will be removed in the next major version.
   */
  onDeepLinkInteracted(): Promise<string>;
  /**
   * @deprecated Deprecated since version 2.3.0.
   * Use the new method `onNotificationReceived` for Android instead.
   * Will be removed in the next major version.
   */
  onMessageReceived(remoteMessage: string): () => void;
};
