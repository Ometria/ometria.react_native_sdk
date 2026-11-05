# 2.9.0

2026-11

- **Deprecated the Old Architecture.** 2.9.x is the last release line that supports React Native's Old Architecture; react-native-ometria 3.0 requires the New Architecture and moves the iOS dependencies to Swift Package Manager. Old Architecture apps can stay on 2.9.x, and in development builds the SDK now logs a one-time warning when it runs on the Old Architecture (not under Jest).
- Fixed push notifications on Expo SDK 58 with React Native Firebase 26 or earlier: the Expo config plugin now adds `FirebaseApp.configure()` to `AppDelegate.swift` when React Native Firebase's own plugin skips it, so Firebase is initialised and a push token is issued. If you added `FirebaseApp.configure()` yourself as a workaround, remove it when you upgrade.
- Fixed TypeScript types with React Native Firebase 26: the SDK no longer uses RNFB's `FirebaseMessagingTypes` namespace (removed in RNFB 26), so `onNotificationReceived`, `onNotificationOpenedApp`, `parseNotification` and `onAndroidBackgroundMessage` accept the `RemoteMessage` of any RNFB version. The new `OmetriaRemoteMessage` type is exported.
- Fixed the missing React Native SDK version on iOS `notificationReceived` events sent by the Notification Service Extension: the SDK now also stores its version in the App Group, where the extension can read it. Apps without an App Group behave as before.
- Removed a leftover duplicate `initializeWithApiToken` declaration from the iOS Old Architecture bridge.
- Updated native Ometria SDKs: 🍏 iOS 1.9.2 & 🤖 Android 1.11.5. iOS 1.9.2 fixes duplicate `notificationReceived` events when a push is tracked by the Notification Service Extension and again by the app. Android 1.11.5 only changes notifications that the native SDK displays itself, which React Native apps don't use.
- Updated the Expo sample app to Expo SDK 58 (React Native 0.88.1) with React Native Firebase 26.4.1. The bare sample app stays on React Native 0.81, the last version with the Old Architecture.
- The sample apps now use Firebase iOS SDK 12.19.0, the last Firebase release with FirebaseMessaging on CocoaPods. On 2.x, use React Native Firebase 26.x or earlier; React Native Firebase 27 is supported from 3.0.

# 2.8.1

2026-07

- Added `setTrackingEnabled(enabled: boolean)` to fully stop or resume event tracking. When disabled, no events (including automatic ones) leave the SDK, a final opt-out is sent to the server, and the state is persisted across app restarts; re-enabling sends an opt-in reflecting the current OS notification permission and resumes tracking.
- Added `getTrackingEnabled(): Promise<boolean>` to read the current tracking state.
- Updated native Ometria SDKs: 🍏 iOS 1.9.1 & 🤖 Android 1.11.4.

# 2.8.0

2026-07

- Added Expo plugin support with automatic Notification Service Extension setup, plus an Expo sample app.
- Updated native Ometria SDKs: 🍏 iOS 1.8.9 & 🤖 Android 1.11.2.
- Removed `trackWishlistAddedToEvent` / `trackWishlistRemovedFromEvent` (deprecated since v2.2.0).
- `onMessageReceived` and `onDeepLinkInteracted` (deprecated since v2.3.0) are now no-ops. Use `onNotificationReceived` and handle notification interactions yourself.
- Fixed Android heads-up notifications: the SDK now creates a high-importance notification channel so push notifications appear as heads-up alerts.

# 2.7.1

2026-03

- Fixed `scripts` directory not being included in the npm package, causing iOS setup to fail when installing via npm.
- Removed deprecated `jcenter()` repository from Android build configuration.

# 2.7.0

2026-01

- Updated ReactNative to 0.81.x in the sample app.
- Implements support for both React Native architectures (Old and New Architecture).
- Updated Ometria native SDK to the latest versions - 🍏 1.8.4 iOS & 🤖 1.11.0 Android.
- Fixed Android `trackProfileIdentifiedEvent` parameter order bug where `customerId` and `email` were swapped when passed to the native SDK.

# 2.6.1

2025-06

- Updated Ometria native SDK to the latest versions - 🍏 1.8.2 iOS & 🤖 1.10.3 Android.
- Added new method `trackProfileIdentifiedEvent`. Tracks the current app user being identified by both email, customerId and optionally a storeId. If you don't have one of the values (email or customerId), you can use the alternate versions of this method: `trackProfileIdentifiedByEmailEvent(email: string)` or `trackProfileIdentifiedByCustomerIdEvent(customerId: string)`.

