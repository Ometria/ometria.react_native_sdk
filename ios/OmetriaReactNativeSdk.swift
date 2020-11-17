import Ometria

@objc(OmetriaReactNativeSdk)
class OmetriaReactNativeSdk: NSObject {
    @objc(initializeWithApiToken:withResolver:withRejecter:)
    func initialize(apiToken: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let ometriaInit = Ometria.initialize(apiToken: apiToken)
        resolve(ometriaInit)
    }

    @objc(trackProfileIdentifiedEventByCustomerID:withResolver:withRejecter:)
    func trackProfileIdentifiedEventByCustomerID(customerId: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve()
    }
    @objc(trackProfileIdentifiedEventByEmail:withResolver:withRejecter:)
    func trackProfileIdentifiedEventByEmail(email: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve()
    }
    @objc(trackProductViewedEvent:withResolver:withRejecter:)
    func trackProductViewedEvent(productId: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve()
    }
    @objc(trackProductCategoryViewedEvent:withResolver:withRejecter:)
    func trackProductCategoryViewedEvent(category: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve()
    }
    @objc(trackWishlistAddedToEvent:withResolver:withRejecter:)
    func trackWishlistAddedToEvent(productId: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve()
    }
    @objc(trackWishlistRemovedFromEvent:withResolver:withRejecter:)
    func trackWishlistRemovedFromEvent(productId: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve()
    }
    @objc(trackBasketViewedEvent:withResolver:withRejecter:)
    func trackBasketViewedEvent(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve()
    }
    @objc(trackBasketUpdatedEvent:withResolver:withRejecter:)
    func trackBasketUpdatedEvent(basket: OmetriaBasket, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve()
    }
    @objc(trackOrderCompletedEvent:withResolver:withRejecter:)
    func trackOrderCompletedEvent(orderId: String, basket: OmetriaBasket, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve()
    }
    @objc(trackDeepLinkOpenedEvent:withResolver:withRejecter:)
    func trackDeepLinkOpenedEvent(link: String, screenName: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve()
    }
    @objc(trackScreenViewedEvent:withResolver:withRejecter:)
    func trackScreenViewedEvent(screenName: String, additionalInfo: [String: Any], resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve()
    }
    @objc(trackCustomEvent:withResolver:withRejecter:)
    func trackCustomEvent(customEventType: String, additionalInfo: [String: Any], resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve()
    }

}
