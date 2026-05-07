---
sidebar_position: 2
title: Handling Interaction
---

# Handling interaction with notifications that contain URLs

Ometria allows you to send URLs and tracking info alongside your push notifications and allows you to handle them on the device.

By default, the Ometria SDK automatically handles notification interactions containing URLs by launching an ACTION_VIEW intent for the URL. The link is opened by any application on the device capable of handling it (e.g., a browser or an app registered for the corresponding deep link).

However, it enables developers to handle those URLs as they see fit (e.g. take the user to a specific screen in the app).

To get access to those interactions and the URLs, implement the `OmetriaNotificationInteractionHandler`

There is only one method that is required, and it will be triggered every time the user taps on a notification that has a deepLink action URL.

This is what it would look like in code:

```kotlin
class SampleApp : Application(), OmetriaNotificationInteractionHandler {
    companion object {
        lateinit var instance: SampleApp
    }

    override fun onCreate() {
        super.onCreate()
        instance = this

        // Initializing Ometria SDK with application context, api token and notifications icon resource id
        // Note: Replace api token with your own
        Ometria.initialize(
            this,
            "YOUR_API_KEY",
            R.mipmap.ic_launcher
        ).loggingEnabled(true)

        // Set the notificationInteractionDelegate in order to provide actions for
        // notifications that contain a deepLink URL.
        // The default functionality when you don't assign a delegate is opening urls in a browser
        Ometria.instance().notificationInteractionHandler = this
    }

    /**
     * This method will be called each time the user interacts with a notification from Ometria.
     * Write your own custom code in order to properly redirect the app to the screen that should be displayed.
     */
    override fun onNotificationInteraction(ometriaNotification: OmetriaNotification) {
        Log.d(SampleApp::class.java.simpleName, "URL: ${ometriaNotification.deepLinkActionUrl}")
    }
}
```

The `OmetriaNotification` object also provides access to other fields in the notification payload, including custom tracking properties that you choose to send.

If for some reason developers need access to the `OmetriaNotification` object in a context other than the OmetriaNotificationInteraction, Ometria SDK provides a
method called `fun parseNotification(remoteMessage: RemoteMessage)` for this:

```kotlin
override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val ometriaNotification = Ometria.instance().parseNotification(remoteMessage)
    }
```
