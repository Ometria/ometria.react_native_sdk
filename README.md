1\. Why integrate Ometria in a mobile app?
------------------------------------------

Ometria helps your marketing department understand and better engage with your customers by delivering personalised emails and push notifications.

The app has two key objectives:

1. Getting information about customers (what do they like?)
2. Reaching out to customers (saying the right thing to the right people).

For your mobile app, this means:

1. Tracking customer behaviour through events - a subset of events is automatically handled by the Ometria SDK, but you have to customize it to your needs, see [Creating an event tracking plan for your mobile app](https://support.ometria.com/hc/en-gb/articles/360018440917-Creating-an-event-tracking-plan-for-your-mobile-app).
2. Sending and displaying push notifications - **requires the app developers**.

App developers integrating with this SDK should follow the guide below. You can also look at the Sample app we have included for a reference implementation.

2\. Before you begin
----------------------

See [Setting up your mobile app with Firebase credentials](https://support.ometria.com/hc/en-gb/articles/360013658478-Setting-up-your-mobile-app-with-Firebase-credentials) in the Ometria help centre and follow the steps there to get an API key.

3\. Install the library
-----------------------

The easiest way to get Ometria into your React-Native project is by using `npm install` or `yarn add`.

1. Install Ometria React-Native package from `react-native-ometria` using `npm install react-native-ometria` or `yarn add react-native-ometria`

note: If you have issues with installing the library, please consider excluding the example from typescript config
eg:
```
{
  ...,
  "exclude": ["example"]
} 
```
2. For `iOS` you need to install Pods `pod install` to create a local CocoaPods spec mirror.

3. If you encounter ```The Swift pod 'Ometria' depends upon 'FirebaseMessaging'``` error when running pod install, please consider adding ```use_frameworks! :linkage => :static```.

4\. Initialise the library
--------------------------

To initialise the Ometria SDK, you need to enter the API key from **[2. Before you begin](#2-before-you-begin)**.

```js
import Ometria from 'react-native-ometria'
// Ometria init
await Ometria.initializeWithApiToken('API_KEY', {
  notificationChannelName: 'Example Channel Name', // optional, only for Android
});
```

Make sure you only call this method once in the app. Any other Ometria methods must be called **after** this method.
Once you've called this method once, the SDK will be able to send events to Ometria.
You can now access your instance throughout the rest of your application.

You can specify a custom name of the Android notification channel in the second optional options parameter. Default channel name is `<blank>`.

#### Notifications

Ometria uses [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) to send push notifications to the mobile devices.

You will therefore have to add ‘React-Native Firebase’ as a dependency of Ometria, using the following lines:

```js
import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
```

For **Android** follow the Firebase React-Native tutorial [Firebase for Android](https://rnfirebase.io/#2-android-setup)
For **iOS** follow the Firebase React-Native tutorial [Firebase for iOS](https://rnfirebase.io/#3-ios-setup)

To use push notifications, you also need to follow the steps in [Configure push notifications in your application](#configure-push-notifications-in-your-application)

Read the full Ometria [Push notifications guide](#6-push-notifications-guide-for-react-native-apps)

#### Debugging

Ometria logs any errors encountered during runtime by default, these logs are accessible in your development environment's console.

You can enable advanced logging if you want more information on what’s happening in the background. Just add the following line after initialising the library:

```js
Ometria.isLoggingEnabled(true);
```

4.1\. Firebase 8.0-8.10 issue IOS
---------------------------------

:warning: If using firebase version [8.0 - 8.10] consider updating to firebase 8.11 in order for push notifications to work.
If you have a hard dependency on firebase [8.0 - 8.10] make sure to add the following snippet in your AppDelegate file:
```objc
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  [FIRMessaging.messaging setAPNSToken:deviceToken];
}
``` 

4.2\. Using Firebase 9.x on iOS
---------------------------------

:warning: 
If you are using Firebase 9.x on iOS, make sure you have the following lines in your `/ios/Podfile` file:
```objc
  pod 'FirebaseCore', :modular_headers => true
  pod 'GoogleUtilities', :modular_headers => true 
  pod 'FirebaseMessaging', :modular_headers => true
``` 


5\. Event tracking guide
------------------------

You need to be aware of your users’ behaviour on your platforms in order to understand them. Some behaviour is automatically detectable, other events need work from the app developer to track.

Many of these methods have analogous events in a server-to-server API called the [Ometria Data API](https://support.ometria.com/hc/en-gb/articles/360011511017-Data-API-introduction), and through a separate JavaScript API.

**Be aware:** If your business already integrates with Ometria in any way, it is very important that the values sent here correspond to those in other integrations.

E.g., the customer identified event takes a customer ID or an email - these identifiers must be the same here as it is in the data API. If you specify both email and customer id, both need to match.

The events are merged on Ometria's side into one big cross-channel view of your customer behaviour. If you use inconsistent email/customer ids, this could result in duplicate profiles created or data loss.

### Manually tracked events

Once the SDK is initialised, you can track an event by calling its dedicated method:

```js
const items: OmetriaBasketItem[] = [
  {
    productId: 'product-1',
    sku: 'sku-product-1',
    quantity: 1,
    price: 12.0,
    variantId: 'variant-1',
  },
  {
    productId: 'product-2',
    sku: 'sku-product-2',
    quantity: 2,
    price: 9.0,
    variantId: 'variant-2',
  },
  {
    productId: 'product-3',
    sku: 'sku-product-3',
    quantity: 3,
    price: 20.0,
    variantId: 'variant-3',
  },
];

Ometria.trackBasketUpdatedEvent({
  totalPrice: 12.0,
  id: 'basket_id_eg',
  currency: 'USD',
  items,
  link: 'link_eg'
});
```

#### Profile identified

An app user has just identified themselves, i.e. logged in.

```js
Ometria.trackProfileIdentifiedByCustomerIdEvent('test_customer_id');
```

Their **customer ID** is their **user ID** in your database.

Sometimes a user only supplies their email address without fully logging in or having an account. In that case, Ometria can profile match based on email:

```js
Ometria.trackProfileIdentifiedByEmailEvent('test@gmail.com');
```

Having a **customerId** makes profile matching more robust.

It’s not mutually exclusive with sending an email event; for optimal integration you should send either event as soon as you have the information.
These two events are pivotal to the functioning of the SDK, so make sure you send them as early as possible. Reiterating here that these identifiers must be the same here as the ones you use in your e-commerce platform and you send to Ometria (via the data API or other ways). If you specify both email and customer id, both need to match. A typical error we see at integrations is that the app generates a new customer id on each login (that doesn't match the customer id stored in Ometria). To avoid this, generate these ids centrally on your servers and send consistent ones through the Ometria mobile SDK and the Ometria Data API. If it is impractical to generate consistent ids, we suggest only using email to identify contacts.

#### Profile deidentified

Undo a profileIdentified event.

Use this if a user logs out, or otherwise signals that this device is no longer attached to the same person.

```js
Ometria.trackProfileDeidentifiedEvent();
```

Currently this event clears the stored ids (email and/or customer id) from the phone's local storage. It has no other effect within Ometria.

#### Product viewed

A visitor clicks/taps/views/highlights or otherwise shows interest in a product.

E.g. the visitor searches for a term and selects one of the product previews from a set of results, or browses a category of clothes, and clicks on a specific shirt to see a bigger picture.

This event is about capturing interest from the visitor for this product.

```js
Ometria.trackProductViewedEvent('product_id');
```


#### Basket viewed

The visitor has viewed a dedicated page, screen or modal with the contents of the shopping basket:

```js
Ometria.trackBasketViewedEvent();
```

#### Basket updated

The visitor has changed their shopping basket:

```js
const items: OmetriaBasketItem[] = [
  {
    productId: 'product-1',
    sku: 'sku-product-1',
    quantity: 1,
    price: 12.0,
    variantId: 'variant-1',
  },
  {
    productId: 'product-2',
    sku: 'sku-product-2',
    quantity: 2,
    price: 9.0,
    variantId: 'variant-2',
  },
  {
    productId: 'product-3',
    sku: 'sku-product-3',
    quantity: 3,
    price: 20.0,
    variantId: 'variant-3',
  },
];

Ometria.trackBasketUpdatedEvent({
  totalPrice: 12.0,
  id: 'basket_id_eg',
  currency: 'USD',
  items,
  link: 'link_eg'
});
```

This event takes the full current basket as a parameter - not just the updated parts.

This helps recover from lost or out of sync basket events: the latest update is always authoritative.

#### Checkout started

Track when the user has started the checkout process:

```js
Ometria.trackCheckoutStartedEvent('order_id');
```

#### Order completed

The order has been completed and paid for:

```js
const items: OmetriaBasketItem[] = [
  {
    productId: 'product-1',
    sku: 'sku-product-1',
    quantity: 1,
    price: 12.0,
  }
];

Ometria.trackOrderCompletedEvent('order_id', {
  totalPrice: 12.0,
  id: 'basket_id_eg',
  currency: 'USD',
  items,
  link: 'link_eg'
});
```

#### Deep link opened

Based on the implementation status of interaction with notifications that contain deep links, this event can be automatically tracked or not.

The default implementation automatically logs a deep link opened event every time the user interacts with a notification that has a deep link. This is possible because we know that the default implementation will open the link in a browser.

If you chose to handle deep links yourself (using the guide for [Handling interaction with notifications that contain URLs](#handling-interaction-with-notifications-that-contain-urls)), then you should manually track this event when you have enough information regarding the screen (or other destination) that the app will open.

```js
Ometria.trackDeepLinkOpenedEvent('/profile', 'ProfileScreen');
```

#### View home page

The visitor views the ‘home page’ or landing screen of your app.

```js
Ometria.trackHomeScreenViewedEvent();
```

#### View list of products

The visitor clicks/taps/views/highlights or otherwise shows interest in a product listing. This kind of screen includes search results, listings of products in a group, category, collection or any other screen that presents a list of products.

E.g., A store sells clothing, and the visitor taps on "Women's Footwear" to see a list of products in that category, or they search for "blue jumper" and see a list of products in that category.

This event should be triggered on:

* search results
* category lists
* any similar screens

```js
Ometria.trackProductListingViewedEvent();
```

#### Screen viewed

Tracking a visitor’s independent screen views helps us track their engagement with the app, as well as where they are in a journey.

An analogous event on a website would be to track independent page views.

The common eCommerce screens all have their own top-level event: basket viewed, list of products viewed, etc.

Your app may have a specific type of page that is useful for marketers to track engagement with.

E.g. if you’re running a promotion, and viewing a specific screen indicates interest in the promotion, which marketing might later want to follow up on.

To track these custom screens, use the _Screen viewed_ event:

```js
Ometria.trackScreenViewedEvent('OnboardingScreen', { a: '1', b: '2' });
```

#### Custom events

Your app might have specific flows or pages that are of interest to the marketing team.

E.g. Marketing might want to send an email or notification to any user who signed up for a specific promotion, or interacted with a button or specific element of the app.

If you send a custom event corresponding to that action, they will be able to trigger an [automation campaign](https://support.ometria.com/hc/en-gb/articles/360011378398-Automation-campaigns-overview) on it.

Check with the marketing team about the specifics, and what they might need. Especially if they're already using Ometria for email, they will know about automation campaigns and custom events.

```js
Ometria.trackCustomEvent('my_custom_type', {});
```

### `OmetriaBasket`

An object that describes the contents of a shopping basket.

#### Properties

* `id`: (`String`, optional) - A unique identifier for this basket
* `currency`: (`String`, required) - A string representing the currency in ISO currency format. e.g. `"USD"`, `"GBP"`
* `totalPrice`: (`float`, required) - A float value representing the pricing.
* `items`: (`Array[OmetriaBasketItem]`) - An array containing the item entries in this basket.
* `link`: (`String`) - A deeplink to the web or in-app page for this basket. Can be used in
 a notification sent to the user, e.g. "Forgot to check out? Here's
 your basket to continue: 'https://eg.com/basket_url'". Following that link should take
 them straight to the basket page.

### `OmetriaBasketItem`

An object that describes the contents of a shopping basket.

It can have its own price and quantity based on different rules and promotions that are being applied.

#### Properties

* `productId`: (`String`, required) - A string representing the unique identifier of this product.
* `sku`: (`String`, optional) - A string representing the stock keeping unit, which allows identifying a particular item.
* `quantity`: (`Int`, required) - The number of items that this entry represents.
* `price`: (`Float`, required) - Float value representing the price for one item. The currency is established by the OmetriaBasket containing this item
* `variandId`: (`String`, optional) - An identifier for a variant product associated with this line item.

### Automatically tracked events

The following events are automatically tracked by the SDK.

Linking and initialising the SDK is enough to take advantage of these; no further integration is required.

| Event| Description|
| ------------- |:-------------:|
| **Application installed** | The app was just installed. Usually can't be sent when the app is _actually_ installed, but instead only sent the first time the app is launched. |
| **Application launched** | Someone has just launched the app.|
| **Application foregrounded** | The app was already launched, but it was in the background. It has just been brought to the foreground.|
| **Application backgrounded** | The app was in active use and has just been sent to the background. |
| **Push token refreshed** | The push token generated by Firebase has been updated. |
| **Notification received** | A Push notification was received by the system. |
| **Notification interacted** | The user has just clicked on / tapped on / opened a notification. |
| **Error occurred** | An error occurred on the client side. We try to detect any problems with actual notification payload on our side, so we don't expect any errors which need to be fed back to end users. |

### Flush tracked events

In order to reduce power and bandwidth consumption, the Ometria library doesn’t send the events one by one unless you request it to do so.

Instead, it composes batches of events that are sent to the backend during application runtime when the one of the following happened:
* it has collected 10 events or
* there was a firebase token refresh (`pushtokenRefreshed` event)
* a `notificationReceived` event
* an `appForegrounded` event
* an `appBackgrounded` event

You can request the library to send all remaining events to the backend whenever you want by calling:

```js
Ometria.flush()
```

### Clear tracked events

You can completely clear all the events that have been tracked and not yet flushed.

To do this, call the following method:

```js
Ometria.clear()
```

### Debugging events
To see what events were captured, you can check the logs coming from the Ometria SDK, if logging is enabled. You can filter for the word "Ometria".
The SDK logs all events as they happen, and also logs the flushing i.e. when they are sent to the Ometria mobile events API. Any potential errors with the sending (API issues or event validation issues) would be visible here too.

6\. Push notifications guide for React-Native apps
----------------------------

When correctly set up, Ometria can send personalised notifications for your mobile application.

Follow these steps:

1. Enable your app to receive push notifications by creating an appId and enabling the push notifications entitlement.
2. Set up a [Firebase](https://firebase.google.com/docs/cloud-messaging) account and connect it to Ometria.
3. Enable Cloud Messaging on your Firebase account and provide your application’s **SSL push certificate**.
4. Configure push notifications in your application.
5. Add a **Notification Service Extension** to your app in order to enable receiving rich content notifications.

### I. Configure push notifications in your application

Before continuing, you must have already configured:

* The Ometria SDK must be initialised
* Firebase must be configured and added to your project

Read more about those steps in section [4\. Initialise the library](#4-initialise-the-library)

#### - Forward the push token to Ometria
After Ometria initialisation, you **must forward the Firebase Push Notification token** (both iOS and Android).

You also have to forward the push notification token to Ometria every time it is refreshed.

```js
import Ometria from 'react-native-ometria';
import messaging from '@react-native-firebase/messaging';
// ...
// Initialize the Ometria SDK
await Ometria.initializeWithApiToken('API_KEY');
// ...
messaging()
      .getToken()
      .then(pushToken => Ometria.onNewToken(pushToken));

messaging().onTokenRefresh(pushToken => Ometria.onNewToken(pushToken));
```

#### - Request permission to receive Push Notifications

For **Android 13** (API level 33) and higher you first have to declare the permission in your AndroidManifest.xml file:
```xml
<manifest ...>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    <application ...>
        ...
    </application>
</manifest>
```


On iOS you can request permissions using Firebase Cloud Messaging. <br>
On Android, Firebase Messaging [doesn't support this yet](https://github.com/invertase/react-native-firebase/issues/6283). You can use [react-native-permissions](https://github.com/zoontek/react-native-permissions) instead. E.g.:


```js
import {requestNotifications } from 'react-native-permissions';
...
if (Platform.OS === 'android') {
  await requestNotifications([]);
}

if (Platform.OS === 'ios') {
  await messaging().requestPermission({
    sound: true,
    badge: true,
    alert: true,
  });
}
```
Find more about Notification runtime permissions on Android [here](https://developer.android.com/develop/ui/views/notifications/notification-permission)
#### - Handling remote messages on iOS

The Ometria SDK will automatically handle remote background messages and provide them to the backend.
This way your app will start receiving notifications from Ometria. 
Handling those notifications while the app is running in the foreground or additional handling is up to you.

#### - Handling remote messages on Android

For Android you need to call Ometria.onMessageReceived when you get a message from Firebase, e.g.:
```js
const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
    if (Platform.OS === "android") {
      Ometria.onMessageReceived(remoteMessage);
    }
});
```

For a complete example and use case please consult the [Sample app](example/src/App.tsx).

### II. Handling interaction with notifications that contain URLs

Ometria allows you to send URLs and tracking info alongside your push notifications and allows you to handle them on the device.

By default, the Ometria SDK automatically handles any interaction with push notifications that contain URLs by opening them in a browser.

However, it enables developers to handle those URLs as they see fit (e.g. take the user to a specific screen in the app).

To get access to those interactions and the URLs, implement the ``` Ometria.onNotificationInteracted() ```

The response object will look like this:
```json
{
  "imageUrl": "https://...imageURL.png", # images are currently not supported, this is a placeholder
  "deepLinkActionUrl": "https://...website", # the url configured in the push notifications node your automation campaign
  "campaignType": "trigger", # this is always trigger, representing automation campaigns. Included as a placeholder
  "externalCustomerId": "123Test", # the customer id in your database for this contact
  "sendId": "61dae09c4fc04640aa4f92bc769112e5", # unique id for the notification
  "tracking": { # these can be overridden / added in your automation campaign's settings / Tracking parameters field
    "utm_medium": "push", # default for push
    "utm_source": "transactional",
    "utm_campaign": "om_7b627d38b69a_my_campaign",  # generated by default from campaign hash and title
    "om_campaign": "om_7b627d38b69a_2098_ebrao01q" # generated by default from campaign hash, campaign version and node id
    "additional_tracking_data": "value 1", # you can add more in your automation campaign's settings / Tracking parameters field
    ...
  }
}
```

Eg:

``` js
  Ometria.onNotificationInteracted((response: OmetriaNotificationData) => {
    // Handle Ometria notification interaction response (both iOS & Android). Eg:
    if (response.deepLinkActionUrl) {
      Linking.openURL(response.deepLinkActionUrl);
    }
  });
```

**Note:** As of version 2.0.0 `Ometria.onNotificationInteracted` requires a callback function parameter that handles the interaction response. 
Usage of `.then().catch()` that was used in 1.x.x no longer works! Please use a callback instead.

### III. Enabling rich content notifications (iOS only)

For **iOS** you have to integrate the rich content notification support directly in the Xcode project.

Starting with iOS 12.0, Apple enabled regular applications to receive and display notifications that contain media content such as images.

Ometria uses this feature to further enhance your application, but it requires you to add a new target extension that intercepts all push notifications containing 'mutable-content: 1' in the payload.

To do this, go to **File > New > Target**, and select **Notification Service Extension > Next**.

![](https://raw.githubusercontent.com/wiki/Ometria/ometria.ios_sdk/images/notification_service_extension.png)

A new item displays in your target list:

![](https://raw.githubusercontent.com/wiki/Ometria/ometria.ios_sdk/images/project_targets.png)

Next, make sure that the Ometria SDK is also available to this new target by updating your podfile to include your newly added target and specify Ometria as a dependency.

**Warning**: If you try to run pod install and then build the extension, you will get some compilation errors.

Since we are trying to run Ometria on an extension, there are several methods in the SDK that are not supported, although not being used.

To silence those errors and get everything functional you will have to update your podfile ending up with something like this:

```ruby
 platform :ios, '10.0'

target 'OmetriaSample' do
  use_frameworks!

  pod 'Ometria', :path => '../../SDK'

  target 'OmetriaSampleNotificationService' do
    pod 'Ometria', :path => '../../SDK'
  end

  end

post_install do |installer|
  installer.pods_project.targets.each do |target|
    if target.name == 'Ometria'
      target.build_configurations.each do |config|
        config.build_settings['APPLICATION_EXTENSION_API_ONLY'] = 'No'
      end
    end
  end
end
```

Once you’ve done this, you can run your application and the extension you have just created.

To finalise the implementation and allow Ometria to intercept notifications, open the `NotificationService` class and replace the content with the following:

```swift
import UserNotifications
import Ometria

class NotificationService: OmetriaNotificationServiceExtension {

}
```

Now you can receive notifications from Ometria and you are also able to see the images that are attached to your notifications.

7\. App links guide
----------------------------

Ometria sends personalised emails with URLs that point back to your website. In order to open these URLs inside your application, make sure you follow this guide.

### Pre-requisites

First, make sure you have an SSL-enabled Ometria tracking domain set up for your account. You may already have this for
your email campaigns, but if not ask your Ometria contact to set one up, and they should provide you with the domain.

### Enable the Associated Domains entitlement for your application

Please follow the [ios documentation for associated domains](https://github.com/Ometria/ometria.ios_sdk/blob/master/README.md#enable-the-associated-domains-entitlement-for-your-application),
then [create an apple-app-site-association file and send it to your Ometria contact](https://github.com/Ometria/ometria.ios_sdk/blob/master/README.md#create-an-apple-app-site-association-file-and-send-it-to-your-ometria-contact).

### Handle App Links inside your application

In order to handle the links inside your application you need to use

  ```javascript
  onDeepLinkInteracted(): Promise<string>
  ```

this promise resolves into an URL string extracted from the notification received via Firebase.

### Process App Links inside your application

The final step is to process the URLs in your app and take the user to the appropriate sections of the app. Note that
you need to implement the mapping between your website's URLs and the screens of your app.

See also [Linking push notifications to app screens](https://support.ometria.com/hc/en-gb/articles/4402644059793-Linking-push-notifications-to-app-screens).

If you are dealing with normal URLs pointing to your website, you can decompose it into different path components and parameters. This will allow you to source the required information to navigate through to the correct screen in your app.

In order for React-Native to identify that an url is opening the app you need to adjust AppDelegate.m file from ios folder
add the following code to AppDelegate.m from ./ios/ProjectName

```objective-c
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
{
  return [RCTLinkingManager application:application openURL:url
                      sourceApplication:sourceApplication annotation:annotation];
}

// Only if your app is using [Universal Links](https://developer.apple.com/library/prerelease/ios/documentation/General/Conceptual/AppSearch/UniversalLinks.html).
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler
{
 return [RCTLinkingManager application:application
                  continueUserActivity:userActivity
                    restorationHandler:restorationHandler];
}
```

For Android please add the following:

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

to /android/app/src/main/AndroidManifest.xml

However, Ometria emails contain obfuscated tracking URLs, and these need to be converted back to the original URL, pointing to your website, before you can map the URL to an app screen. To do this, the SDK provides a method called `processUniversalLink`:

```javascript
  processUniversalLink(url: string): Promise<string>
```

If you have done everything correctly, the app should now be able to open app links and allow you to handle them inside the app.