# 2.6.0

2025-02

- Updated ReactNative to 0.77.0 (Note that the new architecture is not supported yet by the Ometria SDK and you must use the legacy architecture)
- Updated Ometria native SDK to the latest versions - 🍏 1.8.0 iOS & 🤖 1.9.0 Android.
- Added in example an optional way to send the FCM token on app background state, once per week.

# 2.5.0

2024-12

- Updated ReactNative to 0.76.4 (Note that the new architecture is not supported yet by the Ometria SDK)
- Updated Ometria native SDK to the latest versions
- Added storeId support

# 2.4.1

2024-06

- Updated ReactNative to 0.74.2
- Updated Ometria native SDK to the latest versions - 🍏 1.6.0 iOS & 🤖 1.7.0 Android.

# 2.4.0

2024-02

- Updated ReactNative to 0.73.2
- Deprecated `onNotificationInteracted` method. Use `onNotificationOpenedApp` instead for handling notification interaction.
- Deprecated `setBackgroundMessageHandler`Android method. Use the new method `onAndroidBackgroundMessage` to handle background messages on Android.
- Changed `onNotificationOpenedApp` signature to include the remote message object as a parameter for better compatibility with the native SDK.
- Updated Ometria native SDK to the latest versions - 🍏 1.5.1 iOS & 🤖 1.6.2 Android. Both SDK support quit app state notification handling.

# 2.3.0

2023-11

- Changed the way notifications are handled on Android
- Updated example with request for notifications permission on Android 13
- Fixed Notification trampoline (Android 12+)
- Upated example and library to use updated React Native library version (0.71.13)
- Updated Ometria native SDK to the latest versions - 🍏 1.5.0 iOS & 🤖 1.6.1 Android. Both SDK support now reinitialisation.

# 2.2.2

2023-07-28

- Updated example and library to use the latest React Native library version

# 2.2.1

2023-05-25

- Updated example to use the latest React Native and Firebase version
- Fixed a warning regarding NativeEventEmitter

# 2.2.0

2022-11-17

- Added `id` property to OmetriaBasket object
- Added `variantId` to OmetriaBasketItem object
- Added library in-line method documentation
- Deprecated wishlist events methods
- Changed example to use Firebase 9.x
- Fixed TypeScript `OmetriaBasketItem` model to match the SDK (`sku` is now optional)

# 2.1.0

2022-08-01

- Added optional object parameter to `Ometria.initializeWithApiToken()` to allow custom Android notification channel name. [Find out more.](https://github.com/Ometria/ometria.react_native_sdk#4-initialise-the-library)
- Updated readme documentation.

# 2.0.0

2022-07-29

- Changed `Ometria.onNotificationInterracted()` to be called with a callback now, instead as a promise. [Find out more.](https://github.com/Ometria/ometria.react_native_sdk_internal/#handling-interaction-with-notifications-that-contain-urls)
- Changed `Ometria.onNewToken()` to be called on iOS as well (not only on Android) on FB token generation/refresh. [Find out more.](https://github.com/Ometria/ometria.react_native_sdk_internal/#configure-push-notifications-in-your-application)
- Updated readme documentation [here](https://github.com/Ometria/ometria.react_native_sdk_internal/#handling-interaction-with-notifications-that-contain-urls) and [here](https://github.com/Ometria/ometria.react_native_sdk_internal/#configure-push-notifications-in-your-application).
- Updated sample app code.

# 2.2.2

2022-02-21

- Updated README.md
- Updated native Ometria SDK dependency to version 1.2.2
- Added sending React Native SDK version to backend for more clear visibility of issues.
- Added functionality to properly support Firebase SDK v8.x. We discovered an issue with Firebase push token retrieval, which also affected Ometria SDK in some scenarios. Please consult the [documentation](https://github.com/Ometria/ometria.react_native_sdk/tree/v1.2.2#41-firebase-80-810-issue-ios) if you are using any Firebase SDK version from 8.0 to 8.10.

# 1.2.1

2021-11-08

- Removed bob package to fix typescript generation issues.
- Added support for yarn berry.
- Updated native Ometria SDK dependency to version 1.2.1
- Added functionality to expose content received in notifications from Ometria
- Updated sample application with new functionality of the SDK
- Updated README.md

# 1.2.0

2021-09-27

- Removed automatic screen tracking
- Added link parameter to Basket items
- Added universal link processing functionality. This allows developers to retrieve the last redirect from an advertising URL, and makes it possible to implement functionality that takes the user to a screen which is representative to a particular URL from their web domain.

---

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
