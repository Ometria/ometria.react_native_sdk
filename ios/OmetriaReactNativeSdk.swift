import Ometria
import Foundation
import UserNotifications
import React

// Architecture-specific setup:
// - New Arch: OmetriaReactNativeSdkWrapper.mm is the TurboModule that conforms to
//   NativeOmetriaReactNativeSdkSpec and forwards calls to this Swift class at runtime.
// - Old Arch: OmetriaReactNativeSdk.m uses RCT_EXTERN_MODULE to export this class.
// In both cases, the React Native protocol conformance is handled externally.

@objc(OmetriaReactNativeSdk)
class OmetriaReactNativeSdk: NSObject, OmetriaNotificationInteractionDelegate {
    fileprivate enum Constants {
        static let appGroupIdentifierKey = "appGroupIdentifier"
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc
    func constantsToExport() -> [AnyHashable : Any]! {
        return [:]
    }

    @objc(initializeWithApiToken:options:resolve:reject:)
    func initialize(token: String, options: NSDictionary?, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        NSLog("🔵 [Ometria Native] initialize called with token: %@", token)
        NSLog("🔵 [Ometria Native] options: %@", String(describing: options))

        OmetriaStorageKeys.rnVersion = "2.6.1"
        DispatchQueue.main.async {
            NSLog("🔵 [Ometria Native] About to call Ometria.initialize")
            let appGroupIdentifier = options?[Constants.appGroupIdentifierKey] as? String
            let ometriaInit = Ometria.initialize(apiToken: token, enableSwizzling: false, appGroupIdentifier: appGroupIdentifier)
            NSLog("🔵 [Ometria Native] Ometria.initialize returned")
            resolve(ometriaInit)
            NSLog("🔵 [Ometria Native] Called resolve() - promise should be resolved now")
            Ometria.sharedInstance().notificationInteractionDelegate = self
        }
    }

    @objc(updateStoreId:resolve:reject:)
    func updateStoreId(storeId: String?, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
      Ometria.sharedInstance().updateStoreId(storeId: storeId)
        resolve(nil)
    }

  @objc(trackProfileIdentifiedByCustomerIdEvent:storeId:resolve:reject:)
    func trackProfileIdentifiedByCustomerIdEvent(customerId: String, storeId: String?, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackProfileIdentifiedEvent(customerId: customerId, storeId: storeId)
        resolve(nil)
    }

  @objc(trackProfileIdentifiedByEmailEvent:storeId:resolve:reject:)
    func trackProfileIdentifiedByEmailEvent(email: String, storeId: String?, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackProfileIdentifiedEvent(email: email, storeId: storeId)
        resolve(nil)
    }

  @objc(trackProfileIdentifiedEvent:email:storeId:resolve:reject:)
  func trackProfileIdentifiedEvent(customerId: String, email: String, storeId: String?, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
      Ometria.sharedInstance().trackProfileIdentifiedEvent(customerId: customerId, email: email, storeId: storeId)
      resolve(nil)
  }

    @objc(trackProfileDeidentifiedEvent:reject:)
    func trackProfileDeidentifiedEvent(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackProfileDeidentifiedEvent()
        resolve(nil)
    }


    @objc(trackProductViewedEvent:resolve:reject:)
    func trackProductViewedEvent(productId: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackProductViewedEvent(productId: productId)
        resolve(nil)
    }

    @objc(trackProductListingViewedEvent:listingAttributes:resolve:reject:)
    func trackProductListingViewedEvent(listingType: String?, listingAttributes: [String: Any]?, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackProductListingViewedEvent(listingType: listingType, listingAttributes: listingAttributes)
        resolve(nil)
    }

    @objc(trackWishlistAddedToEvent:resolve:reject:)
    func trackWishlistAddedToEvent(productId: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        NSLog("trackWishlistAddedToEvent is deprecated and not supported on iOS")
        resolve(nil)
    }

    @objc(trackWishlistRemovedFromEvent:resolve:reject:)
    func trackWishlistRemovedFromEvent(productId: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        NSLog("trackWishlistRemovedFromEvent is deprecated and not supported on iOS")
        resolve(nil)
    }

    @objc(trackBasketViewedEvent:reject:)
    func trackBasketViewedEvent(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackBasketViewedEvent()
        resolve(nil)
    }

    @objc(trackBasketUpdatedEvent:resolve:reject:)
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


    @objc(trackCheckoutStartedEvent:resolve:reject:)
    func trackCheckoutStartedEvent(orderId: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackCheckoutStartedEvent(orderId: orderId)
        resolve(nil)
    }

    @objc(trackOrderCompletedEvent:basket:resolve:reject:)
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

    @objc(trackDeepLinkOpenedEvent:screenName:resolve:reject:)
    func trackDeepLinkOpenedEvent(link: String, screenName: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackDeepLinkOpenedEvent(link: link, screenName: screenName)
        resolve(nil)
    }

    @objc(trackHomeScreenViewedEvent:reject:)
    func trackHomeScreenViewedEvent(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackHomeScreenViewedEvent()
        resolve(nil)
    }

    @objc(trackScreenViewedEvent:additionalInfo:resolve:reject:)
    func trackScreenViewedEvent(screenName: String, additionalInfo: [String: Any]?, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackScreenViewedEvent(screenName: screenName, additionalInfo: additionalInfo ?? [:])
        resolve(nil)
    }

    @objc(onNotificationInteracted:resolve:reject:)
    func onNotificationInteracted(remoteMessage: [AnyHashable: Any], resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let data = remoteMessage["data"] as? [AnyHashable: Any]
        let response:[AnyHashable: Any] = ["aps": ["alert": data]]
        Ometria.sharedInstance().handleNotificationResponse(response)
        resolve(nil)
    }

    @objc(onNotificationReceived:resolve:reject:)
    func onNotificationReceived(remoteMessage: [AnyHashable: Any], resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let data = remoteMessage["data"] as? [AnyHashable: Any]
        let response:[AnyHashable: Any] = ["aps": ["alert": data]]
        Ometria.sharedInstance().handleReceivedNotification(response)
        resolve(nil)
    }


    @objc(trackCustomEvent:additionalInfo:resolve:reject:)
    func trackCustomEvent(customEventType: String, additionalInfo: [String: Any]?, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().trackCustomEvent(customEventType: customEventType, additionalInfo: additionalInfo ?? [:])
        resolve(nil)
    }

    @objc(flush:reject:)
    func flush(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().flush()
        resolve(nil)
    }

    @objc(clear:reject:)
    func clear(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().clear()
        resolve(nil)
    }

    @objc(isLoggingEnabled:resolve:reject:)
    func isLoggingEnabled(enabled: Bool, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().isLoggingEnabled = enabled
        resolve(nil)
    }

    @objc(onNewToken:resolve:reject:)
    func onNewToken(pushToken: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Ometria.sharedInstance().handleFirebaseTokenChanged(token: pushToken)
        resolve(nil)
    }

    @objc(onMessageReceived:resolve:reject:)
    func onMessageReceived(remoteMessage: [String: Any], resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        // Deprecated - no-op
        resolve(nil)
    }

    @objc(parseNotification:resolve:reject:)
    func parseNotification(remoteMessage: [String: Any], resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        // iOS handles parsing in JS layer - return null
        resolve(nil)
    }

    @objc(onDeepLinkInteracted:reject:)
    func onDeepLinkInteracted(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        // Deprecated - return empty string
        resolve("")
    }

    @objc(processUniversalLink:resolve:reject:)
    func processUniversalLink(url: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        guard let urlObj = URL(string: url) else {
            reject("0", "Invalid URL string", nil)
            return
        }
        Ometria.sharedInstance().processUniversalLink(urlObj) { (url, error) in
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
