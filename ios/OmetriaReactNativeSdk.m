#import <React/RCTBridgeModule.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

//@interface RCT_EXTERN_MODULE

@interface RCT_EXTERN_MODULE(OmetriaReactNativeSdk, NSObject)

RCT_EXTERN_METHOD(initializeWithApiToken:(NSString *)apiToken withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

//RCT_EXTERN_METHOD(trackProfileIdentifiedEventByCustomerID:(NSString *)customerId
//                 withResolver:(RCTPromiseResolveBlock)resolve
//                 withRejecter:(RCTPromiseRejectBlock)reject)
//
//RCT_EXTERN_METHOD(trackProfileIdentifiedEventByEmail:(NSString *)email
//                 withResolver:(RCTPromiseResolveBlock)resolve
//                 withRejecter:(RCTPromiseRejectBlock)reject)
//
//RCT_EXTERN_METHOD(trackProductViewedEvent:(NSString *)productId
//                 withResolver:(RCTPromiseResolveBlock)resolve
//                 withRejecter:(RCTPromiseRejectBlock)reject)
//
//RCT_EXTERN_METHOD(trackProductCategoryViewedEvent:(NSString *)category
//                 withResolver:(RCTPromiseResolveBlock)resolve
//                 withRejecter:(RCTPromiseRejectBlock)reject)
//
//RCT_EXTERN_METHOD(trackWishlistAddedToEvent:(NSString *)productId
//                 withResolver:(RCTPromiseResolveBlock)resolve
//                 withRejecter:(RCTPromiseRejectBlock)reject)
//
//RCT_EXTERN_METHOD(trackWishlistRemovedFromEvent:(NSString *)productId
//                 withResolver:(RCTPromiseResolveBlock)resolve
//                 withRejecter:(RCTPromiseRejectBlock)reject)
//
//RCT_EXTERN_METHOD(trackBasketViewedEvent:
//                 withResolver:(RCTPromiseResolveBlock)resolve
//                 withRejecter:(RCTPromiseRejectBlock)reject)
//
//RCT_EXTERN_METHOD(trackBasketUpdatedEvent:(OmetriaBasket *)basket
//                 withResolver:(RCTPromiseResolveBlock)resolve
//                 withRejecter:(RCTPromiseRejectBlock)reject)
//
//RCT_EXTERN_METHOD(trackOrderCompletedEvent:(NSString *)orderId, (OmetriaBasket *)basket
//                 withResolver:(RCTPromiseResolveBlock)resolve
//                 withRejecter:(RCTPromiseRejectBlock)reject)
//
//RCT_EXTERN_METHOD(trackDeepLinkOpenedEvent:(NSString *)link, (NSString *)screenName
//                 withResolver:(RCTPromiseResolveBlock)resolve
//                 withRejecter:(RCTPromiseRejectBlock)reject)
//
//RCT_EXTERN_METHOD(trackScreenViewedEvent:(NSString *)screenName, (NSDictionary *)additionalInfo
//                 withResolver:(RCTPromiseResolveBlock)resolve
//                 withRejecter:(RCTPromiseRejectBlock)reject)
//
//RCT_EXTERN_METHOD(trackCustomEvent:(NSString *)customEventType, (NSDictionary *)additionalInfo
//                 withResolver:(RCTPromiseResolveBlock)resolve
//                 withRejecter:(RCTPromiseRejectBlock)reject)
//
//RCT_EXTERN_METHOD(flush
//                 withResolver:(RCTPromiseResolveBlock)resolve
//                 withRejecter:(RCTPromiseRejectBlock)reject)
//
//RCT_EXTERN_METHOD(clear
//                 withResolver:(RCTPromiseResolveBlock)resolve
//                 withRejecter:(RCTPromiseRejectBlock)reject)
//
//RCT_EXTERN_METHOD(clear
//                 withResolver:(RCTPromiseResolveBlock)resolve
//                 withRejecter:(RCTPromiseRejectBlock)reject)
@end
