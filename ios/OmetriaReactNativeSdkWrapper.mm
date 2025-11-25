#if RCT_NEW_ARCH_ENABLED
#import <ReactCodegen/OmetriaReactNativeSdkSpec/OmetriaReactNativeSdkSpec.h>
#import <React/RCTBridgeModule.h>
#import <objc/message.h>

using namespace facebook::react;

// Private protocol defining Swift method signatures for runtime calls
// This allows us to call Swift methods without importing the Swift header
@protocol OmetriaSwiftBridge <NSObject>
- (void)initializeWithApiToken:(NSString *)token options:(id)options resolve:(id)resolve reject:(id)reject;
- (void)updateStoreId:(NSString *)storeId resolve:(id)resolve reject:(id)reject;
- (void)trackProfileIdentifiedByCustomerIdEvent:(NSString *)customerId storeId:(NSString *)storeId resolve:(id)resolve reject:(id)reject;
- (void)trackProfileIdentifiedByEmailEvent:(NSString *)email storeId:(NSString *)storeId resolve:(id)resolve reject:(id)reject;
- (void)trackProfileIdentifiedEvent:(NSString *)customerId email:(NSString *)email storeId:(NSString *)storeId resolve:(id)resolve reject:(id)reject;
- (void)trackProfileDeidentifiedEvent:(id)resolve reject:(id)reject;
- (void)trackProductViewedEvent:(NSString *)productId resolve:(id)resolve reject:(id)reject;
- (void)trackProductListingViewedEvent:(NSString *)listingType listingAttributes:(id)listingAttributes resolve:(id)resolve reject:(id)reject;
- (void)trackWishlistAddedToEvent:(NSString *)productId resolve:(id)resolve reject:(id)reject;
- (void)trackWishlistRemovedFromEvent:(NSString *)productId resolve:(id)resolve reject:(id)reject;
- (void)trackBasketViewedEvent:(id)resolve reject:(id)reject;
- (void)trackBasketUpdatedEvent:(id)basket resolve:(id)resolve reject:(id)reject;
- (void)trackCheckoutStartedEvent:(NSString *)orderId resolve:(id)resolve reject:(id)reject;
- (void)trackOrderCompletedEvent:(NSString *)orderId basket:(id)basket resolve:(id)resolve reject:(id)reject;
- (void)trackHomeScreenViewedEvent:(id)resolve reject:(id)reject;
- (void)trackDeepLinkOpenedEvent:(NSString *)link screenName:(NSString *)screenName resolve:(id)resolve reject:(id)reject;
- (void)trackScreenViewedEvent:(NSString *)screenName additionalInfo:(id)additionalInfo resolve:(id)resolve reject:(id)reject;
- (void)trackCustomEvent:(NSString *)customEventType additionalInfo:(id)additionalInfo resolve:(id)resolve reject:(id)reject;
- (void)flush:(id)resolve reject:(id)reject;
- (void)clear:(id)resolve reject:(id)reject;
- (void)isLoggingEnabled:(BOOL)enabled resolve:(id)resolve reject:(id)reject;
- (void)processUniversalLink:(NSString *)url resolve:(id)resolve reject:(id)reject;
- (void)onNewToken:(NSString *)token resolve:(id)resolve reject:(id)reject;
- (void)onMessageReceived:(id)remoteMessage resolve:(id)resolve reject:(id)reject;
- (void)onNotificationReceived:(id)remoteMessage resolve:(id)resolve reject:(id)reject;
- (void)parseNotification:(id)remoteMessage resolve:(id)resolve reject:(id)reject;
- (void)onNotificationInteracted:(id)remoteMessage resolve:(id)resolve reject:(id)reject;
- (void)onDeepLinkInteracted:(id)resolve reject:(id)reject;
@end

// Objective-C++ wrapper that implements TurboModule protocol and forwards to Swift class
// Uses runtime class lookup to avoid compile-time dependency on Swift
@interface OmetriaReactNativeSdkTurboModule : NSObject <NativeOmetriaReactNativeSdkSpec>
@property (nonatomic, strong) id<OmetriaSwiftBridge> swiftModule;
@end

@implementation OmetriaReactNativeSdkTurboModule

RCT_EXPORT_MODULE(OmetriaReactNativeSdk)

