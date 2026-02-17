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
    void OmetriaSDK.trackProfileIdentifiedByCustomerIdEvent(
      customerId,
      coerce(storeId)
    );
  };

  const trackProfileIdentifiedByEmailEvent = (
    email: string,
    storeId: MaybeNull<string> = null
  ) => {
    void OmetriaSDK.trackProfileIdentifiedByEmailEvent(email, coerce(storeId));
  };

  const trackProfileIdentifiedEvent = (
    customerId: string,
    email: string,
    storeId: MaybeNull<string> = null
  ) => {
    void OmetriaSDK.trackProfileIdentifiedEvent(customerId, email, coerce(storeId));
  };

  const trackOrderCompletedEvent = (
    orderId: string,
    basket: MaybeNull<OmetriaBasket> = null
  ) => {
    void OmetriaSDK.trackOrderCompletedEvent(orderId, coerce(basket));
  };

  const trackScreenViewedEvent = (
    screenName: string,
    additionalInfo: MaybeNull<object> = null
  ) => {
    void OmetriaSDK.trackScreenViewedEvent(screenName, coerce(additionalInfo));
  };

  const trackCustomEvent = (
    customEventType: string,
    additionalInfo: MaybeNull<object> = null
  ) => {
    void OmetriaSDK.trackCustomEvent(customEventType, coerce(additionalInfo));
  };

  const initializeWithApiToken = (token: string, options?: OmetriaOptions) =>
    OmetriaSDK.initializeWithApiToken(token, options ?? {});

  const updateStoreId = (storeId: MaybeNull<string>) => {
    void OmetriaSDK.updateStoreId(coerce(storeId));
  };

  const trackProductListingViewedEvent = (
    listingType?: MaybeNull<string>,
    listingAttributes?: MaybeNull<object>
  ) => {
    void OmetriaSDK.trackProductListingViewedEvent(
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
