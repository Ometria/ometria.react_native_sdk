---
sidebar_position: 1
title: Setup
---

# Push Notifications Setup

Ometria uses [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) to send push notifications to the mobile devices. Ometria can send personalised notifications for your mobile application. Follow these steps:

- Set up a [Firebase](https://firebase.google.com/docs/cloud-messaging) account and connect it to Ometria
- Enable Cloud Messaging on your Firebase account
- Declare the `POST_NOTIFICATIONS` runtime permission (Android 13+)
- Configure push notifications in your application

Follow [Firebase's Get Started tutorial](https://firebase.google.com/docs/android/setup) or use the Firebase Cloud Messaging wizard in Android studio.
Ometria requires firebase-messaging, we recommend using the latest version.

Add the following to your build.gradle, if not already present:

```gradle
implementation 'com.google.firebase:firebase-messaging:24.1.0'
```

Android 13 (API level 33) and higher requires a runtime permission for sending push notifications. If you target Android 13 or higher
please declare the permission in your AndroidManifest file and complete the process of requesting the runtime permission.

Find more about Notification runtime permission [here](https://developer.android.com/develop/ui/views/notifications/notification-permission).

## Option 1 - Reference OmetriaFirebaseMessagingService in AndroidManifest file

You can use this implementation in a scenario where the only push notifications received by your app are the Ometria ones.

Then, all you have to do is to reference the **OmetriaFirebaseMessagingService** inside your **AndroidManifest** file:

```xml
<service
    android:name="com.android.ometriasdk.notification.OmetriaFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

Ometria SDK will handle intercepting and displaying push notifications out of the box.

## Option 2

You can use this implementation when your app should receive other push notifications as well as the Ometria ones.

Create your own `Service` class that extends the `OmetriaFirebaseMessagingService`.

You will have to override the next base class methods and call `super`:

```kotlin
override fun onMessageReceived(remoteMessage: RemoteMessage) {
    super.onMessageReceived(remoteMessage)
}

override fun onNewToken(token: String) {
    super.onNewToken(token)
}
```
Now reference your `Service` inside the `AndroidManifest` file:

```xml
<service
    android:name=".YourFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```
Ometria SDK handles intercepting and displaying Ometria specific push notifications and you can manage the rest of them.

**In case your own** `Service` **needs to extend another** `FirebaseMessagingService` **subclass and you cannot extend** `OmetriaFirebaseMessagingService`, you will have to provide Ometria SDK with the `remoteMessage` and `token` so it can handle Ometria specific push notifications.

Do this by calling `onMessageReceived(remoteMessage)` and `onNewToken(token)` from your overridden base class methods:

```kotlin
override fun onMessageReceived(remoteMessage: RemoteMessage) {
    super.onMessageReceived(remoteMessage)

    Ometria.instance().onMessageReceived(remoteMessage)
}

override fun onNewToken(token: String) {
    super.onNewToken(token)

    Ometria.instance().onNewToken(token)
}
```