- (instancetype)init {
    NSLog(@"🟢 [OmetriaReactNativeSdkTurboModule] init called - TurboModule wrapper is being instantiated");
    if (self = [super init]) {
        // Use runtime class lookup to get Swift class without importing Swift header
        Class swiftClass = NSClassFromString(@"OmetriaReactNativeSdk");
        if (swiftClass) {
            NSLog(@"🟢 [OmetriaReactNativeSdkTurboModule] Successfully found Swift class, creating instance");
            _swiftModule = [[swiftClass alloc] init];
            NSLog(@"🟢 [OmetriaReactNativeSdkTurboModule] Swift module instance created: %@", _swiftModule);
        } else {
            NSLog(@"🔴 [OmetriaReactNativeSdkTurboModule] ERROR: Swift class 'OmetriaReactNativeSdk' not found at runtime");
        }
    }
    return self;
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params {
    return std::make_shared<NativeOmetriaReactNativeSdkSpecJSI>(params);
}

// Forward all method calls to Swift implementation using Objective-C runtime

- (void)initializeWithApiToken:(NSString *)token
                       options:(JS::NativeOmetriaReactNativeSdk::OmetriaOptions &)options
                       resolve:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject {
    NSLog(@"🟢 [OmetriaReactNativeSdkTurboModule] initializeWithApiToken called with token: %@", token);
    NSDictionary *optionsDict = @{
        @"notificationChannelName": options.notificationChannelName() ?: [NSNull null],
        @"appGroupIdentifier": options.appGroupIdentifier() ?: [NSNull null]
    };
    NSLog(@"🟢 [OmetriaReactNativeSdkTurboModule] About to call Swift module with options: %@", optionsDict);
    [self.swiftModule initializeWithApiToken:token options:optionsDict resolve:resolve reject:reject];
    NSLog(@"🟢 [OmetriaReactNativeSdkTurboModule] Called Swift module initializeWithApiToken");
}

- (void)updateStoreId:(NSString *)storeId
              resolve:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule updateStoreId:storeId resolve:resolve reject:reject];
}

- (void)trackProfileIdentifiedByCustomerIdEvent:(NSString *)customerId
                                        storeId:(NSString *)storeId
                                        resolve:(RCTPromiseResolveBlock)resolve
                                         reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule trackProfileIdentifiedByCustomerIdEvent:customerId storeId:storeId resolve:resolve reject:reject];
}

- (void)trackProfileIdentifiedByEmailEvent:(NSString *)email
                                   storeId:(NSString *)storeId
                                   resolve:(RCTPromiseResolveBlock)resolve
                                    reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule trackProfileIdentifiedByEmailEvent:email storeId:storeId resolve:resolve reject:reject];
}

- (void)trackProfileIdentifiedEvent:(NSString *)customerId
                              email:(NSString *)email
                            storeId:(NSString *)storeId
                            resolve:(RCTPromiseResolveBlock)resolve
                             reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule trackProfileIdentifiedEvent:customerId email:email storeId:storeId resolve:resolve reject:reject];
}

- (void)trackProfileDeidentifiedEvent:(RCTPromiseResolveBlock)resolve
                               reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule trackProfileDeidentifiedEvent:resolve reject:reject];
}

- (void)trackProductViewedEvent:(NSString *)productId
                        resolve:(RCTPromiseResolveBlock)resolve
                         reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule trackProductViewedEvent:productId resolve:resolve reject:reject];
}

- (void)trackProductListingViewedEvent:(NSString *)listingType
                     listingAttributes:(NSDictionary *)listingAttributes
                               resolve:(RCTPromiseResolveBlock)resolve
                                reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule trackProductListingViewedEvent:listingType listingAttributes:listingAttributes resolve:resolve reject:reject];
}

- (void)trackWishlistAddedToEvent:(NSString *)productId
                          resolve:(RCTPromiseResolveBlock)resolve
                           reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule trackWishlistAddedToEvent:productId resolve:resolve reject:reject];
}

- (void)trackWishlistRemovedFromEvent:(NSString *)productId
                              resolve:(RCTPromiseResolveBlock)resolve
                               reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule trackWishlistRemovedFromEvent:productId resolve:resolve reject:reject];
}

- (void)trackBasketViewedEvent:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule trackBasketViewedEvent:resolve reject:reject];
}

