# 2.2.2

2023-07-12

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
