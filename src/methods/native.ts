import type {
  MaybeNull,
  NativeModuleType,
  OmetriaBasket,
  OmetriaOptions,
} from '../types';
import { coerce } from '../utils';

/**
 * All wrappers around native SDK methods.
 *
 * Rules:
 *  - Never spread the TurboModule. JSI host objects are not enumerable, so
 *    spreading produces undefined for every method in new architecture.
 *    Always call sdk.method() directly.
 *  - Use `void` to ignore the returned Promise when the public API is void.
 *  - Every optional argument must be wrapped with coerce() (value ?? null)
 *    so the native side never receives undefined.
 *    Exception: initializeWithApiToken options falls back to {} (not null)
 *    because the native implementation expects an object, not null.
 *
 * Adding a new method: add it here and add its signature to OmetriaReactNativeSdkType in types.ts.
 */
export const createNativeMethods = (OmetriaSDK: NativeModuleType) => ({
  initializeWithApiToken: (token: string, options?: OmetriaOptions) =>
    OmetriaSDK.initializeWithApiToken(token, options ?? {}),

  trackProfileIdentifiedByCustomerIdEvent: (
    customerId: string,
    storeId: MaybeNull<string> = null
  ) => {
    void OmetriaSDK.trackProfileIdentifiedByCustomerIdEvent(
      customerId,
      coerce(storeId)
    );
  },

  trackProfileIdentifiedByEmailEvent: (
    email: string,
    storeId: MaybeNull<string> = null
  ) => {
    void OmetriaSDK.trackProfileIdentifiedByEmailEvent(email, coerce(storeId));
  },

  trackProfileIdentifiedEvent: (
    customerId: string,
    email: string,
    storeId: MaybeNull<string> = null
  ) => {
    void OmetriaSDK.trackProfileIdentifiedEvent(
      customerId,
      email,
      coerce(storeId)
    );
  },

  trackProfileDeidentifiedEvent: () => {
    void OmetriaSDK.trackProfileDeidentifiedEvent();
  },

  updateStoreId: (storeId: MaybeNull<string>) => {
    void OmetriaSDK.updateStoreId(coerce(storeId));
  },

  trackProductViewedEvent: (productId: string) => {
    void OmetriaSDK.trackProductViewedEvent(productId);
  },

  trackProductListingViewedEvent: (
    listingType?: MaybeNull<string>,
    listingAttributes?: MaybeNull<object>
  ) => {
    void OmetriaSDK.trackProductListingViewedEvent(
      coerce(listingType),
      coerce(listingAttributes)
    );
  },

  trackBasketViewedEvent: () => {
    void OmetriaSDK.trackBasketViewedEvent();
  },

  trackBasketUpdatedEvent: (basket: OmetriaBasket) => {
    void OmetriaSDK.trackBasketUpdatedEvent(basket);
  },

  trackCheckoutStartedEvent: (orderId: string) => {
    void OmetriaSDK.trackCheckoutStartedEvent(orderId);
  },

  trackOrderCompletedEvent: (
    orderId: string,
    basket: MaybeNull<OmetriaBasket> = null
  ) => {
    void OmetriaSDK.trackOrderCompletedEvent(orderId, coerce(basket));
  },

  trackHomeScreenViewedEvent: () => {
    void OmetriaSDK.trackHomeScreenViewedEvent();
  },

  trackDeepLinkOpenedEvent: (link: string, screenName: string) => {
    void OmetriaSDK.trackDeepLinkOpenedEvent(link, screenName);
  },

  trackScreenViewedEvent: (
    screenName: string,
    additionalInfo: MaybeNull<object> = null
  ) => {
    void OmetriaSDK.trackScreenViewedEvent(screenName, coerce(additionalInfo));
  },

  trackCustomEvent: (
    customEventType: string,
    additionalInfo: MaybeNull<object> = null
  ) => {
    void OmetriaSDK.trackCustomEvent(customEventType, coerce(additionalInfo));
  },

  flush: () => {
    void OmetriaSDK.flush();
  },

  clear: () => {
    void OmetriaSDK.clear();
  },

  isLoggingEnabled: (enabled: boolean) => OmetriaSDK.isLoggingEnabled(enabled),

  processUniversalLink: (url: string) => OmetriaSDK.processUniversalLink(url),

  onNewToken: (token: string) => {
    void OmetriaSDK.onNewToken(token);
  },
});