- (void)trackBasketUpdatedEvent:(JS::NativeOmetriaReactNativeSdk::OmetriaBasket &)basket
                        resolve:(RCTPromiseResolveBlock)resolve
                         reject:(RCTPromiseRejectBlock)reject {
    // Convert C++ basket to NSDictionary
    NSMutableArray *items = [NSMutableArray array];
    for (const auto &item : basket.items()) {
        [items addObject:@{
            @"productId": item.productId(),
            @"sku": item.sku() ?: [NSNull null],
            @"quantity": @(item.quantity()),
            @"price": @(item.price()),
            @"variantId": item.variantId() ?: [NSNull null]
        }];
    }

    NSDictionary *basketDict = @{
        @"id": basket.id_() ?: [NSNull null],
        @"currency": basket.currency(),
        @"totalPrice": @(basket.totalPrice()),
        @"items": items,
        @"link": basket.link()
    };
    [self.swiftModule trackBasketUpdatedEvent:basketDict resolve:resolve reject:reject];
}

- (void)trackCheckoutStartedEvent:(NSString *)orderId
                          resolve:(RCTPromiseResolveBlock)resolve
                           reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule trackCheckoutStartedEvent:orderId resolve:resolve reject:reject];
}

- (void)trackOrderCompletedEvent:(NSString *)orderId
                          basket:(JS::NativeOmetriaReactNativeSdk::OmetriaBasket &)basket
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject {
    // Convert C++ basket to NSDictionary
    NSMutableArray *items = [NSMutableArray array];
    for (const auto &item : basket.items()) {
        [items addObject:@{
            @"productId": item.productId(),
            @"sku": item.sku() ?: [NSNull null],
            @"quantity": @(item.quantity()),
            @"price": @(item.price()),
            @"variantId": item.variantId() ?: [NSNull null]
        }];
    }

    NSDictionary *basketDict = @{
        @"id": basket.id_() ?: [NSNull null],
        @"currency": basket.currency(),
        @"totalPrice": @(basket.totalPrice()),
        @"items": items,
        @"link": basket.link()
    };
    [self.swiftModule trackOrderCompletedEvent:orderId basket:basketDict resolve:resolve reject:reject];
}

- (void)trackHomeScreenViewedEvent:(RCTPromiseResolveBlock)resolve
                            reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule trackHomeScreenViewedEvent:resolve reject:reject];
}

- (void)trackDeepLinkOpenedEvent:(NSString *)link
                      screenName:(NSString *)screenName
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule trackDeepLinkOpenedEvent:link screenName:screenName resolve:resolve reject:reject];
}

- (void)trackScreenViewedEvent:(NSString *)screenName
                additionalInfo:(NSDictionary *)additionalInfo
                       resolve:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule trackScreenViewedEvent:screenName additionalInfo:additionalInfo resolve:resolve reject:reject];
}

- (void)trackCustomEvent:(NSString *)customEventType
          additionalInfo:(NSDictionary *)additionalInfo
                 resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule trackCustomEvent:customEventType additionalInfo:additionalInfo resolve:resolve reject:reject];
}

- (void)flush:(RCTPromiseResolveBlock)resolve
       reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule flush:resolve reject:reject];
}

- (void)clear:(RCTPromiseResolveBlock)resolve
       reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule clear:resolve reject:reject];
}

- (void)isLoggingEnabled:(BOOL)enabled
                 resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule isLoggingEnabled:enabled resolve:resolve reject:reject];
}

- (void)processUniversalLink:(NSString *)url
                     resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule processUniversalLink:url resolve:resolve reject:reject];
}

- (void)onNewToken:(NSString *)token
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule onNewToken:token resolve:resolve reject:reject];
}

- (void)onMessageReceived:(NSDictionary *)remoteMessage
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule onMessageReceived:remoteMessage resolve:resolve reject:reject];
}

- (void)onNotificationReceived:(NSDictionary *)remoteMessage
                       resolve:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule onNotificationReceived:remoteMessage resolve:resolve reject:reject];
}

- (void)parseNotification:(NSDictionary *)remoteMessage
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule parseNotification:remoteMessage resolve:resolve reject:reject];
}

- (void)onNotificationInteracted:(NSDictionary *)remoteMessage
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule onNotificationInteracted:remoteMessage resolve:resolve reject:reject];
}

- (void)onDeepLinkInteracted:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject {
    [self.swiftModule onDeepLinkInteracted:resolve reject:reject];
}

@end

#endif // RCT_NEW_ARCH_ENABLED
