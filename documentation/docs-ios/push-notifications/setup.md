---
sidebar_position: 1
title: Setup
---

# Push notifications guide

When correctly set up, Ometria can send personalised notifications for your mobile application.

Follow these steps:

1. Enable your app to receive push notifications by creating an appId and enabling the push notifications entitlement.
2. Set up a [Firebase](https://firebase.google.com/docs/cloud-messaging) account and connect it to Ometria.
3. Enable Cloud Messaging on your Firebase account and provide your application's **SSL push certificate**.
4. Configure push notifications in your application.
5. Add a **Notification Service Extension** to your app in order to enable receiving rich content notifications.

:::info
Although on Android you are allowed to change what icon is displayed on push notifications, Apple is being more restrictive in this sense. Therefore, push notifications on iOS and ipadOS always use the application icon, and the only changes in layout can be done by user controlled preferences. To find out more about this, see [Notifications Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/components/system-experiences/notifications)
:::

## Configure push notifications in your application

Before continuing, you must have already configured:

* The Ometria SDK
* Firebase

Once you managed to properly create or modify your application to support push notifications, you can move on to configure everything in your AppDelegate like so:

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

This way your app will start receiving notifications from Ometria. Handling those notifications while the app is running in the foreground is up to you.

## Handling Push Notifications

### **Option 1: Using `handleNotification` Method (Recommended)**

Ometria provides a `handleNotification` method that wraps all the SDK's notification-handling logic into a single call. You still need to create a Notification Service Extension and configure the App Group (see [Notification Service Extension](./notification-service-extension.md) for the prerequisites) — this method just lets you replace the body of your `NotificationService.didReceive(_:withContentHandler:)` with a one-liner that delegates to Ometria.

#### Usage:

```swift
func handleNotification(
    _ request: UNNotificationRequest,
    using ometria: Ometria,
    contentHandler: @escaping (UNNotificationContent) -> Void
)
```

**Explanation:**
* This method gives you the same functionality as a hand-written Notification Service Extension:
* Ometria can intercept the notification
* Media content (images, videos) attached to notifications will be displayed correctly
* You don't have to write the NSE logic yourself — just call this method from inside your `NotificationService` subclass
* Ideal for apps that want to keep the setup simple while still supporting rich notifications

### **Option 2: Using Notification Service Extension**

For apps that require background processing of notifications (for example, when the user hasn't opened the app), you can use a Notification Service Extension. See [Notification Service Extension](./notification-service-extension.md) for the full setup.

## Next steps

- [Notification Service Extension](./notification-service-extension.md) - Set up the NSE for rich content and background tracking
- [Handling Notification Interaction](./handling-interaction.md) - Handle URLs and tracking info in notifications
