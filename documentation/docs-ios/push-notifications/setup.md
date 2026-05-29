---
sidebar_position: 1
title: Setup
---

# Push Notifications Setup

Ometria uses [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) to send push notifications to the mobile devices. Ometria can send personalised notifications for your mobile application. Follow these steps:

- Enable your app to receive push notifications by creating an appId and enabling the push notifications entitlement
- Set up a [Firebase](https://firebase.google.com/docs/cloud-messaging) account and connect it to Ometria
- Enable Cloud Messaging on your Firebase account and provide your application's **SSL push certificate**
- Configure push notifications in your application
- Add a **Notification Service Extension** to your app in order to enable receiving rich content notifications and to track notifications received in quit state of the app

:::info

Although on Android you are allowed to change what icon is displayed on push notifications, Apple is being more restrictive in this sense. Therefore, push notifications on iOS and ipadOS always use the application icon, and the only changes in layout can be done by user controlled preferences. To find out more about this, see [Notifications Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/components/system-experiences/notifications)

:::

## Configure push notifications in your application

Before continuing, you must have already configured:

* The Ometria SDK
* Firebase

Once you have done the above configuration steps, you can move on to configure everything in your AppDelegate like so:

```swift
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        Ometria.initialize(apiToken: "OMETRIA_API_TOKEN")
        FirebaseApp.configure()
        configurePushNotifications()

        return true
    }

    func configurePushNotifications() {
        UNUserNotificationCenter.current().delegate = self
        let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
        UNUserNotificationCenter.current().requestAuthorization(options: authOptions) {
            [weak self] (granted, error) in

            print("Permission granted: \(granted)")
            guard granted else { return }
            self?.getNotificationSettings()
        }
        UIApplication.shared.registerForRemoteNotifications()
    }

    func getNotificationSettings() {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            print("Notification settings: \(settings)")
            guard #available(iOS 12.0, *), settings.authorizationStatus == .provisional ||
            settings.authorizationStatus == .authorized else {
                return
            }

            DispatchQueue.main.async {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        print("Reaching Did register for remote notifications")
        // handle your own device token handling here
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        print("Reaching Did receive notification response")
        // handle how your app reacts to receiving a push notification while it is running in foreground
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        print("Reaching Will present notification")
        // handle how you want your notification to be presented while the app is running in foreground
    }
}
```

The Ometria SDK will automatically source all the required tokens and provide them to the backend.

This way your app will start receiving notifications from Ometria. Handling those notifications while the app is running in the foreground is up to you. When the app is in the background or has been quit, iOS displays the notification automatically.

## Handling Push Notifications

Both options below require a Notification Service Extension target with the App Group configured — see [Notification Service Extension](./notification-service-extension.md) for the prerequisites. The difference is whether you call into Ometria's helper from inside your own NSE (Option 1) or subclass Ometria's NSE class (Option 2).

:::warning[App Group Identifier]

The App Group identifier configured in your Notification Service Extension **must match** the one configured in your main app. A mismatch will prevent the extension from accessing Ometria's shared data and notifications will not be tracked.

:::

### Option 1: Call `handleNotification` from your own NSE (Recommended)

`OmetriaNotificationProcessor.handleNotification` is a static helper you can call from inside your own `NotificationService.didReceive` to delegate notification processing to Ometria without subclassing `OmetriaNotificationServiceExtension`. This is the composition-friendly path that plays well with other SDKs (Firebase, etc.) that also need to process notifications.

#### Usage

```swift
import UserNotifications
import Ometria

class NotificationService: UNNotificationServiceExtension {
    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        let ometria = Ometria.initializeForExtension(appGroupIdentifier: "YOUR_APP_GROUP_IDENTIFIER")
        OmetriaNotificationProcessor.handleNotification(
            request,
            using: ometria,
            contentHandler: contentHandler
        )
    }
}
```

**What this gives you:**

* Ometria intercepts the notification and tracks the received event
* Media content (images, videos) attached to notifications is displayed correctly
* You don't have to subclass `OmetriaNotificationServiceExtension`, so the same NSE can host logic for other SDKs

### Option 2: Subclass `OmetriaNotificationServiceExtension`

If your NSE only needs to process Ometria notifications, you can subclass `OmetriaNotificationServiceExtension` and override `instantiateOmetria()`. The SDK takes care of calling `handleNotification` for you.

See [Notification Service Extension](./notification-service-extension.md) for the full setup, including creating the App Group and overriding `instantiateOmetria()`.

**Result:**

* Rich media content (images, videos) will be displayed in notifications
* Notifications can be tracked even if the user hasn't opened the app

## Next steps

- [Notification Service Extension](./notification-service-extension.md) - Set up the NSE for rich content and background tracking
- [Handling Notification Interaction](./handling-interaction.md) - Handle URLs and tracking info in notifications
