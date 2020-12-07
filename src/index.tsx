import { NativeModules } from 'react-native';

type OmetriaBasketItem = {
  productId: string;
  sku: string;
  quantity: number;
  price: number;
}

type OmetriaBasket = {
  currency: string;
  totalPrice: number;
  items: [OmetriaBasketItem];
}

type OmetriaReactNativeSdkType = {
  initializeWithApiToken(token: string): Promise<any>;
  trackProfileIdentifiedEventByCustomerID(customerId: string): Promise<any>;
  trackProfileIdentifiedEventByEmail(email: string): Promise<any>;
  trackProductViewedEvent(productId: string): Promise<any>;
  trackProductCategoryViewedEvent(category: string): Promise<any>;
  trackWishlistAddedToEvent(productId: string): Promise<any>;
  trackWishlistRemovedFromEvent(productId: string): Promise<any>;
  trackBasketViewedEvent(): Promise<any>;
  trackBasketUpdatedEvent(basket: OmetriaBasket): Promise<any>;
  trackOrderCompletedEvent(orderId: string, basket: OmetriaBasket): Promise<any>;
  trackDeepLinkOpenedEvent(link: string, screenName: string): Promise<any>;
  trackScreenViewedEvent(screenName: string, additionalInfo?: any): Promise<any>;
  trackCustomEvent(customEventType: string, additionalInfo?: any): Promise<any>;
  basket(totalPrice: number, currency: string): Promise<any>;
  basketItem(productId: string, sku: string, quantity: number, price: number): () => void;
  flush(): Promise<any>;
  clear(): Promise<any>;
  isLoggingEnabled(enabled: Boolean): Promise<any>;
};

export const { OmetriaReactNativeSdk, OmetriaReactNativeBasket } = NativeModules;

export default OmetriaReactNativeSdk as OmetriaReactNativeSdkType;
