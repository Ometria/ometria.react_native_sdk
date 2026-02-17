---
sidebar_position: 6
title: Troubleshooting
---

# Troubleshooting

Common issues and solutions when working with the Ometria React Native SDK.

## Enable Logging

The first step when debugging any issue is to enable verbose logging:

```js
Ometria.isLoggingEnabled(true);
```

Ometria logs errors to the console by default. Filter for "Ometria" in your development console to see SDK-specific messages.

## iOS

### `The Swift pod 'Ometria' depends upon 'FirebaseMessaging'`

This happens because the Ometria SDK is written in Swift and requires static frameworks. Add to your Podfile:

```ruby
use_frameworks! :linkage => :static
```

Then run `pod install` again.

### Foreground notifications are not displayed

This is a [known Firebase behaviour](https://rnfirebase.io/messaging/notifications), not an Ometria issue. When the app is in the foreground, the OS does not display notifications — the data is delivered via `onMessage` instead.

You need to display your own notification UI. See [Handle Foreground Notifications](./push-notifications/setup#4-handle-foreground-notifications) for details.

## Android

### `trackProfileIdentifiedEvent` swaps `customerId` and `email`

This was a bug in versions before 2.7.0 where the parameters were passed in the wrong order on Android. Update to 2.7.0 or later to fix this.

## Expo

### Changes to `app.json` are not reflected in the build

Run `npx expo prebuild --clean` to regenerate the native projects from scratch. A regular `prebuild` may not pick up all configuration changes.

## Resources

For a complete working example, see the [example-expo](https://github.com/Ometria/ometria.react-native-sdk/tree/main/example-expo) directory in the SDK repository.
