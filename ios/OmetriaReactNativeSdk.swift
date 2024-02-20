import Ometria
import Foundation
import UserNotifications

@objc(OmetriaReactNativeSdk)
class OmetriaReactNativeSdk: RCTEventEmitter, OmetriaNotificationInteractionDelegate {

    // No longer needed since 2.4.0
    // static let RNOmetriaRCTEventNameOnNotificationInteracted = "onNotificationInteracted"
    // static let RNOmetriaRCTEventNameOnDeepLinkInteracted = "onDeepLinkInteracted"
    
    fileprivate enum Constants {
        static let appGroupIdentifierKey = "appGroupIdentifier"
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    // No longer needed since 2.4.0
    /* override func supportedEvents() -> [String]! {
        return [Self.RNOmetriaRCTEventNameOnNotificationInteracted, Self.RNOmetriaRCTEventNameOnDeepLinkInteracted]
    }*/

    override func constantsToExport() -> [AnyHashable : Any]! {
        return [:]
    }

    @objc(initializeWithApiToken:options:resolver:rejecter:)
    func initialize(apiToken: String, options: [String: String]?, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        OmetriaStorageKeys.rnVersion = "2.3.1"
        DispatchQueue.main.async {
            let ometriaInit = Ometria.initialize(apiToken: apiToken, enableSwizzling: false, appGroupIdentifier: options?[Constants.appGroupIdentifierKey])
            resolve(ometriaInit)
            Ometria.sharedInstance().notificationInteractionDelegate = self
        }
    }

    @objc(initializeWithApiToken:resolver:rejecter:)
    func initialize(apiToken: String, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        initialize(apiToken: apiToken, options: nil, resolve: resolve, reject: reject)
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

    // Deprecated
    @objc(trackWishlistAddedToEvent:resolver:rejecter:)
    func trackWishlistAddedToEvent(productId: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        // Ometria.sharedInstance().trackWishlistAddedToEvent(productId: productId)
        resolve(nil)
    }

    // Deprecated
    @objc(trackWishlistRemovedFromEvent:resolver:rejecter:)
    func trackWishlistRemovedFromEvent(productId: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        // Ometria.sharedInstance().trackWishlistRemovedFromEvent(productId: productId)
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


    @objc(trackCheckoutStartedEvent:resolver:rejecter:)
    func trackCheckoutStartedEvent(orderId: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackCheckoutStartedEvent(orderId: orderId)
        resolve(nil)
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

    @objc(trackHomeScreenViewedEvent:rejecter:)
    func trackHomeScreenViewedEvent(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackHomeScreenViewedEvent()
        resolve(nil)
    }

    @objc(trackScreenViewedEvent:additionalInfo:resolver:rejecter:)
    func trackScreenViewedEvent(screenName: String, additionalInfo: [String: Any]?, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackScreenViewedEvent(screenName: screenName, additionalInfo: additionalInfo ?? [:])
        resolve(nil)
    }
    
    @objc(onNotificationInteracted:resolver:rejecter:)
    func onNotificationInteracted(remoteMessage: [AnyHashable: Any], resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let data = remoteMessage["data"] as? [AnyHashable: Any]
        let response:[AnyHashable: Any] = ["aps": ["alert": data]]
        Ometria.sharedInstance().handleNotificationResponse(response)
        resolve(nil)
    }
    
    @objc(onNotificationReceived:resolver:rejecter:)
    func onNotificationReceived(remoteMessage: [AnyHashable: Any], resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let data = remoteMessage["data"] as? [AnyHashable: Any]
        let response:[AnyHashable: Any] = ["aps": ["alert": data]]
        Ometria.sharedInstance().handleReceivedNotification(response)
        resolve(nil)
    }


    @objc(trackCustomEvent:additionalInfo:resolver:rejecter:)
    func trackCustomEvent(customEventType: String, additionalInfo: [String: Any]?, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackCustomEvent(customEventType: customEventType, additionalInfo: additionalInfo ?? [:])
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
        Ometria.sharedInstance().handleFirebaseTokenChanged(token: pushToken)
        resolve(nil)
    }

    @objc(processUniversalLink:resolver:rejecter:)
    func processUniversalLink(url: URL, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().processUniversalLink(url) { (url, error) in
            if let url = url {
                resolve(url.absoluteString)
            } else {
                reject("0", "Invalid universal link", error)
            }
        }
    }


    // Deprecated
    func handleDeepLinkInteraction(_ deepLink: URL) {
        // sendEvent(withName: Self.RNOmetriaRCTEventNameOnDeepLinkInteracted, body: deepLink.absoluteString)
    }

    func handleOmetriaNotificationInteraction(_ notification: OmetriaNotification) -> Void {
        /*  let ometriaNotificationObject: [String: Any] = ["deepLinkActionUrl": notification.deepLinkActionUrl,
                                                          "imageUrl": notification.imageUrl,
                                                          "externalCustomerId": notification.externalCustomerId,
                                                          "campaignType": notification.campaignType,
                                                          "sendId": notification.sendId,
                                                          "tracking": notification.tracking]
          sendEvent(withName: Self.RNOmetriaRCTEventNameOnNotificationInteracted, body: ometriaNotificationObject)
         */
    }
}
