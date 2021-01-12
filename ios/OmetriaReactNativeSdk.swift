import Ometria
import Foundation

@objc(OmetriaReactNativeSdk)
class OmetriaReactNativeSdk: NSObject {
    
    @objc(initializeWithApiToken:resolver:rejecter:)
    func initialize(apiToken: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let ometriaInit = Ometria.initialize(apiToken: apiToken)
        resolve(ometriaInit)
    }
    
    @objc(trackProfileIdentifiedByCustomerIdEvent:resolver:rejecter:)
    func trackProfileIdentifiedByCustomerIdEvent(customerId: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackProfileIdentifiedEvent(customerId: customerId)
        resolve(nil)
    }
    
    @objc(trackProfileIdentifiedByEmailEvent:resolver:rejecter:)
    func trackProfileIdentifiedByEmailEvent(email: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackProfileIdentifiedEvent(email: email)
        resolve(nil)
    }
    
    @objc(trackProfileDeidentifiedEvent:rejecter:)
    func trackProfileDeidentifiedEvent(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackProfileDeidentifiedEvent()
        resolve(nil)
    }
    
    
    @objc(trackProductViewedEvent:resolver:rejecter:)
    func trackProductViewedEvent(productId: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackProductViewedEvent(productId: productId)
        resolve(nil)
    }
    
    @objc(trackProductListingViewedEvent:listingAttributes:resolver:rejecter:)
    func trackProductListingViewedEvent(listingType: String?, listingAttributes: [String: Any]?, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackProductListingViewedEvent(listingType: listingType, listingAttributes: listingAttributes)
        resolve(nil)
    }
    
    @objc(trackWishlistAddedToEvent:resolver:rejecter:)
    func trackWishlistAddedToEvent(productId: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackWishlistAddedToEvent(productId: productId)
        resolve(nil)
    }
    
    @objc(trackWishlistRemovedFromEvent:resolver:rejecter:)
    func trackWishlistRemovedFromEvent(productId: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackWishlistRemovedFromEvent(productId: productId)
        resolve(nil)
    }
    
    @objc(trackBasketViewedEvent:rejecter:)
    func trackBasketViewedEvent(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackBasketViewedEvent()
        resolve(nil)
    }
    
    @objc(trackBasketUpdatedEvent:resolver:rejecter:)
    func trackBasketUpdatedEvent(basketDictionary: [String: Any], resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        
        let decoder = JSONDecoder()
        do {
            let data = try JSONSerialization.data(withJSONObject: basketDictionary, options: .fragmentsAllowed)
            let basket = try decoder.decode(OmetriaBasket.self, from: data)
            Ometria.sharedInstance().trackBasketUpdatedEvent(basket: basket)
            resolve(nil)
        } catch {
            reject("0", "Invalid basket structure", error)
        }
    }
    
    @objc(trackOrderCompletedEvent:basket:resolver:rejecter:)
    func trackOrderCompletedEvent(orderId: String, basketDictionary: [String: Any]?, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        guard let basketDictionary = basketDictionary else {
            Ometria.sharedInstance().trackOrderCompletedEvent(orderId: orderId)
            resolve(nil)
            return
        }
        
        let decoder = JSONDecoder()
        do {
            let data = try JSONSerialization.data(withJSONObject: basketDictionary, options: .fragmentsAllowed)
            let basket = try decoder.decode(OmetriaBasket.self, from: data)
            Ometria.sharedInstance().trackOrderCompletedEvent(orderId: orderId, basket: basket)
            resolve(nil)
        } catch {
            reject("0", "Invalid basket structure", error)
        }
    }
    
    @objc(trackDeepLinkOpenedEvent:screenName:resolver:rejecter:)
    func trackDeepLinkOpenedEvent(link: String, screenName: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackDeepLinkOpenedEvent(link: link, screenName: screenName)
        resolve(nil)
    }
    
    @objc(trackScreenViewedEvent:additionalInfo:resolver:rejecter:)
    func trackScreenViewedEvent(screenName: String, additionalInfo: [String: Any]?, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackScreenViewedEvent(screenName: screenName, additionalInfo: additionalInfo ?? [:])
        resolve(nil)
    }
    
    @objc(trackCustomEvent:additionalInfo:resolver:rejecter:)
    func trackCustomEvent(customEventType: String, additionalInfo: [String: Any]?, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackCustomEvent(customEventType: customEventType, additionalInfo: additionalInfo)
        resolve(nil)
    }
    
    @objc(flush:rejecter:)
    func flush(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().flush()
        resolve(nil)
    }
    
    @objc(clear:rejecter:)
    func clear(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().clear()
        resolve(nil)
    }
    
    @objc(isLoggingEnabled:resolver:rejecter:)
    func isLoggingEnabled(enabled: Bool, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().isLoggingEnabled = enabled
        resolve(nil)
    }
    
    @objc(onNewToken:resolver:rejecter:)
    func onNewToken(pushToken: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve(nil)
    }
}
