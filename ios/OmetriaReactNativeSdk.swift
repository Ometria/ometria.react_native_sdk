import Ometria
import Foundation

@objc(OmetriaReactNativeSdk)
class OmetriaReactNativeSdk: NSObject {
    //    private val basketItems = mutableListOf<OmetriaBasketItem>()
    
    @objc(initializeWithApiToken:withResolver:withRejecter:)
    func initialize(apiToken: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let ometriaInit = Ometria.initialize(apiToken: apiToken)
        resolve(ometriaInit)
    }
    
    @objc(trackProfileIdentifiedByCustomerIdEvent:withResolver:withRejecter:)
    func trackProfileIdentifiedByCustomerIdEvent(customerId: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackProfileIdentifiedEvent(customerId: customerId)
        resolve(nil)
    }
    
    @objc(trackProfileIdentifiedByEmailEvent:withResolver:withRejecter:)
    func trackProfileIdentifiedByEmailEvent(email: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackProfileIdentifiedEvent(email: email)
        resolve(nil)
    }
    
    @objc(trackProfileDeidentifiedEvent:withRejecter:)
    func trackProfileDeidentifiedEvent(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackProfileDeidentifiedEvent()
        resolve(nil)
    }
    
    
    @objc(trackProductViewedEvent:withResolver:withRejecter:)
    func trackProductViewedEvent(productId: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackProductViewedEvent(productId: productId)
        resolve(nil)
    }
    
    @objc(trackProductCategoryViewedEvent:withResolver:withRejecter:)
    func trackProductCategoryViewedEvent(category: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackProductViewedEvent(productId: category)
        resolve(nil)
    }
    
    @objc(trackWishlistAddedToEvent:withResolver:withRejecter:)
    func trackWishlistAddedToEvent(productId: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackWishlistAddedToEvent(productId: productId)
        resolve(nil)
    }
    
    @objc(trackWishlistRemovedFromEvent:withResolver:withRejecter:)
    func trackWishlistRemovedFromEvent(productId: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackWishlistRemovedFromEvent(productId: productId)
        resolve(nil)
    }
    
    @objc(trackBasketViewedEvent:withRejecter:)
    func trackBasketViewedEvent(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackBasketViewedEvent()
        resolve(nil)
    }
    
    //    @ReactMethod
    //    fun trackBasketUpdatedEvent(totalPrice: Float, currency: String) {
    //      Ometria.instance().trackBasketUpdatedEvent(OmetriaBasket(totalPrice, currency, basketItems))
    //      basketItems.clear()
    //    }
    //
    //    @ReactMethod
    //    fun addBasketItem(productId: String, sku: String, quantity: Int, price: Float) {
    //      basketItems.add(OmetriaBasketItem(productId, sku, quantity, price))
    //    }
    //
    //    @ReactMethod
    //    fun trackOrderCompletedEvent(orderId: String, totalPrice: Float, currency: String) {
    //      Ometria.instance().trackOrderCompletedEvent(orderId, OmetriaBasket(totalPrice, currency, basketItems))
    //      basketItems.clear()
    //    }
    
    
    @objc(trackBasketUpdatedEvent:currency:items:resolver:rejecter:)
    func trackBasketUpdatedEvent(totalPrice: Float, currency: NSString, items: NSArray, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        var itemObjects: [OmetriaBasketItem] = []
        let decoder = JSONDecoder()
        do {
            for itemDictionary in items {
                let data = try JSONSerialization.data(withJSONObject: itemDictionary, options: .fragmentsAllowed)
                let item = try decoder.decode(OmetriaBasketItem.self, from: data)
                itemObjects.append(item)
            }
        } catch {
            reject("0", "Invalid items structure", error)
        }
        
        let basket = OmetriaBasket(totalPrice: totalPrice, currency: currency as String, items: itemObjects)
        Ometria.sharedInstance().trackBasketUpdatedEvent(basket: basket)
        resolve(nil)
    }
    
    //    @objc(trackOrderCompletedEvent:withResolver:withRejecter:)
    //    func trackOrderCompletedEvent(orderId: String, basket: OmetriaBasket, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    //        resolve(nil)
    //    }
    
    @objc(trackDeepLinkOpenedEvent:screenName:withResolver:withRejecter:)
    func trackDeepLinkOpenedEvent(link: String, screenName: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackDeepLinkOpenedEvent(link: link, screenName: screenName)
        resolve(nil)
    }
    
    @objc(trackScreenViewedEvent:additionalInfo:withResolver:withRejecter:)
    func trackScreenViewedEvent(screenName: String, additionalInfo: [String: Any], resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackScreenViewedEvent(screenName: screenName, additionalInfo: additionalInfo)
        resolve(nil)
    }
    
    @objc(trackCustomEvent:additionalInfo:withResolver:withRejecter:)
    func trackCustomEvent(customEventType: String, additionalInfo: [String: Any], resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackCustomEvent(customEventType: customEventType, additionalInfo: additionalInfo)
        resolve(nil)
    }
    
    @objc(flush:withRejecter:)
    func flush(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().flush()
        resolve(nil)
    }
    
    @objc(clear:withRejecter:)
    func clear(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().clear()
        resolve(nil)
    }
    
    @objc(isLoggingEnabled:withResolver:withRejecter:)
    func isLoggingEnabled(enabled: Bool, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().isLoggingEnabled = enabled
        resolve(nil)
    }
    
    @objc(onNewToken:withResolver:withRejecter:)
    func onNewToken(pushToken: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        //        Ometria.sharedInstance() = pushToken
        resolve(nil)
    }
}
