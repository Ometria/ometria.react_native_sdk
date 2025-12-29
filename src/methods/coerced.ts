import type {
  MaybeNull,
  NativeModuleType,
  OmetriaBasket,
  OmetriaOptions,
} from '../types';
import { coerce } from '../utils';

export const createCoercedMethods = (OmetriaSDK: NativeModuleType) => {
  const trackProfileIdentifiedByCustomerIdEvent = (
    customerId: string,
    storeId: MaybeNull<string> = null
  ) => {
    OmetriaSDK.trackProfileIdentifiedByCustomerIdEvent(
      customerId,
      coerce(storeId)
    );
  };

  const trackProfileIdentifiedByEmailEvent = (
    email: string,
    storeId: MaybeNull<string> = null
  ) => {
    OmetriaSDK.trackProfileIdentifiedByEmailEvent(email, coerce(storeId));
  };

  const trackProfileIdentifiedEvent = (
    customerId: string,
    email: string,
    storeId: MaybeNull<string> = null
  ) => {
    OmetriaSDK.trackProfileIdentifiedEvent(customerId, email, coerce(storeId));
  };

  const trackOrderCompletedEvent = (
    orderId: string,
    basket: MaybeNull<OmetriaBasket> = null
  ) => {
    OmetriaSDK.trackOrderCompletedEvent(orderId, coerce(basket));
  };

  const trackScreenViewedEvent = (
    screenName: string,
    additionalInfo: MaybeNull<object> = null
  ) => {
    OmetriaSDK.trackScreenViewedEvent(screenName, coerce(additionalInfo));
  };

  const trackCustomEvent = (
    customEventType: string,
    additionalInfo: MaybeNull<object> = null
  ) => {
    OmetriaSDK.trackCustomEvent(customEventType, coerce(additionalInfo));
  };

  const initializeWithApiToken = (token: string, options?: OmetriaOptions) =>
    OmetriaSDK.initializeWithApiToken(token, options ?? {});

  const updateStoreId = (storeId: MaybeNull<string>) => {
    OmetriaSDK.updateStoreId(coerce(storeId));
  };

  const trackProductListingViewedEvent = (
    listingType?: MaybeNull<string>,
    listingAttributes?: MaybeNull<object>
  ) => {
    OmetriaSDK.trackProductListingViewedEvent(
      coerce(listingType),
      coerce(listingAttributes)
    );
  };

  return {
    initializeWithApiToken,
    trackProfileIdentifiedByCustomerIdEvent,
    trackProfileIdentifiedByEmailEvent,
    trackProfileIdentifiedEvent,
    updateStoreId,
    trackProductListingViewedEvent,
    trackOrderCompletedEvent,
    trackScreenViewedEvent,
    trackCustomEvent,
  };
};
