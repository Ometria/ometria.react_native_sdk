---
sidebar_position: 5
title: Deep Linking
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# App Links & Deep Linking

Ometria sends personalised emails with URLs that point to your website. Configure your app to open these URLs directly.

## Prerequisites

You need an SSL-enabled Ometria tracking domain. Contact your Ometria representative if you don't have one.

## 1. Platform Setup

<Tabs>
  <TabItem value="expo" label="Expo" default>

### Configure Associated Domains (iOS)

Add your Ometria tracking domain to `associatedDomains` in your `app.json`:

```json
{
  "expo": {
    "ios": {
      "associatedDomains": ["applinks:your-tracking-domain.com"]
    }
  }
}
```

### Configure Intent Filters (Android)

Add an `intentFilters` entry in your `app.json`:

```json
{
  "expo": {
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "your-tracking-domain.com"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

These configurations are applied automatically during `npx expo prebuild`.

  </TabItem>
  <TabItem value="bare" label="Bare React Native">

### iOS Setup

#### Enable Associated Domains

1. In Xcode, select your project
2. Go to **Signing & Capabilities**
3. Add the **Associated Domains** capability
4. Add your domain: `applinks:your-tracking-domain.com`

#### Update AppDelegate

Add to `AppDelegate.m` (or `AppDelegate.mm`):

```objective-c
- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation
{
  return [RCTLinkingManager application:application
                                openURL:url
                      sourceApplication:sourceApplication
                             annotation:annotation];
}

// For Universal Links
- (BOOL)application:(UIApplication *)application
    continueUserActivity:(NSUserActivity *)userActivity
      restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler
{
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}
```

### Android Setup

Add to `android/app/src/main/AndroidManifest.xml` inside your main `<activity>`:

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
        android:host="your-tracking-domain.com"
        android:scheme="https" />
</intent-filter>
```

  </TabItem>
</Tabs>

## 2. Apple App Site Association

Create an `apple-app-site-association` file:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.yourcompany.yourapp",
        "paths": ["*"]
      }
    ]
  }
}
```

Replace `TEAM_ID` with your Apple Developer Team ID (found in your Apple Developer account under Membership) and `com.yourcompany.yourapp` with your app's bundle identifier.

The `apple-app-site-association` file must be:

- Hosted at `https://your-tracking-domain.com/.well-known/apple-app-site-association`
- Served with `Content-Type: application/json`
- Accessible without redirects
- Available over HTTPS

**Send this file to your Ometria contact** who will host it on your tracking domain.

## 3. Processing Links

Ometria email links are obfuscated tracking URLs. Convert them to original URLs using `processUniversalLink`:

```js
import Ometria from 'react-native-ometria';
import { Linking } from 'react-native';

// Handle incoming links
const handleUrl = async ({ url }) => {
  try {
    // Convert Ometria tracking URL to original URL
    const originalUrl = await Ometria.processUniversalLink(url);
    handleDeepLink(originalUrl);
  } catch (error) {
    // Not an Ometria link, handle normally
    handleDeepLink(url);
  }
};

// Subscribe to incoming links
Linking.addEventListener('url', handleUrl);

// Check if app was opened via a link
const initialUrl = await Linking.getInitialURL();
if (initialUrl) {
  handleUrl({ url: initialUrl });
}

function handleDeepLink(url) {
  // Parse URL and navigate to appropriate screen
  const path = new URL(url).pathname;

  if (path.startsWith('/product/')) {
    const productId = path.split('/')[2];
    navigation.navigate('Product', { productId });
  } else if (path.startsWith('/category/')) {
    const categoryId = path.split('/')[2];
    navigation.navigate('Category', { categoryId });
  }
  // ... handle other paths
}
```

## 4. Linking to App Screens

The `handleDeepLink` function in the example above is something **you need to build** in your app. It should map your website URLs to the corresponding app screens using your navigation library.

Here are some common URL-to-screen mappings as a starting point:

| URL Pattern     | App Screen       |
| --------------- | ---------------- |
| `/product/:id`  | Product detail   |
| `/category/:id` | Category listing |
| `/cart`         | Shopping cart    |
| `/account`      | User profile     |
| `/orders/:id`   | Order detail     |

See [Linking push notifications to app screens](https://support.ometria.com/hc/en-gb/articles/4402644059793-Linking-push-notifications-to-app-screens) in the Ometria help centre for more guidance.

## 5. Deep Link Opened

Track when a user opens a deep link from a notification:

```js
Ometria.trackDeepLinkOpenedEvent('/profile', 'ProfileScreen');
```

See [Handling Notification URLs](./push-notifications/setup#7-handling-notification-urls) for more details.
