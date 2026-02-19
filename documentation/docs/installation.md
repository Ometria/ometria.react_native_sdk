---
sidebar_position: 2
title: Installation
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Installation

This library includes built-in support for the React Native New Architecture. While not strictly required, we strongly recommend using Expo alongside the New Architecture for the best experience. For a limited transition period, the classic bridge for the React Native Old Architecture will continue to be supported.

## 1. Install the library

<Tabs>
  <TabItem value="expo" label="Expo"  default>

The easiest way to integrate Ometria is using Expo with the config plugin. This automatically handles all native configuration.

#### 1. Install the package

<Tabs>
  <TabItem value="pnpm" label="pnpm" default>
    ```bash
    pnpm add react-native-ometria
    ```
  </TabItem>
  <TabItem value="yarn" label="yarn">
    ```bash
    yarn add react-native-ometria
    ```
  </TabItem>
  <TabItem value="npm" label="npm">
    ```bash
    npm install react-native-ometria
    ```
  </TabItem>
</Tabs>

#### 2. Configure the plugin

Add to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      // add the Ometria plugin
      ["react-native-ometria"]
    ]
  }
}
```

#### Plugin Options

| Option                   | Required | Description                                                                                                                                                                       |
| ------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| customAppGroupIdentifier | No       | Override the auto-generated iOS App Group identifier. The plugin automatically generates the `appGroupIdentifier` from your `ios.bundleIdentifier` as `group.{bundleIdentifier}`. |
| skipNSE                  | No       | Skip the Notification Service Extension setup. When `true`, rich push notification content (images, etc.) will not work on iOS. Defaults to `false`.                              |

#### 3. Run prebuild

```bash
npx expo prebuild
```

  </TabItem>
  <TabItem value="bare" label="Bare React Native">

For projects not using Expo, follow the manual setup below.

#### 1. Install the Package

<Tabs>
  <TabItem value="pnpm2" label="pnpm" default>
    ```bash
    pnpm add react-native-ometria
    ```
  </TabItem>
  <TabItem value="yarn2" label="yarn">
    ```bash
    yarn add react-native-ometria
    ```
  </TabItem>
  <TabItem value="npm2" label="npm">
    ```bash
    npm install react-native-ometria
    ```
  </TabItem>
</Tabs>

#### 2. Native Setup

<Tabs>
  <TabItem value="new-arch" label="New Architecture" default>

#### 🍏 iOS

Add the TurboModule setup to your Podfile:

```ruby
# At the top of your Podfile (after other require statements)
require_relative '../node_modules/react-native-ometria/scripts/ometria_turbomodule'

# In your post_install block
post_install do |installer|
  react_native_post_install(
    installer,
    config[:reactNativePath],
    :mac_catalyst_enabled => false
  )

  # Register Ometria TurboModule (required for New Architecture)
  patch_ometria_turbomodule(installer)
end
```

Then run:

```bash
pod install
```

:::note Why is the TurboModule patch needed?
The Ometria SDK is written in Swift, but React Native's TurboModule specs use C++ types that Swift cannot directly implement. We use an Objective-C++ wrapper (`OmetriaReactNativeSdkTurboModule`) to bridge this gap.

React Native's codegen generates a file called `RCTModuleProviders.mm` that maps module names to their implementation classes. However, codegen doesn't know about our custom wrapper class.

The `patch_ometria_turbomodule` function adds a build phase that patches `RCTModuleProviders.mm` to include our module mapping. This happens during each build, after codegen generates the file but before it's compiled.

**This is a temporary workaround** - we are actively working on a solution that won't require manual Podfile changes.
:::

:::tip
If you encounter `The Swift pod 'Ometria' depends upon 'FirebaseMessaging'` error, add this to your Podfile:

```ruby
use_frameworks! :linkage => :static
```

:::

#### 🤖 Android

New Architecture is enabled by default.

:::note Requirements
Android builds require:

- `compileSdkVersion` / `targetSdkVersion`: 36
- `minSdkVersion`: 24
:::

  </TabItem>
  <TabItem value="old-arch" label="Old Architecture">

#### 🍏 iOS

```bash
RCT_NEW_ARCH_ENABLED=0 pod install
```

:::note
If you encounter `The Swift pod 'Ometria' depends upon 'FirebaseMessaging'` error, add this to your Podfile:

```ruby
use_frameworks! :linkage => :static
```

:::

#### 🤖 Android

Set in `android/gradle.properties`:

```properties
newArchEnabled=false
```

    </TabItem>

  </Tabs>

      </TabItem>

    </Tabs>

---

## 2. Initialize the SDK

After installation, initialize the SDK in your app:

```js
import Ometria from 'react-native-ometria';

await Ometria.initializeWithApiToken('API_KEY', {
  // optional params
});
```

:::warning Ometria needs to be initialized first
Any other Ometria methods must be called **after** initialization.
:::

#### Optional Parameters

| Parameter               | Platform | Description                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| notificationChannelName | Android  | Custom name for the notification channel. Default is blank.                                                                                                                                                                                                                                                                                                                                      |
| appGroupIdentifier      | iOS      | Specifies the App Group identifier used by the Notification Service Extension.<br/><br/>Expo projects: by default, this value is set to `group.{bundleIdentifier}`. You may override it if a different identifier is needed.<br/><br/>Bare React Native: this value must match the App Group configured in Xcode. Refer to [iOS Push Setup](./push-notifications/notification-service-extension) for configuration details. |

:::tip Reinitialization
Since version 2.3.0, the SDK allows for reinitialization of the Ometria instance. You can call `initializeWithApiToken` again later in the app if needed.
:::

---

## 3. Start Tracking Events

After initialization, you can start tracking customer behaviour:

```js
// Identify the user
Ometria.trackProfileIdentifiedByEmailEvent('user@example.com');

// Track a product view
Ometria.trackProductViewedEvent('product-123');

// Track adding to basket
Ometria.trackBasketUpdatedEvent({
  totalPrice: 29.99,
  id: 'basket-456',
  currency: 'USD',
  items: [{ productId: 'product-123', quantity: 1, sku: 'SKU123' }],
});
```

See [Event Tracking](./events/overview) for the complete list of available events.
