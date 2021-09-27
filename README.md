1\. Why integrate Ometria in a mobile app?
------------------------------------------

Ometria helps your marketing department understand and better engage with your customers by delivering personalised emails and push notifications.

The app has two key objectives:

1. Getting information about customers (what do they like?)
2. Reaching out to customers (saying the right thing to the right people).

For your mobile app, this means:

1. Tracking customer behaviour through events - handled by Ometria.
2. Sending and displaying push notifications - **requires the app developers**.

2\. Before you begin
----------------------

See [Setting up your mobile app with Firebase credentials](https://support.ometria.com/hc/en-gb/articles/360013658478-Setting-up-your-mobile-app-with-Firebase-credentials) in the Ometria help centre and follow the steps there to get an API key.

3\. Install the library
-----------------------

The easiest way to get Ometria into your React-Native project is by using `npm install` or `yarn add`.

1. Install Ometria React-Native package from `Ometria/ometria.react_native_sdk` using `npm install Ometria/ometria.react_native_sdk` or `yarn add Ometria/ometria.react_native_sdk`
2. For `iOS` you need to install Pods `pod install` to create a local CocoaPods spec mirror.

4\. Initialise the library
--------------------------

To initialise Ometria, you need to enter the API key from **2. Before you begin**.

```js
import Ometria from 'Ometria/ometria.react_native_sdk'
// Ometria init
await Ometria.initializeWithApiToken('API_KEY');
```

Once you've called this method once, you can access your instance throughout the rest of your application.

Ometria uses [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) to send push notifications to the mobile devices.

You will therefore have to add ‘React-Native Firebase’ as a dependency of Ometria, using the following lines:

```js
import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
```

For **Android** follow the Firebase React-Native tutorial [Firebase for Android](https://rnfirebase.io/#2-android-setup)
For **iOS** follow the Firebase React-Native tutorial [Firebase for iOS](https://rnfirebase.io/#3-ios-setup)

Ometria logs any errors encountered during runtime by default.

You can enable advanced logging if you want more information on what’s happening in the background. Just add the following line after initialising the library:

```js
Ometria.isLoggingEnabled(true);
```

5\. Event tracking guide
------------------------

You need to be aware of your users’ behaviour on your platforms in order to understand them. Some behaviour is automatically detectable, other events need work from the app developer to track.

Many of these methods have analogous events in a server-to-server API called the [Ometria Data API](https://support.ometria.com/hc/en-gb/articles/360011511017-Data-API-introduction), and through a separate JavaScript API.

**Be aware:** If your business already integrates with Ometria in any way, it is very important that the values sent here correspond to those in other integrations.

E.g., the customer identified event takes a customer ID - that ID must be the same here as it is in the data API.

The events are merged on Ometria's side into one big cross-channel view of your customer behaviour, which will otherwise get very messy.

### Manually tracked events

Once the SDK is initialised, you can track an event by calling its dedicated method:

```js
const items: OmetriaBasketItem[] = [
  {
    productId: 'product-1',
    sku: 'sku-product-1',
    quantity: 1,
    price: 12.0,
  },
  {
    productId: 'product-2',
    sku: 'sku-product-2',
    quantity: 2,
    price: 9.0,
  },
  {
    productId: 'product-3',
    sku: 'sku-product-3',
    quantity: 3,
    price: 20.0,
  },
];

Ometria.trackBasketUpdatedEvent({
  totalPrice: 12.0,
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
These two events are pivotal to the functioning of the SDK, so make sure you send them as early as possible.

#### Profile deidentified

Undo a profileIdentified event.

Use this if a user logs out, or otherwise signals that this device is no longer attached to the same person.

```js
Ometria.trackProfileDeidentifiedEvent();
```

#### Product viewed

A visitor clicks/taps/views/highlights or otherwise shows interest in a product.

E.g. the visitor searches for a term and selects one of the product previews from a set of results, or browses a category of clothes, and clicks on a specific shirt to see a bigger picture.

This event is about capturing interest from the visitor for this product.

```js
Ometria.trackProductViewedEvent('product_id');
```

#### Wishlist events

The visitor has added this product to their wishlist:

```js
Ometria.trackWishlistAddedToEvent('product_id');
```

... or removed it:

```js
Ometria.trackWishlistRemovedFromEvent('product_id');
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
  },
  {
    productId: 'product-2',
    sku: 'sku-product-2',
    quantity: 2,
    price: 9.0,
  },
  {
    productId: 'product-3',
    sku: 'sku-product-3',
    quantity: 3,
    price: 20.0,
  },
];

Ometria.trackBasketUpdatedEvent({
  totalPrice: 12.0,
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
  currency: 'USD',
  items,
  link: 'link_eg'
});
```

#### Deep link opened

Based on the implementation status of interaction with notifications that contain deep links, this event can be automatically tracked or not.

The default implementation automatically logs a deep link opened event every time the user interacts with a notification that has a deep link. This is possible because we know that the default implementation will open the link in a browser.

If you chose to handle deep links yourself (using the guide for [Handling interaction with notifications that contain URLs](#handling_interaction_with_notifications_that_contain_urls)), then you should manually track this event when you have enough information regarding the screen (or other destination) that the app will open.

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

* `currency`: (`String`, required) - A string representing the currency in ISO currency format. e.g. `"USD"`, `"GBP"`
* `price`: (`float`, required) - A float value representing the pricing.
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

Instead, it composes batches of events that are periodically sent to the backend during application runtime.

You can request the library to send all remaining events to the backend whenever you want by calling:

```js
Ometria.flush()
```

The library will automatically call this method every time the application is brought to foreground or sent to background.

### Clear tracked events

You can completely clear all the events that have been tracked and not yet flushed.

To do this, call the following method:

```js
Ometria.clear()
```

6\. Push notifications guide for React-Native apps
----------------------------

When correctly set up, Ometria can send personalised notifications for your mobile application.

Follow these steps:

1. Enable your app to receive push notifications by creating an appId and enabling the push notifications entitlement.
2. Set up a [Firebase](https://firebase.google.com/docs/cloud-messaging) account and connect it to Ometria.
3. Enable Cloud Messaging on your Firebase account and provide your application’s **SSL push certificate**.
4. Configure push notifications in your application.
5. Add a **Notification Service Extension** to your app in order to enable receiving rich content notifications.

### Configure push notifications in your application

Before continuing, you must have already configured:

* The Ometria SDK
* Firebase

#### iOS

On iOS you have to request push notifications permissions using Firebase Messaging, e.g.:

```js
import messaging from '@react-native-firebase/messaging';
// ...
await messaging().requestPermission({
  sound: true,
  badge: true,
  alert: true,
});
```

The Ometria SDK will automatically source all the required tokens and provide them to the backend.

This way your app will start receiving notifications from Ometria. Handling those notifications while the app is running in the foreground is up to you.

#### Android

On Android you have to forward the Push Notification token, e.g.:

```js
import messaging from '@react-native-firebase/messaging';
// ...
messaging().onTokenRefresh((pushToken) => {
  Ometria.onNewToken(pushToken);
});
```

and next you must pass the remote message to Ometria SDK, e.g.:

```js
messaging().onMessage((remoteMessage) => {
  Ometria.onMessageReceived(remoteMessage);
});
```

For a complete example and use case please consult the sample app.

### Handling interaction with notifications that contain URLs

Ometria allows you to send URLs alongside your push notifications and allows you to handle them on the device.

By default, the Ometria SDK automatically handles any interaction with push notifications that contain URLs by opening them in a browser.

However, it enables developers to handle those URLs as they see fit (e.g. take the user to a specific screen in the app).

There is only one method that is required to get access to these interactions, and it will be triggered every time the user taps on a notification that has a deepLink action URL.

This is what it would look like in code:

```js
// Deep linking interaction from push notifications
Ometria.onDeepLinkInteracted().then((notificationURL) => {
  console.log('Notification URL interacted: ', notificationURL);
});
```

### Enabling rich content notifications (iOS only)

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
