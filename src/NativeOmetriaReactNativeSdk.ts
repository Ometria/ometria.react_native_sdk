import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';
import type {UnsafeObject} from 'react-native/Libraries/Types/CodegenTypes';

declare const global: { __turboModuleProxy?: object };

export type NullableString = string | null | undefined;

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
  notificationChannelName?: string;
  appGroupIdentifier?: string;
};

export type OmetriaNotificationData = {
  campaignType?: string;
  deepLinkActionUrl?: string;
  externalCustomerId?: string;
  imageUrl?: string;
  sendId?: string;
  tracking?: UnsafeObject;
};

export interface Spec extends TurboModule {
  initializeWithApiToken(token: string, options?: OmetriaOptions | null): Promise<void>;
  updateStoreId(storeId?: NullableString): Promise<void>;
  trackProfileIdentifiedByCustomerIdEvent(
    customerId: string,
    storeId?: NullableString
  ): Promise<void>;
  trackProfileIdentifiedByEmailEvent(email: string, storeId?: NullableString): Promise<void>;
  trackProfileIdentifiedEvent(
    customerId: string,
    email: string,
    storeId?: NullableString
  ): Promise<void>;
  trackProfileDeidentifiedEvent(): Promise<void>;
  trackProductViewedEvent(productId: string): Promise<void>;
  trackProductListingViewedEvent(
    listingType?: NullableString,
    listingAttributes?: UnsafeObject | null
  ): Promise<void>;
  trackWishlistAddedToEvent(productId: string): Promise<void>;
  trackWishlistRemovedFromEvent(productId: string): Promise<void>;
  trackBasketViewedEvent(): Promise<void>;
  trackBasketUpdatedEvent(basket: OmetriaBasket): Promise<void>;
  trackCheckoutStartedEvent(orderId: string): Promise<void>;
  trackOrderCompletedEvent(orderId: string, basket?: OmetriaBasket | null): Promise<void>;
  trackHomeScreenViewedEvent(): Promise<void>;
  trackDeepLinkOpenedEvent(link: string, screenName: string): Promise<void>;
  trackScreenViewedEvent(
    screenName: string,
    additionalInfo?: UnsafeObject | null
  ): Promise<void>;
  trackCustomEvent(customEventType: string, additionalInfo?: UnsafeObject | null): Promise<void>;
  flush(): Promise<void>;
  clear(): Promise<void>;
  isLoggingEnabled(enabled: boolean): Promise<void>;
  processUniversalLink(url: string): Promise<string>;
  onNewToken(token: string): Promise<void>;
  onMessageReceived(remoteMessage: UnsafeObject): Promise<void>;
  onNotificationReceived(remoteMessage: UnsafeObject): Promise<void>;
  parseNotification(remoteMessage: UnsafeObject): Promise<UnsafeObject | null>;
  onNotificationInteracted(remoteMessage: UnsafeObject): Promise<void>;
  onDeepLinkInteracted(): Promise<string>;
}

export const isTurboModuleEnabled = global.__turboModuleProxy != null;

const moduleProxy = isTurboModuleEnabled
  ? TurboModuleRegistry.getEnforcing<Spec>('OmetriaReactNativeSdk')
  : null;

export default moduleProxy;
