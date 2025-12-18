# 1. Why integrate Ometria in a mobile app?

Ometria helps your marketing department understand and better engage with your customers by delivering personalised emails and push notifications.

The app has two key objectives:

1. Getting information about customers (what do they like?)
2. Reaching out to customers (saying the right thing to the right people).

For your mobile app, this means:

1. Tracking customer behaviour through events - a subset of events is automatically handled by the Ometria SDK, but you have to customize it to your needs, see [Creating an event tracking plan for your mobile app](https://support.ometria.com/hc/en-gb/articles/360018440917-Creating-an-event-tracking-plan-for-your-mobile-app).
2. Sending and displaying push notifications - **requires the app developers**.

App developers integrating with this SDK should follow the guide below. You can also look at the Sample app we have included for a reference implementation.

# 2. Before you begin

See [Setting up your mobile app with Firebase credentials](https://support.ometria.com/hc/en-gb/articles/360013658478-Setting-up-your-mobile-app-with-Firebase-credentials) in the Ometria help centre and follow the steps there to get an API key.

# 3. Install the library

The easiest way to get Ometria into your ReactNative project is by using `npm install` or `yarn add`.

This library targets React Native 0.81.4 (the latest release that still allows opting out of the New Architecture). It ships with support for both the classic bridge and the New Architecture.

### Enabling the New Architecture

#### iOS Setup

1. Add the Ometria TurboModule setup to your `Podfile`:

```ruby
# At the top of your Podfile, add:
require_relative '../node_modules/react-native-ometria/scripts/ometria_turbomodule'

# In your post_install block, add:
post_install do |installer|
  react_native_post_install(installer, ...)

  # Register Ometria TurboModule (required for New Architecture)
  patch_ometria_turbomodule(installer)
end
```

2. Run pod install with the New Architecture flag:
```bash
RCT_NEW_ARCH_ENABLED=1 pod install
```

> ℹ️ **Why is this needed?** The Ometria SDK is written in Swift, but React Native's TurboModule specs use C++ types that Swift cannot directly implement. We use an Objective-C++ wrapper to bridge this gap. The `patch_ometria_turbomodule` function registers this wrapper with React Native's module discovery system. This is a temporary workaround - we are working on a solution that won't require manual Podfile changes.

#### Android Setup

Run your build with the New Architecture flag:
```bash
./gradlew assembleDebug -PnewArchEnabled=true
```

Or set it permanently in `android/gradle.properties`:
```properties
newArchEnabled=true
```

> ℹ️ Android builds require `compileSdkVersion`/`targetSdkVersion` 36 and `minSdkVersion` 24.


1. Install Ometria ReactNative package from `react-native-ometria` using `npm install react-native-ometria` or `yarn add react-native-ometria`

Note: If you have issues with installing the library, please consider excluding the example from typescript config
eg:

```
{
  ...,
  "exclude": ["example"]
}
```

2. For `iOS` you need to install Pods `pod install` to create a local CocoaPods spec mirror.

3. If you encounter `The Swift pod 'Ometria' depends upon 'FirebaseMessaging'` error when running pod install, please consider adding `use_frameworks! :linkage => :static`.

# 4. Initialise the library

To initialise the Ometria SDK, you need to enter the API key from **[2. Before you begin](#2-before-you-begin)**.

```js
import Ometria from 'react-native-ometria';

await Ometria.initializeWithApiToken('API_KEY', {
  notificationChannelName: 'Example Channel Name', // optional, only for Android
  appGroupIdentifier: 'group.com.ometria.sampleRN', // optional, only for iOS
});
```

ℹ️ Since version 2.3.0, the SDK allows for reinitialization of the Ometria instance. So you can call this method again later in the app if you need to.

⚠️ Any other Ometria methods must be called **after** this method has been called once.
Once you've called this method once, the SDK will be able to send events to Ometria.
You can now access your instance throughout the rest of your application.

#### Optional parameters

- You can specify a custom name of the Android notification channel in the second optional options parameter. Default channel name is `<blank>`.

- You can also specify an app group identifier in the second optional options parameter. See [this section](#62--adding-notification-service-extension-target-ios-only) for iOS.

#### Debugging

Ometria logs any errors encountered during runtime by default, these logs are accessible in your development environment's console.

You can enable advanced logging if you want more information on what’s happening in the background. Just add the following line after initialising the library:

```js
Ometria.isLoggingEnabled(true);
```

# 4. Event tracking guide

You need to be aware of your users’ behaviour on your platforms in order to understand them. Some behaviour is automatically detectable, other events need work from the app developer to track.

Many of these methods have analogous events in our [website tracker](https://support.ometria.com/hc/en-gb/articles/4405356106653-JavaScript-tracker).

⚠️ If your business already integrates with Ometria in any way, it is very important that the values sent here correspond to those in other integrations.

E.g., the customer identified event takes a customer ID or an email - these identifiers must be the same here as it is in the data API. If you specify both email and customer id, both need to match.

The events are merged on Ometria's side into one big cross-channel view of your customer behaviour. If you use inconsistent email/customer ids, this could result in duplicate profiles created or data loss.

## Manually tracked events

Once the SDK is initialised, you can track an event by calling its dedicated method.

### Profile identified

An app user has just identified themselves, i.e. logged in. Their **customer ID** is their **user ID** in your database.

```js
Ometria.trackProfileIdentifiedByCustomerIdEvent('test_customer_id');
```

Sometimes a user only supplies their email address without fully logging in or having an account. In that case, Ometria can profile match based on email:

```js
Ometria.trackProfileIdentifiedByEmailEvent('test@gmail.com');
```

If you have both their email and their customerId Ometria can profile match based on both and you should call:

````js
Ometria.trackProfileIdentifiedEvent('test_customer_id','test@gmail.com');
````

Having a **customerId** makes profile matching more robust.

It’s not mutually exclusive with sending an email event; for optimal integration you should send either event as soon as you have the information.
These two events are pivotal to the functioning of the SDK, so make sure you send them as early as possible. Reiterating here that these identifiers must be the same here as the ones you use in your e-commerce platform and you send to Ometria (via the data API or other ways). If you specify both email and customer id, both need to match. A typical error we see at integrations is that the app generates a new customer id on each login (that doesn't match the customer id stored in Ometria). To avoid this, generate these ids centrally on your servers and send consistent ones through the Ometria mobile SDK and the Ometria Data API. If it is impractical to generate consistent ids, we suggest only using email to identify contacts.

### Profile deidentified

Undo a profileIdentified event.
You can use this if an user logs out.

```js
Ometria.trackProfileDeidentifiedEvent();
````

Currently this event clears the stored ids (email and/or customer id) from the phone's local storage. It has no other effect within Ometria.

### Update store identifier

Ometria supports multiple stores for the same ecommerce platform (e.g. separate stores for different countries). There are three different methods for interacting with the store identifier for the current app installment.

#### 1. Using an optional parameter in the `profileIdentified` events tracking methods

```js
trackProfileIdentifiedEvent(email: string, storeId?: string)
trackProfileIdentifiedEvent(customerId: string,  storeId?: string)
trackProfileIdentifiedEvent(customerId: string, email: string, storeId?: string);
```

When omitting the `storeId` parameter, the store identifier will not be affected in any way. Only sending a valid parameter will cause the store identifier to be updated to that value.

##### 2. Using a separate method that allows setting/resetting the store identifier

```js
updateStoreId(storeId: string | null)
```

- with a null `storeId` parameter, the method resets the store identifier.
- with a non null `storeId` parameter, the method sets the store identifier to the provided value.

##### 3. Using the `profileDeidentified` event

Tracking a profile deidentified event, will reset the `customerId`, the `email`, and the `storeId` for the current app installment.

### Product viewed

A visitor clicks/taps/views/highlights or otherwise shows interest in a product.

E.g. the visitor searches for a term and selects one of the product previews from a set of results, or browses a category of clothes, and clicks on a specific shirt to see a bigger picture.

This event is about capturing interest from the visitor for this product.

```js
Ometria.trackProductViewedEvent('product_id');
```

### Basket viewed

The visitor has viewed a dedicated page, screen or modal with the contents of the shopping basket:

```js
Ometria.trackBasketViewedEvent();
```

### Basket updated

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
  link: 'link_eg',
});
```

This event takes the full current basket as a parameter - not just the updated parts.

This helps recover from lost or out of sync basket events: the latest update is always authoritative.

**OmetriaBasketItem** is an object that describes the contents of a shopping basket item. It can have its own price and quantity based on different rules and promotions that are being applied. It has the following properties:

> - **productId**: (`string`, required) - A string representing the unique identifier of this product.
> - **sku**: (`string`, optional) - A string representing the stock keeping unit, which allows identifying a particular item.
> - **quantity**: (`int`, required) - The number of items that this entry represents.
> - **price**: (`float`, required) - Float value representing the price for one item. The currency is established by the OmetriaBasket containing this item
> - **variandId**: (`string`, optional) - An identifier for a variant product associated with this line item.

**OmetriaBasket** is an object that describes the contents of a shopping basket and has the following properties:

> - **id**: (`string`, optional) - A unique identifier for this basket
> - **currency**: (`string`, required) - A string representing the currency in ISO 4217 three-letter currency code, e.g. `"USD"`, `"GBP"`
> - **totalPrice**: (`float`, required) - A float value representing the pricing.
> - **items**: (`OmetriaBasketItem[]`) - An array containing the item entries in this basket.
> - **link**: (`string`) - A deeplink to the web or in-app page for this basket. Can be used in a notification sent to the user, e.g. "Forgot to check out? Here's your basket to continue: 'https://eg.com/basket_url'". Following that link should take them straight to the basket page.

### Checkout started

Track when the user has started the checkout process.
This is currently only used to count page views, and has no other effect in Ometria.

```js
Ometria.trackCheckoutStartedEvent('order_id');
```

### Order completed

The order has been completed and paid for:

```js
const items: OmetriaBasketItem[] = [
  {
    productId: 'product-1',
    sku: 'sku-product-1',
    quantity: 1,
    price: 12.0,
  },
];

Ometria.trackOrderCompletedEvent('order_id', {
  totalPrice: 12.0,
  id: 'basket_id_eg',
  currency: 'USD',
  items,
  link: 'link_eg',
});
```

The second parameter (basket object) is optional.

### Deep link opened

Use the guide for [Handling interaction with notifications that contain URLs](#handling-interaction-with-notifications-that-contain-urls) to manually track this event when you have enough information regarding the screen (or other destination) that the app will open.

```js
Ometria.trackDeepLinkOpenedEvent('/profile', 'ProfileScreen');
```

### View home page

The visitor views the ‘home page’ or landing screen of your app.

```js
Ometria.trackHomeScreenViewedEvent();
```

### View list of products

The visitor clicks/taps/views/highlights or otherwise shows interest in a product listing. This kind of screen includes search results, listings of products in a group, category, collection or any other screen that presents a list of products.

E.g., A store sells clothing, and the visitor taps on "Women's Footwear" to see a list of products in that category, or they search for "blue jumper" and see a list of products in that category.

This event should be triggered on:

- search results
- category lists
- any similar screens

```js
Ometria.trackProductListingViewedEvent(listingType: string, listingAttributes: {type: string, id: string});
```

The `listingType` parameter can be any string the client chooses (currently has no effect, but helps us and the client to see what kind of listing page the user viewed). We recommend setting this to "category" for example for category pages or "search" for a search results page.
The `listingAttributes` parameter should be an object that consists of 2 fields:

- "type" which should be an attribute that exists in the Ometria database. For example "shoe-colour".
- "id" which should be an attribute their_id that exists in the Ometria database. For example "red".

Both "id" and "type" are needed to correctly specify attributes.

for example:

```js
Ometria.trackProductListingViewedEvent('category', {
  type: 'shoe-colour',
  id: 'red',
});
```

### Screen viewed

Tracking a visitor’s independent screen views helps us track their engagement with the app, as well as where they are in a journey.

An analogous event on a website would be to track independent page views.

The common eCommerce screens all have their own top-level event: basket viewed, list of products viewed, etc.

Your app may have a specific type of page that is useful for marketers to track engagement with.

E.g. if you’re running a promotion, and viewing a specific screen indicates interest in the promotion, which marketing might later want to follow up on.

To track these custom screens, use the _Screen viewed_ event:

```js
Ometria.trackScreenViewedEvent('OnboardingScreen', { a: '1', b: '2' });
```

The second parameter is optional and can be used to send additional data about the screen.

### Custom events

Your app might have specific flows or pages that are of interest to the marketing team.

E.g. Marketing might want to send an email or notification to any user who signed up for a specific promotion, or interacted with a button or specific element of the app.

If you send a custom event corresponding to that action, they will be able to trigger an [automation campaign](https://support.ometria.com/hc/en-gb/articles/360011378398-Automation-campaigns-overview) on it.

Check with the marketing team about the specifics, and what they might need. Especially if they're already using Ometria for email, they will know about automation campaigns and custom events.

```js
Ometria.trackCustomEvent('my_custom_type', {});
```

The second parameter is optional and can be used to send additional data about the event.

## Automatically tracked events

The following events are automatically tracked by the SDK.

Initialising the SDK is enough to take advantage of these; no further integration is required (unless mentioned otherwise).

| Event                                              |                                                                                          Description                                                                                          |
| -------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| **Application installed**                          |                       The app was just installed. Usually can't be sent when the app is _actually_ installed, but instead only sent the first time the app is launched.                       |
| **Application launched**                           |                                                                              Someone has just launched the app.                                                                               |
| **Application foregrounded**                       |                                            The app was already launched, but it was in the background. It has just been brought to the foreground.                                            |
| **Application backgrounded**                       |                                                              The app was in active use and has just been sent to the background.                                                              |
| **Notification received in quit state of the app** | A Push notification was received by the system while the app was in quit state. ([needs a Notification Service Extension on iOS](#62--adding-notification-service-extension-target-ios-only)) |
| **Error occurred**                                 |    An error occurred on the client side. We try to detect any problems with actual notification payload on our side, so we don't expect any errors which need to be fed back to end users.    |

### Flush tracked events

In order to reduce power and bandwidth consumption, the Ometria library doesn’t send the events one by one unless you request it to do so.

Instead, it composes batches of events that are sent to the backend during application runtime when the one of the following happened:

- it has collected 10 events or
- there was a firebase token refresh (`pushtokenRefreshed` event)
- a `notificationReceived` event
- an `appForegrounded` event
- an `appBackgrounded` event

You can request the library to send all remaining events to the backend whenever you want by calling:

```js
Ometria.flush();
```

### Clear tracked events

You can completely clear all the events that have been tracked and not yet flushed.

To do this, call the following method:

```js
Ometria.clear();
```

## Debugging events

To see what events were captured, you can check the logs coming from the Ometria SDK, if logging is enabled. You can filter for the word "Ometria".
The SDK logs all events as they happen, and also logs the flushing i.e. when they are sent to the Ometria mobile events API. Any potential errors with the sending (API issues or event validation issues) would be visible here too.

# 5. Push Notifications Firebase setup

Ometria uses [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) to send push notifications to the mobile devices.

You will therefore have to add ‘React-Native Firebase’ as a dependency of Ometria, using the following lines:

```js
import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
```

For **Android** follow the Firebase ReactNative tutorial [Firebase for Android](https://rnfirebase.io/#2-android-setup)
For **iOS** follow the Firebase ReactNative tutorial [Firebase for iOS](https://rnfirebase.io/#3-ios-setup)

To use push notifications, you also need to follow the steps in [Push Notifications ReactNative Guide](#6-push-notifications-reactnative-guide)

### Firebase versions on iOS

:warning: As a recommendation coming from Firebase, we advise cocoapods users to also update to a version that is more recent than 10.10.0.

# 6. Push Notifications ReactNative guide

When correctly set up, Ometria can send personalised notifications for your mobile application.

Follow these steps:

- Enable your app to receive push notifications by creating an appId and enabling the push notifications entitlement.
- Set up a [Firebase](https://firebase.google.com/docs/cloud-messaging) account and connect it to Ometria.
- Enable Cloud Messaging on your Firebase account and provide your application’s **SSL push certificate**.
- Configure push notifications in your application.
- Add a **Notification Service Extension** to your app in order to enable receiving rich content notifications and to track notifications received in quit state of the app on iOS.

## 6.1. Configure push notifications in your application (iOS and Android)

Before continuing, you must have already configured:

- The Ometria SDK must be initialised
- Firebase must be configured and added to your project

Read more about those steps in section [4\. Initialise the library](#4-initialise-the-library)

### A. Request permission to receive Push Notifications

---

For **Android 13** (API level 33) and higher you first have to declare the permission in your AndroidManifest.xml file:

```xml
<manifest ...>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    <application ...>
        ...
    </application>
</manifest>
```

You have to request permissions for notifications. You can use [react-native-permissions](https://github.com/zoontek/react-native-permissions).

```js
import {requestNotifications, RESULTS } from 'react-native-permissions';
...
await requestNotifications(['alert', 'sound', 'badge']).then(({ status }) => {
    if (status === RESULTS.GRANTED) {
    console.log('🔔 Push Notification permissions granted!');
    }
});
```

Find more about Notification runtime permissions on Android [here](https://developer.android.com/develop/ui/views/notifications/notification-permission).

### B. Forward the push token to Ometria

---

After Ometria initialisation, you **must forward the Firebase Push Notification token** (both iOS and Android).

You also have to forward the push notification token to Ometria every time it is refreshed.

```js
import Ometria from 'react-native-ometria';
import messaging from '@react-native-firebase/messaging';

await Ometria.initializeWithApiToken('API_KEY', {
  notificationChannelname: 'Example Channel Name', // optional, only for Android
  appGroupIdentifier: 'group.com.ometria.sampleRN', // optional, only for iOS
});

messaging()
  .getToken()
  .then((pushToken) => Ometria.onNewToken(pushToken));

messaging().onTokenRefresh((pushToken) => Ometria.onNewToken(pushToken));
```

### C. Handling Notifications in Foreground App State

---

Subscribe to remote messages that your app gets while in foreground app state. You can do this by using the `onMessage` method from the `@react-native-firebase/messaging` package.

In the callback, you can use `Ometria.onNotificationReceived` to let the Ometria SDK know that a remote message has been received and the `notificationReceived` event will be fired. Use `Ometria.parseNotification` if you want to extract Ometria data from the remote message.

```js
messaging().onMessage(async (remoteMessage) => {
  Ometria.onNotificationReceived(remoteMessage);
  const ometriaData = Ometria.parseNotification(remoteMessage);
  // Use ometriaData
});
```

⚠️ Keep in mind that foreground notifications are **not** shown to the user. Instead, you could trigger a local notification or update the in-app UI to signal a new notification. Read more [here](https://rnfirebase.io/messaging/usage#foreground-state-messages).

ℹ️ If you implement such a custom solution, don't forget to call `Ometria.onNotificationOpenedApp` to let the SDK the notification has been interacted with when handling the notification interaction event for foreground notifications.

### D. Handling Notifications in Quit & Background App State on iOS 🍏

---

In order for Ometria to accurately track all the notifications that were received in quit and background state of the app on iOS, it needs to leverage the power of a background service, that has access to all notifications.

For a complete guide on how to set up a Notification Service Extension, see [Adding Notification Service Extension Target](#62--adding-notification-service-extension-target-ios-only).

### E. Handling Notifications in Quit & Background App State on Android 🤖

---

In order for Ometria to accurately track all the notifications that were received in quit and background state of the app on Android you need to subscribe early (in `index.js`) to remote messages that your app gets while being in quit and background state.

`Ometria.onAndroidBackgroundMessage` will let the Ometria SDK know that a remote message has been received and the _notificationReceived_ event will be fired. It needs the Ometria token in order to initialize the SDK in background.

```js
Platform.OS === 'android' &&
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    Ometria.onAndroidBackgroundMessage({
      ometriaToken: 'OMETRIA_KEY'
      ometriaOptions: {},
      remoteMessage,
    });
  });
```

ℹ️ As of version 2.4.0 `Ometria.setBackgroundMessageHandler` is a deprecated method. Use `Ometria.onAndroidBackgroundMessage` instead.

### F. Handling Notification Interaction (background and quit state)

---

When a user interacts with a notification in background or quit state, you have to let the Ometria SDK know that the notification has been interacted with and the app has been opened. You can do this by calling `Ometria.onNotificationOpenedApp` with the remote message as a parameter.

```js
// Check if the app was opened from quit state by a notification
messaging()
  .getInitialNotification()
  .then((remoteMessage) => {
    if (remoteMessage) {
      Ometria.onNotificationOpenedApp(remoteMessage);
    }
  });

// Subscribe to the app being opened from background state by a notification
messaging().onNotificationOpenedApp((remoteMessage) =>
  Ometria.onNotificationOpenedApp(remoteMessage)
);
```

ℹ️ As of version 2.4.0 `Ometria.onNotificationInteracted` is a deprecated method. Use `Ometria.onNotificationOpenedApp` instead.

### Handling interaction with notifications that contain URLs

---

Ometria allows you to send URLs and tracking info alongside your push notifications and allows you to handle them on the device. When a notification opened the app, you can parse the notification remote message and check if it contains a deeplink URL.

```js
const notif = await Ometria.parseNotification(remoteMessage);
if (notif?.deepLinkActionUrl) {
  Ometria.trackDeepLinkOpenedEvent(notif.deepLinkActionUrl, 'Browser');
  Linking.openURL(notif.deepLinkActionUrl);
}
```

`Ometria.parseNotification` returns an object with `OmetriaNotificationData` type that looks like this:

```
type OmetriaNotificationData = {
  campaignType?: 'trigger;  // represents automation campaigns
  deepLinkActionUrl?: string;
  externalCustomerId?: string;
  imageUrl?: string;
  sendId?: string;
  tracking: { // Can be overridden / added in your automation campaign's settings
    utm_medium?: string; // default is "push"
    utm_source: string;
    utm_campaign: string; // generated from campaign hash and title
    om_campagin: string; // generated from campaign hash, campaign version and node id
    [key: string]: string | undefined; // additional tracking data you add
  };
};
```

## 6.2. 🍏 Adding Notification Service Extension Target (iOS only)

The Notification Service Extension has two purposes:

1. Starting with iOS 12.0, Apple enabled regular applications to receive and display notifications that contain media content such as images. In order to be able to display the rich content, notifications have to be processed by the Notification Service Extension before being shown to the user.
2. There are lots of users that forget to open their apps. In order for Ometria to accurately track all the notifications that were received in quit state, it needs to leverage the power of a background service, that has access to all notifications.

### Add a Notification Service Extension

In order to add the extension, go to **File > New > Target**, and select **Notification Service Extension > Next**.

![](https://raw.githubusercontent.com/wiki/Ometria/ometria.ios_sdk/images/notification_service_extension.png)

A new item is displayed in your target list:

![](https://raw.githubusercontent.com/wiki/Ometria/ometria.ios_sdk/images/project_targets.png)

Next, make sure that the Ometria SDK is also available to this new target by updating your podfile to include your newly added target and specify Ometria as a dependency.

```ruby

# move this line before the App target
pod 'GoogleUtilities', : modular_headers => true

use_frameworks! :linkage => :static

target 'sampleApp' do
  # Pods for sampleApp
end

# Add the following lines
target 'NotificationService' do
  use_frameworks! :linkage => :static
  pod 'Ometria'
end
```

### Create an app group

At this point the main application and the extension function as two separate entities with the only shared component being the code. In order for the extension to obtain read and write access to data that is relevant for the SDK, it requires to be in the same App Group as the main target. This will allow the main target and the extension to share data.

In your project navigator, select your project, then go to **Signing & Capabilities** and select **+ Capability** in the top left corner.

![](https://github.com/Ometria/ometria.ios_sdk/assets/6207062/dd8cd6e7-ff00-41be-9573-2589436a4616)

Once you have done so, a new section will be displayed below Signing. It will allow you to add a new app group. Make sure you select a relevant identifier (e.g.`group.[BUNDLE_IDENTIFIER]`), and retain the value, as you will need it when instantiating Ometria.
Repeat the process for the Notification Service Extension target, and you should be good to go.

![alt text](https://github.com/Ometria/ometria.ios_sdk/assets/6207062/3d9d0500-3832-4312-a918-e5b05404886d)

### Update NotificationService

To allow Ometria to intercept notifications, open the `NotificationService` class that was automatically created alongside the extension, and replace the content with the following:

```swift
import UserNotifications
import Ometria

class NotificationService: OmetriaNotificationServiceExtension {
  override func instantiateOmetria() -> Ometria? {
    Ometria.initializeForExtension(appGroupIdentifier: "group.[BUNDLE_IDENTIFIER]")
  }
}

```

### Use app group identifier when initialising Ometria

Finally, you have to use the app group identifier when initialising Ometria in the ReactNative application.

```js
import Ometria from 'react-native-ometria';
// Ometria init
await Ometria.initializeWithApiToken('API_KEY', {
  notificationChannelName: 'Example Channel Name', // optional, only for Android
  appGroupIdentifier: 'group.[BUNDLE_IDENTIFIER]', // optional, only for iOS
});
```

Now your app will emit a `notificationReceived` event every time a notification is received in quit state and you will be able to display rich content notifications on iOS.

💡 For a complete example and use case please consult the [Sample app](example/src/App.tsx).

# 7. App links guide

Ometria sends personalised emails with URLs that point back to your website. In order to open these URLs inside your application, make sure you follow this guide.

## Pre-requisites

First, make sure you have an SSL-enabled Ometria tracking domain set up for your account. You may already have this for
your email campaigns, but if not ask your Ometria contact to set one up, and they should provide you with the domain.

## Enable the Associated Domains entitlement for your application

Please follow the [ios documentation for associated domains](https://github.com/Ometria/ometria.ios_sdk/blob/master/README.md#enable-the-associated-domains-entitlement-for-your-application),
then [create an apple-app-site-association file and send it to your Ometria contact](https://github.com/Ometria/ometria.ios_sdk/blob/master/README.md#create-an-apple-app-site-association-file-and-send-it-to-your-ometria-contact).

## Process App Links inside your application

The final step is to process the URLs in your app and take the user to the appropriate sections of the app. Note that
you need to implement the mapping between your website's URLs and the screens of your app.

See also [Linking push notifications to app screens](https://support.ometria.com/hc/en-gb/articles/4402644059793-Linking-push-notifications-to-app-screens).

If you are dealing with normal URLs pointing to your website, you can decompose it into different path components and parameters. This will allow you to source the required information to navigate through to the correct screen in your app.

In order for ReactNative to identify that an url is opening the app you need to adjust AppDelegate.m file from ios folder
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
