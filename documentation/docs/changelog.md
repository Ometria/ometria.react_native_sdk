---
sidebar_position: 6
title: Changelog
---

# Changelog

All notable changes to this project are documented here.

## 2.8.0

**April 2026**

- Added Expo plugin support with automatic Notification Service Extension setup
- Added Expo sample app
- Removed deprecated `trackWishlistAddedToEvent` and `trackWishlistRemovedFromEvent` methods
- `onMessageReceived` and `onDeepLinkInteracted` are now fully deprecated no-ops. Use `onNotificationReceived` and your own notification interaction handling instead
- Refactored library architecture into modular method files
- Expo plugin auto-injects RN SDK version via Info.plist / AndroidManifest meta-data
- Updated Ometria native SDK to the latest versions - iOS 1.8.9 & Android 1.11.1
- Fixed deep link handling in sample app to use `Linking.openURL()` instead of `Linking.canOpenURL()`, which requires scheme whitelisting



## 2.7.1

**March 2026**

- Fixed `scripts` directory not being included in the npm package, causing iOS setup to fail when installing via npm
- Removed deprecated `jcenter()` repository from Android build configuration

## 2.7.0

**December 2025**

- Updated ReactNative to 0.81.x in the sample app
- Implements support for both React Native architectures (Old and New Architecture)
- Updated Ometria native SDK to the latest versions - iOS 1.8.4 & Android 1.11.0
- Fixed Android `trackProfileIdentifiedEvent` parameter order bug where `customerId` and `email` were swapped when passed to the native SDK

## 2.6.1

**June 2025**

- Updated Ometria native SDK to the latest versions - iOS 1.8.2 & Android 1.10.3
- Added new method `trackProfileIdentifiedEvent` - tracks the current app user being identified by both email, customerId and optionally a storeId

## 2.6.0

**February 2025**

- Updated ReactNative to 0.77.0 (Note: New Architecture was not yet supported)
- Updated Ometria native SDK to the latest versions - iOS 1.8.0 & Android 1.9.0
- Added optional way to send the FCM token on app background state, once per week

## 2.5.0

**December 2024**

- Updated ReactNative to 0.76.4
- Updated Ometria native SDK to the latest versions
- Added storeId support

## 2.4.1

**June 2024**

- Updated ReactNative to 0.74.2
- Updated Ometria native SDK to the latest versions - iOS 1.6.0 & Android 1.7.0

## 2.4.0

**February 2024**

### Breaking Changes

- **Deprecated** `onNotificationInteracted` method. Use `onNotificationOpenedApp` instead
- **Deprecated** `setBackgroundMessageHandler` Android method. Use `onAndroidBackgroundMessage` instead
- Changed `onNotificationOpenedApp` signature to include the remote message object as a parameter

### Updates

- Updated ReactNative to 0.73.2
- Updated Ometria native SDK - iOS 1.5.1 & Android 1.6.2 (both support quit app state notification handling)

## 2.3.0

**November 2023**

- Changed the way notifications are handled on Android
- Updated example with request for notifications permission on Android 13
- Fixed Notification trampoline (Android 12+)
- Updated to React Native 0.71.13
- Updated Ometria native SDK - iOS 1.5.0 & Android 1.6.1 (both support reinitialisation)

## 2.2.2

**July 2023**

- Updated example and library to use the latest React Native library version

## 2.2.1

**May 2023**

- Updated example to use the latest React Native and Firebase version
- Fixed a warning regarding NativeEventEmitter

## 2.2.0

**November 2022**

- Added `id` property to OmetriaBasket object
- Added `variantId` to OmetriaBasketItem object
- Added library in-line method documentation
- Deprecated wishlist events methods
- Changed example to use Firebase 9.x
- Fixed TypeScript `OmetriaBasketItem` model (`sku` is now optional)

## 2.1.0

**August 2022**

- Added optional object parameter to `Ometria.initializeWithApiToken()` to allow custom Android notification channel name
- Updated documentation

## 2.0.0

**July 2022**

### Breaking Changes

- Changed `Ometria.onNotificationInterracted()` to be called with a callback instead of a promise
- Changed `Ometria.onNewToken()` to be called on iOS as well (not only on Android)

### Updates

- Updated documentation
- Updated sample app code

## 1.2.2

**February 2022**

- Updated native Ometria SDK dependency to version 1.2.2
- Added sending React Native SDK version to backend
- Added functionality to properly support Firebase SDK v8.x

## 1.2.1

**November 2021**

- Removed bob package to fix typescript generation issues
- Added support for yarn berry
- Updated native Ometria SDK dependency to version 1.2.1
- Added functionality to expose content received in notifications from Ometria
- Updated sample application

## 1.2.0

**September 2021**

- Removed automatic screen tracking
- Added link parameter to Basket items
- Added universal link processing functionality
