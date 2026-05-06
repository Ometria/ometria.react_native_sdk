1\. Why integrate Ometria in a mobile app?
------------------------------------------

Ometria helps your marketing department understand and better engage with your customers by delivering personalised emails and push notifications.

The app has two key objectives:

1. Getting information about customers (what do they like?)
2. Reaching out to customers (saying the right thing to the right people).

For your mobile app, this means:

1. Tracking customer behaviour through events - handled by Ometria.
2. Sending and displaying push notifications - requires the app developers.

2\. Before you begin
----------------------

See [Setting up your mobile app with Firebase credentials](https://support.ometria.com/hc/en-gb/articles/360013658478-Setting-up-your-mobile-app-with-Firebase-credentials) in the Ometria help centre and follow the steps there to get an API key.

3\. Install the library
-----------------------

### Step 1 - Add the Ometria-android library as a gradle dependency:

We publish builds of our library to the **Maven central repository** as an .aar file. 

This file contains all of the classes, resources, and configurations that you'll need to use the library. 

To install the library inside **Android Studio**, declare it as dependency in your app level `build.gradle` file: 

```gradle
dependencies {
    implementation 'com.ometria:android-sdk:1.11.2'
}
```

### Step 2 - Perform Gradle Sync:

Perform a **Gradle Sync** to build your project and incorporate the dependency additions noted above:

![Screenshot 2020-08-13 at 16 47 21](https://user-images.githubusercontent.com/8706456/91582697-d51c0a80-e958-11ea-96eb-46f0d49c3d59.png)

This downloads the aar dependency, giving you access to the Ometria library API calls. 

If it can’t find the dependency, you should make sure you've specified `mavenCentral()` as a repository in your `build.gradle`.

4\. Initialise the library
--------------------------
Once you've set up your build system or IDE to use the Ometria library, you can initialise it in your code. 

We recommend initialising the SDK in your Application subclass. You’ll need to provide:
* the application context;
* your Ometria API token;
* the notifications icon;
* the notifications color (optional), and;
* the notifications channel name (optional).

```kotlin
Ometria.initialize(
    application = this,
    apiToken = "YOUR_API_TOKEN",
    notificationIcon = R.drawable.ic_notification_nys,
    notificationColor = ContextCompat.getColor(this, R.color.colorAccent),
    notificationChannelName = "Custom Channel Name"
)
```

Ometria logs any errors encountered during runtime by default. 

You can enable advanced logging if you want more information on what’s happening in the background. Just add the following line after initialising the library:

```kotlin
Ometria.initialize(
    application = this,
    apiToken = "YOUR_API_TOKEN",
    notificationIcon = R.drawable.ic_notification_nys
).loggingEnabled(true)
```

### Using multiple Ometria API tokens within the same app instance (Reinitializing the SDK)

There are cases where different flows of an application should log events under different tokens (think of different user roles, or other similar scenarios). 
To address this, we offer the possibility of reinitializing the Ometria SDK. Although we currently do not keep references to multiple instances of the SDK, 
we ensure that on reinitialization there will be a flush attempt for all the events that have been logged up to that point on the old instance.

Reinitializing the SDK requires the exact steps as a normal initialization.

5\. Event tracking guide
------------------------
You need to be aware of your users’ behaviour on your platforms in order to understand them. Some behaviour is automatically detectable, other events need work from the app developer to track.

Many of these methods have analogous events in a server-to-server API called the [Ometria Data API] (https://support.ometria.com/hc/en-gb/articles/360011511017-Data-API-introduction), and through a separate JavaScript API. 

**Be aware**: If your business already integrates with Ometria in any way, it is very important that the values sent here correspond to those in other integrations.

E.g., the customer identified event takes a customer ID - that ID must be the same here as it is in the data API. 

The events are merged on Ometria's side into one big cross-channel view of your customer behaviour, which will otherwise get very messy.

### Manually tracked events

Once the SDK is initialised, you can track an event by calling its dedicated method:

```kotlin
val myItem = OmetriaBasketItem(
        productId = "product-1",
        sku = "sku-product-1",
        quantity = 1,
        price = 12.0f,
        variantId = "variant-id-1"
)
val myItems = listOf(myItem)
val basket = OmetriaBasket(
        id = "id-1",
        totalPrice = 12.0f,
        currency = "USD",
        items = myItems,
        link = "www.example.com"
)

Ometria.instance().trackBasketUpdatedEvent(basket = basket)
```

#### Profile identified

An app user has just identified themselves, i.e. logged in.

```kotlin
trackProfileIdentifiedByCustomerIdEvent(customerId: String, storeId: String? = null)
```

Their **customer ID** is their **user ID** in your database.

Sometimes a user only supplies their email address without fully logging in or having an account. In that case, Ometria can profile match based on email:

```kotlin
trackProfileIdentifiedByEmailEvent(email: String, storeId: String? = null)
```

Having a **customerId** makes profile matching more robust. 

It’s not mutually exclusive with sending an email event; for optimal integration you should send either event as soon as you have the information.

These two events are pivotal to the functioning of the SDK, so make sure you send them as early as possible.

#### Profile deidentified

Undo a **profileIdentified** event.

Use this if a user logs out, or otherwise signals that this device is no longer attached to the same person.

```kotlin
trackProfileDeidentifiedEvent()
```

#### Update store identifier

Ometria supports multiple stores for the same ecommerce platform (e.g. separate stores for different countries).
There are three different ways to update the store identifier:

1. Using an optional parameter in the `profileIdentified` events tracking methods

```kotlin
trackProfileIdentifiedByCustomerIdEvent(customerId: String, storeId: String? = null)
trackProfileIdentifiedByEmailEvent(email: String, storeId: String? = null)
```

When omitting the `storeId` parameter, or providing a `null` value, the store identifier will not be affected in any way. Only sending a valid, non-null parameter will cause the store identifier to be updated to that value.

2. Using the dedicated method that allows setting/resetting the store identifier

```kotlin
updateStoreId(storeId: String?)
```

* with a null `storeId` parameter, the method resets the store identifier.
* with a non-null `storeId` parameter, the method sets the store identifier to the provided value.

3. Using the `profileDeidentified` event
Tracking a profile deidentified event, will reset the `customerId`, the `email`, and the `storeId` for the current app installment.


#### Product Viewed

A visitor clicks / taps / views / highlights or otherwise shows interest in a product.

E.g. the visitor searches for a term and selects one of the product previews from a set of results, or browses a category of clothes, and clicks on a specific shirt to see a bigger picture. 

This event is about capturing interest from the visitor for this product.


```kotlin
trackProductViewedEvent(productId: String)
```

The product details must be sent to Ometria separately, e.g. using the server-to-server data API, or an eCommerce platform integration (like Shopify).

The value is opaque, and is only used to create segments and automation campaigns in the Ometria app. 

Use non-localised, predictable, human readable slugs. E.g. "womens-footwear".

#### Basket viewed

The user has viewed a dedicated page, screen or modal with the contents of the shopping basket.

```kotlin
trackBasketViewedEvent()
```

#### Basket updated

The user has changed their shopping basket.

```kotlin
trackBasketUpdatedEvent(basket: OmetriaBasket)
```

This event takes the full current basket as a parameter - not just the updated parts.

This helps recover from lost or out of sync basket events: the latest update is always authoritative.

#### Checkout started

The user has started the checkout process.

```kotlin
trackCheckoutStartedEvent(orderId: String)
```

#### Order completed

The order has been completed and paid for.

```kotlin
trackOrderCompletedEvent(orderId: String, basket: OmetriaBasket)
```

#### Deep link opened
Based on the implementation status of interaction with notifications that contain deeplinks, this event can be automatically tracked or not.

The default implementation will automatically log a deep link opened event every time the user interacts with a notification that has a deep link. This is possible because we know that the default implementation will open the link in a browser.

If you chose to handle deep links yourself (see: [Handling interaction with notifications that contain URLs](#handling_interaction_with_notifications_that_contain_urls)) then you should manually track this event when you have enough information about the screen (or other destination) that the app will open.

```kotlin
trackDeepLinkOpenedEvent(link: String, page: String)
```

#### View home page

The user views the "home page" or landing screen of your app:

```kotlin
trackHomeScreenViewedEvent()
```

#### View list of products

The visitor clicks/taps/views/highlights or otherwise shows interest in a product listing. This kind of screen includes search results, listings of products in a group, category, collection or any other screen that presents a list of products.

E.g., A store sells clothing, and the visitor taps on "Women's Footwear" to see a list of products in that category, or they search for "blue jumper" and see a list of products in that category.

This event should be triggered on:

* search results
* category lists
* any similar screens

```kotlin
trackProductListingViewedEvent(listingType: String? = null, listingAttributes: Map<String, Any> = mapOf())
```

The `listingType` parameter can be any string the client chooses (currently has no effect, but helps us and the client to see what kind of listing page the user viewed). We recommend setting this to "category" for example for category pages or "search" for a search results page.
The `listingAttributes` parameter should be an object that consists of 2 fields:
* "type" which should be an attribute that exists in the Ometria database. For example "shoe-colour".
* "id" which should be an attribute their_id that exists in the Ometria database. For example "red".

Both "id" and "type" are needed to correctly specify attributes.

#### Screen viewed

Tracking a visitor’s independent screen views helps us track their engagement with the app, as well as where they are in a journey. 

An analogous event on a website would be to track independent page views.

The common eCommerce screens all have their own top-level event: basket viewed, list of products viewed, etc. 

Your app may have a specific type of page that is useful for marketers to track engagement with. 

E.g. if you’re running a promotion, and viewing a specific screen indicates interest in the promotion, which marketing might later want to follow up on. 
To track these custom screens, use the **Screen viewed** event:

```kotlin
trackScreenViewedEvent(screenName: String, additionalInfo: Map<String, Any> = mapOf())
```

For example:

```kotlin
trackScreenViewedEvent("promotion", mapOf("promotion-id" to "summer-2020"))
```

#### Custom events

Your app might have specific flows or pages that are of interest to the marketing team.

E.g. Marketing might want to send an email or notification to any user who signed up for a specific promotion, or interacted with a button or specific element of the app. 

If you send a custom event corresponding to that action, they will be able to trigger an [automation campaign](https://support.ometria.com/hc/en-gb/articles/360011378398-Automation-campaigns-overview) on it.

Check with the marketing team about the specifics, and what they might need. Especially if they're already using Ometria for email, they will know about automation campaigns and custom events.

```kotlin
trackCustomEvent(customEventType: String, additionalInfo: Map<String, Any> = mapOf())
```

### `OmetriaBasket`

An object that describes the contents of a shopping basket.

#### Properties

* `id`: (`String`, optional) - A unique identifier for this basket.
* `currency`: (`String`, required) - A string representing the currency in ISO currency format. e.g. `"USD"`, `"GBP"`.
* `totalPrice`: (`float`, required) - A float value representing the pricing.
* `items`: (`Array[OmetriaBasketItem]`) - An array containing the item entries in this basket.
* `link`: (`String`, optional) - A deeplink to the web or in-app page for this basket. Can be used ina notification sent to the user, e.g. "Forgot to check out? Here's
                       your basket to continue: <link>". Following that link should take them straight to the basket page.

### `OmetriaBasketItem`

An object that describes the contents of a shopping basket. 

It can have its own price and quantity based on different rules and promotions that are being applied.

#### Properties

* `productId`: (`String`, required) - A string representing the unique identifier of this product.
* `sku`: (`String`, optional) - A string representing the stock keeping unit, which allows identifying a particular item.
* `quantity`: (`Int`, required) - The number of items that this entry represents.
* `price`: (`Float`, required) - Float value representing the price for one item. The currency is established by the OmetriaBasket containing this item.
* `variantId`: (`String`, optional) - An identifier for a variant product associated with this line item.

### Automatically tracked events

The following events are automatically tracked by the SDK.

Linking and initialising the SDK is enough to take advantage of these; no further integration is required.

| Events        | Description   |
| ------------- |---------------| 
| **Application installed**| The app was just installed. Usually can't be sent when the app is actually installed, but instead only sent the first time the app is launched.|
| **Application launched**| Someone has just launched the app.|  
| **Application foregrounded** | The app was already launched, but it was in the background. It has just been brought to the foreground.|
| **Application backgrounded** | The app was in active use and has just been sent to the background.|
| **Push token refreshed** | The push token generated by Firebase has been updated.|
| **Notification recieved** | A Push notification was received by the system.|
| **Notification interacted** | The user has just clicked on / tapped on / opened a notification.|
|**Error occurred** | An error occurred on the client side. We try to detect any problems with actual notification payload on our side, so we don't expect any errors which need to be fed back to end users.|

### Flush tracked events

In order to reduce power and bandwidth consumption, the Ometria library doesn’t send the events one by one unless you request it to do so. 

Instead, it composes batches of events that are sent to the backend during application runtime when the one of the following happened:
* it has collected 10 events or
* there was a firebase token refresh (`pushtokenRefreshed` event)
* a `notificationReceived` event
* an `appForegrounded` event
* an `appBackgrounded` event

You can request the library to send all remaining events to the backend whenever you want by calling:

```kotlin
Ometria.instance().flush()
```

### Clear tracked events

You can completely clear all the events that have been tracked and not yet flushed. In order to do so you simply have to call the following method:

```kotlin
Ometria.instance().clear()
```

### Debugging events
To see what events were captured, you can check the logs coming from the Ometria SDK, if logging is enabled. You can filter for the word "Ometria".
The SDK logs all events as they happen, and also logs the flushing i.e. when they are sent to the Ometria mobile events API. Any potential errors with the sending (API issues or event validation issues) would be visible here too.

6\. Push notifications guide
----------------------------

Ometria relies on Firebase Cloud Messaging in order to send push notifications to the mobile devices.

Follow [Firebase's Get Started tutorial](https://firebase.google.com/docs/android/setup) or use the Firebase Cloud Messaging wizard in Android studio. 
Ometria requires firebase-messaging, we recommend using the latest version. 

Add the following to your build.gradle, if not already present:

```gradle
implementation 'com.google.firebase:firebase-messaging:24.1.0'
```

Android 13 (API level 33) and higher requires a runtime permission for sending push notifications. If you target Android 13 or higher
please declare the permission in your AndroidManifest file and complete the process of requesting the runtime permission.

Find more about Notification runtime permission [here](https://developer.android.com/develop/ui/views/notifications/notification-permission).

### Option 1 - Reference OmetriaFirebaseMessagingService in AndroidManifest file

You can use this implementation in a scenario where the only push notifications received by your app are the Ometria ones.

Then, all you have to do is to reference the **OmetriaFirebaseMessagingService** inside your **AndroidManifest** file:

```xml
<service
    android:name="com.android.ometriasdk.notification.OmetriaFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING\_EVENT" />
    </intent-filter>
</service>
```

Ometria SDK will handle intercepting and displaying push notifications out of the box.

### Option 2

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
        <action android:name="com.google.firebase.MESSAGING\_EVENT" />
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

### Handling interaction with notifications that contain URLs

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
            "YOUR_API_TOKEN",
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

7\. App links guide
----------------------------

Ometria sends personalised emails with URLs that point back to your website. In order to open these URLs inside your application, make sure you follow this guide.

### Pre-requisites

First, make sure you have an SSL-enabled Ometria tracking domain set up for your account. You may already have this for
your email campaigns, but if not ask your Ometria contact to set one up, and they should provide you with the domain.

### Handle App Links inside your application

To add Android App Links to your app, define intent filters that open your app content using HTTP URLs. Intent filters for incoming links
will be added inside your **AndroidManifest** file, the following XML snippet is an example (assuming "clickom.omdemo.net" is the tracking domain):

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />

    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />

    <data
        android:host="clickom.omdemo.net"
        android:scheme="https" />
</intent-filter>
```

This will ensure that when your customers click on links in Ometria emails, your app opens instead of the browser.

**Note:** This does not associate your website's domain with the app, only the tracking domain.

Find more about Android App Links [here](https://developer.android.com/training/app-links/verify-site-associations).

### Create a digital asset links JSON file and send it to your Ometria contact.

The Digital Asset Links JSON file is used to create a relationship between a domain and your app. [You can find more info about it here](https://developer.android.com/training/app-links/verify-site-associations#web-assoc).
A basic example should look like this:

```javascript
[
  {
    "relation": [ "delegate_permission/common.handle_all_urls" ],
    "target": {
      "namespace": "android_app",
      "package_name": "com.android.sample",
      "sha256_cert_fingerprints": ["51:5B:24:4B:C7:A4:7F:D2:FA:B2:C7:23:73:7A:A0:91:A5:B6:29:49:08:73:E1:51:7E:CF:60:28:53:65:47:25"]
    }
  }
]
```

Save it and name it "assetlinks.json". Then send it to your Ometria contact - we will upload this for you so that it will be available behind the
tracking domain.

### Process App Links inside your application

The final step is to process the URLs in your app and take the user to the appropriate sections of the app. Note that
you need to implement the mapping between your website's URLs and the screens of your app.

See also [Linking push notifications to app screens](https://support.ometria.com/hc/en-gb/articles/4402644059793-Linking-push-notifications-to-app-screens).

If you are dealing with normal URLs pointing to your website, you can decompose it into different path components and parameters. This will allow you to source the required information to navigate through to the correct screen in your app.

However, Ometria emails contain obfuscated tracking URLs, and these need to be converted back to the original URL, pointing to your website, before you can map the URL to an app screen. To do this, the SDK provides a method called `processAppLink`:

```kotlin
private fun handleAppLinkFromIntent() {
    // you can check here whether the URL is one that you can handle without converting it back
    intent.dataString?.let { url ->
        Ometria.instance().processAppLink(url, object : ProcessAppLinkListener {
            override fun onProcessResult(url: String) {
                // you can now handle the retrieved url as you would any other url from your website
            }

            override fun onProcessFailed(error: String) {
                // an error may have occurred
            }
        })
    }
}
```

**Warning**: The method above runs asynchronously. Depending on the Internet speed on the device, processing time can vary. For best results, you could implement a loading state that is displayed while the URL is being processed.

If you have done everything correctly, the app should now be able to open app links and allow you to handle them inside the app.
