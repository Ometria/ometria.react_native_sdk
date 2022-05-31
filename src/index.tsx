import { NativeEventEmitter, NativeModules } from 'react-native';

export type OmetriaBasketItem = {
  productId: string;
  sku: string;
  quantity: number;
  price: number;
};

export type OmetriaBasket = {
  currency: string;
  totalPrice: number;
  items: OmetriaBasketItem[];
  link: string;
};

export type OmetriaNotificationData = {
  campaignType: string;
  deepLinkActionUrl: string;
  externalCustomerId: string;
  imageUrl: string;
  sendId: string;
  tracking: any;
};

type OmetriaReactNativeSdkType = {
  // iOS & Android
  initializeWithApiToken(token: string): Promise<void>;
  trackProfileIdentifiedByCustomerIdEvent(customerId: string): () => void;
  trackProfileIdentifiedByEmailEvent(email: string): () => void;
  trackProfileDeidentifiedEvent(): () => void;
  trackProductViewedEvent(productId: string): () => void;
  trackProductListingViewedEvent(
    listingType: string,
    listingAttributes: any
  ): () => void;
  trackWishlistAddedToEvent(productId: string): () => void;
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

  // Android only
  onMessageReceived(remoteMessage: String): () => void;
  onNewToken(token: String): () => void;
  onPushTokenRefreshed(token: String): () => void;
};

const { OmetriaReactNativeSdk } = NativeModules;
const OmetriaEvent = new NativeEventEmitter(OmetriaReactNativeSdk);

OmetriaReactNativeSdk.onNotificationInteracted = (
  handler: (response: OmetriaNotificationData) => void
) => {
  // Needs updates on Android native
  // Only works on iOS at the moment
  OmetriaEvent.addListener(
    'onNotificationInteracted',
    (response: OmetriaNotificationData) => {
      handler(response);
    }
  );
};

export default OmetriaReactNativeSdk as OmetriaReactNativeSdkType;
