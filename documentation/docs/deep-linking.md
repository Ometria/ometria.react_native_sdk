---
sidebar_position: 5
title: Deep Linking
---

# App Links & Deep Linking

Ometria sends personalised emails with URLs that point to your website. Configure your app to open these URLs directly.

## Prerequisites

You need an SSL-enabled Ometria tracking domain. Contact your Ometria representative if you don't have one.

## iOS Setup

### Enable Associated Domains

1. In Xcode, select your project
2. Go to **Signing & Capabilities**
3. Add the **Associated Domains** capability
4. Add your domain: `applinks:your-tracking-domain.com`

### Create apple-app-site-association

Create an `apple-app-site-association` file and send it to your Ometria contact:

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

### Update AppDelegate

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

## Android Setup

Add to `android/app/src/main/AndroidManifest.xml`:

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

## Processing Links

Ometria email links are obfuscated tracking URLs. Convert them to original URLs using `processUniversalLink`:

```js
import Ometria from 'react-native-ometria';
import { Linking } from 'react-native';

// Handle incoming links
Linking.addEventListener('url', async ({ url }) => {
  try {
    // Convert Ometria tracking URL to original URL
    const originalUrl = await Ometria.processUniversalLink(url);

    // Now navigate based on the original URL
    handleDeepLink(originalUrl);
  } catch (error) {
    // Not an Ometria link, handle normally
    handleDeepLink(url);
  }
});

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

## Linking to App Screens

See [Linking push notifications to app screens](https://support.ometria.com/hc/en-gb/articles/4402644059793-Linking-push-notifications-to-app-screens) in the Ometria help centre.

You need to implement the mapping between your website URLs and app screens. Common patterns:

| URL Pattern | App Screen |
|-------------|------------|
| `/product/:id` | Product detail |
| `/category/:id` | Category listing |
| `/cart` | Shopping cart |
| `/account` | User profile |
| `/orders/:id` | Order detail |
