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
  trackWishlistRemovedFromEvent(): Promise<any>;
  trackBasketViewedEvent(): Promise<any>;
  trackBasketUpdatedEvent(basket: OmetriaBasket): Promise<any>;
  trackOrderCompletedEvent(orderId: string, basket: OmetriaBasket): Promise<any>;
  trackDeepLinkOpenedEvent(link: string, screenName: string): Promise<any>;
  trackScreenViewedEvent(screenName: string, additionalInfo: {}): Promise<any>;
  trackCustomEvent(customEventType: string, additionalInfo: {}): Promise<any>;
  basket(currency: string, totalPrice: number, items: [OmetriaBasketItem]): Promise<any>;
  basketItem(productId: string, sku: string, quantity: number, price: number): Promise<any>;
  flush(): Promise<any>;
  clear(): Promise<any>;
  isLoggingEnabled(enabled: Boolean): Promise<any>;
};

const { OmetriaReactNativeSdk } = NativeModules;

export default OmetriaReactNativeSdk as OmetriaReactNativeSdkType;
