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
  item: [OmetriaBasketItem];
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
  trackScreenViewedEvent(screenName: string, additionalInfo: [string]): Promise<any>;
  trackCustomEvent(customEventType: string, additionalInfo: [string]): Promise<any>;
  flush(): Promise<any>;
  clear(): Promise<any>;
  isLoggingEnabled: Boolean;
};

const { OmetriaReactNativeSdk } = NativeModules;

export default OmetriaReactNativeSdk as OmetriaReactNativeSdkType;
