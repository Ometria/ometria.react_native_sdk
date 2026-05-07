---
sidebar_position: 2
title: Installation
---

# Installation

## 1. Install the library

The easiest way to get Ometria into your iOS project is by using [CocoaPods](https://cocoapods.org/).

1. If you are using CocoaPods for the first time, install CocoaPods using `gem install cocoapods` in terminal.
2. Create a Podfile in your Xcode project directory by running `pod init` in your terminal, edit the Podfile generated and add the following line: `pod 'Ometria'`.
3. Run `pod install` in your Xcode project directory. CocoaPods should download and install the library, and create a new Xcode workspace. Open this workspace in Xcode or typing `open *.xcworkspace` in your terminal.

## 2. Initialise the library

To initialise Ometria, you need to enter the API key from the [Getting Started](./intro.md) page.

The best place to do this is in [application(_:didFinishLaunchingWithOptions:)](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIApplicationDelegate_Protocol/#//apple_ref/occ/intfm/UIApplicationDelegate/application:didFinishLaunchingWithOptions:).

Initialise the library by adding **import Ometria** and then calling **Ometria.initialize(apiToken:appGroupIdentifier:)** with your API key and the App Group Identifier you have just created as its arguments.

:::info
The `appGroupIdentifier` will allow the notification service extension to read and write data directly inside the cache used by the Ometria SDK.
:::

Once you've called this method once, you can access your instance throughout the rest of your application with **sharedInstance()**.

Ometria uses [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) to send push notifications to the mobile devices.

To do this, add 'Firebase/Messaging' as a dependency of Ometria.

* If you installed the library via CocoaPods it is automatically installed.
* If you added Ometria manually in your project, you should [install the Firebase SDK](https://firebase.google.com/docs/cloud-messaging/ios/client) separately.

After initialising Ometria, do the same for [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging/ios/client).

Once complete you will have something like this:

```swift
import Ometria

func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    Ometria.initialize(apiToken: "OMETRIA_API_TOKEN", appGroupIdentifier: "YOUR_APP_GROUP_IDENTIFIER")
    FirebaseApp.configure()
    return true
}
```

Ometria logs any errors encountered during runtime by default. See [Troubleshooting](./troubleshooting.md) if you want to enable advanced logging.

## 3. Disabling Swizzling

Method Swizzling is the ability to change the functionality of an existing selector/method at runtime.

:::info
By default, the Ometria SDK uses Swizzling in order to gain access to data arriving in push messages. We have chosen this method so implementers have to do less work to integrate with the SDK. However, if you are not comfortable with using Swizzling, we have provided a set of methods that need to be called in order to provide the Ometria SDK with the required information to show Push Notifications to the user.
:::

First of all, you will have to update your initializer so that it doesn't use Swizzling.

```swift
Ometria.initialize(apiToken: "YOUR_API_TOKEN_HERE", enableSwizzling: false, appGroupIdentifier: "YOUR_APP_GROUP_IDENTIFIER")
```

Next, you will need to provide the Firebase push token every time Firebase updates it. You can do this in the delegate method from Messaging:

```swift
func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    if let token = fcmToken {
        Ometria.sharedInstance().handleFirebaseTokenChanged(token: token)
    }
}
```

Finally the Ometria SDK needs to know when users receive and interact with push notifications. The information for those events can be provided in the following methods:

```swift
func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
    Ometria.sharedInstance().handleNotificationResponse(response)
    completionHandler()
}

func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    Ometria.sharedInstance().handleReceivedNotification(notification)
    completionHandler([.alert, .sound])
}
```

With all these timely provided, the Ometria SDK should have the information it needs to deliver push notifications to users and gather information on interacting with them.

## 4. Using multiple Ometria API tokens within the same app instance (Reinitializing the SDK)

There are cases where different flows of an application should log events under different tokens (think of different regions in your ecommerce setup, or other similar scenarios). To address this, we offer the possibility of reinitializing the Ometria SDK. Although we currently do not keep references to multiple instances of the SDK, we ensure that on reinitialization there will be a flush attempt for all the events that have been logged up to that point on the old instance.

Reinitializing the SDK requires the exact steps as a normal initialization. Please consult [Initialise the library](#2-initialise-the-library) in order to make sure everything is set up properly.
