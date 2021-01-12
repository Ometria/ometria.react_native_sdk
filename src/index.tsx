import { NativeModules } from 'react-native';

type OmetriaReactNativeSdkType = {
  initializeWithApiToken(token: string): () => void;
  trackProfileIdentifiedByCustomerIdEvent(customerId: string): () => void;
  trackProfileIdentifiedByEmailEvent(email: string): () => void;
  trackProfileDeidentifiedEvent(): () => void;
  trackProductViewedEvent(productId: string): () => void;
  trackProductListingViewedEvent(): () => void;
  trackWishlistAddedToEvent(productId: string): () => void;
  trackWishlistRemovedFromEvent(productId: string): () => void;
  trackBasketViewedEvent(): () => void;
  trackBasketUpdatedEvent(
    totalPrice: number,
    currency: String,
    items: {}
  ): () => void;
  trackOrderCompletedEvent(
    orderId: String,
    totalPrice: number,
    currency: String
  ): () => void;
  trackDeepLinkOpenedEvent(link: string, screenName: string): () => void;
  trackScreenViewedEvent(screenName: string, additionalInfo?: any): () => void;
  trackCustomEvent(customEventType: string, additionalInfo?: any): () => void;
  addBasketItem(
    productId: string,
    sku: string,
    quantity: number,
    price: number
  ): () => void;
  flush(): () => void;
  clear(): () => void;
  isLoggingEnabled(enabled: Boolean): () => void;
  onMessageReceived(remoteMessage: String): () => void;
  onNewToken(token: String): () => void;
};

export const {
  OmetriaReactNativeSdk,
  OmetriaReactNativeBasket,
} = NativeModules;

export default OmetriaReactNativeSdk as OmetriaReactNativeSdkType;
