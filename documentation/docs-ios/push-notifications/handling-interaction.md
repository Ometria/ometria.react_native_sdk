---
sidebar_position: 3
title: Handling Notification Interaction
---

# Handling interaction with notifications

Ometria allows you to send URLs and tracking info alongside your push notifications and allows you to handle them on the device.

By default, the Ometria SDK automatically handles any interaction with push notifications that contain URLs by opening them in a browser.

However, it enables developers to handle those URLs as they see fit (e.g. take the user to a specific screen in the app).

To get access to those interactions and the URLs, implement the `OmetriaNotificationInteractionDelegate`.

This is what it would look like in code:

```swift
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate,  OmetriaNotificationInteractionDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        Ometria.initialize(apiToken: "YOUR_API_KEY")
        Ometria.sharedInstance().notificationInteractionDelegate = self

        return true
    }

    // This method will be called each time the user interacts with a notification from Ometria
    // Write your own custom code in order to properly redirect the app to the screen that should be displayed.
    func handleOmetriaNotificationInteraction(_ notification: OmetriaNotification) {
        print(notification.deepLinkActionUrl)
    }
}
```

The `OmetriaNotification` object also provides access to other fields in the notification payload, including custom tracking properties that you choose to send.

One can access all of these fields in the above-mentioned method.

If for some reason developers need access to the `OmetriaNotification` object in a context other than the OmetriaNotificationInteractionDelegate, Ometria SDK provides a method called `parseNotification(_ content:UNNotificationContent)` for this purpose:

```swift
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate,  OmetriaNotificationInteractionDelegate {

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        let notificationContent = notification.request.content
        let ometriaNotification = Ometria.sharedInstance().parseNotification(notificationContent)
        completionHandler([.alert, .sound])
    }
}
```
