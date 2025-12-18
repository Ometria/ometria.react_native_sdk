/**
 * This category forces the linker to include the TurboModule class.
 *
 * The -ObjC linker flag loads all Objective-C categories from static frameworks.
 * This category references OmetriaReactNativeSdkTurboModule, which creates a
 * link-time dependency that forces the class to be included in the binary.
 */

#import <Foundation/Foundation.h>

#if RCT_NEW_ARCH_ENABLED

// Forward declaration - creates link-time dependency
@interface OmetriaReactNativeSdkTurboModule : NSObject
@end

// Category on NSObject - will be loaded by -ObjC flag
@implementation NSObject (OmetriaTurboModuleLinker)

+ (Class)_ometria_turboModuleClass {
    // This reference forces the linker to include OmetriaReactNativeSdkTurboModule
    return [OmetriaReactNativeSdkTurboModule class];
}

@end

#endif
