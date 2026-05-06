---
sidebar_position: 5
title: Deep Linking
---

# App links guide

Ometria sends personalised emails with URLs that point back to your website. In order to open these URLs inside your application, make sure you follow this guide.

## Pre-requisites

First, make sure you have an SSL-enabled Ometria tracking domain set up for your account. You may already have this for
your email campaigns, but if not ask your Ometria contact to set one up, and they should provide you with the domain.

## Handle App Links inside your application

To add Android App Links to your app, define intent filters that open your app content using HTTP URLs. Intent filters for incoming links
will be added inside your **AndroidManifest** file, the following XML snippet is an example (assuming "clickom.omdemo.net" is the tracking domain):

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

This will ensure that when your customers click on links in Ometria emails, your app opens instead of the browser.

**Note:** This does not associate your website's domain with the app, only the tracking domain.

Find more about Android App Links [here](https://developer.android.com/training/app-links/verify-site-associations).

## Create a digital asset links JSON file and send it to your Ometria contact.

The Digital Asset Links JSON file is used to create a relationship between a domain and your app. [You can find more info about it here](https://developer.android.com/training/app-links/verify-site-associations#web-assoc).
A basic example should look like this:

```javascript
[
  {
    "relation": [ "delegate_permission/common.handle_all_urls" ],
    "target": {
      "namespace": "android_app",
      "package_name": "com.android.sample",
      "sha256_cert_fingerprints": ["51:5B:24:4B:C7:A4:7F:D2:FA:B2:C7:23:73:7A:A0:91:A5:B6:29:49:08:73:E1:51:7E:CF:60:28:53:65:47:25"]
    }
  }
]
```

Save it and name it "assetlinks.json". Then send it to your Ometria contact - we will upload this for you so that it will be available behind the
tracking domain.

## Process App Links inside your application

The final step is to process the URLs in your app and take the user to the appropriate sections of the app. Note that
you need to implement the mapping between your website's URLs and the screens of your app.

See also [Linking push notifications to app screens](https://support.ometria.com/hc/en-gb/articles/4402644059793-Linking-push-notifications-to-app-screens).

If you are dealing with normal URLs pointing to your website, you can decompose it into different path components and parameters. This will allow you to source the required information to navigate through to the correct screen in your app.

However, Ometria emails contain obfuscated tracking URLs, and these need to be converted back to the original URL, pointing to your website, before you can map the URL to an app screen. To do this, the SDK provides a method called `processAppLink`:

```kotlin
private fun handleAppLinkFromIntent() {
    // you can check here whether the URL is one that you can handle without converting it back
    intent.dataString?.let { url ->
        Ometria.instance().processAppLink(url, object : ProcessAppLinkListener {
            override fun onProcessResult(url: String) {
                // you can now handle the retrieved url as you would any other url from your website
            }

            override fun onProcessFailed(error: String) {
                // an error may have occurred
            }
        })
    }
}
```

**Warning**: The method above runs asynchronously. Depending on the Internet speed on the device, processing time can vary. For best results, you could implement a loading state that is displayed while the URL is being processed.

If you have done everything correctly, the app should now be able to open app links and allow you to handle them inside the app.

## Deep link opened

Based on the implementation status of interaction with notifications that contain deeplinks, this event can be automatically tracked or not.

The default implementation will automatically log a deep link opened event every time the user interacts with a notification that has a deep link. This is possible because we know that the default implementation will open the link in a browser.

If you chose to handle deep links yourself (see: [Handling interaction with notifications that contain URLs](./push-notifications/handling-interaction.md)) then you should manually track this event when you have enough information about the screen (or other destination) that the app will open.

```kotlin
trackDeepLinkOpenedEvent(link: String, page: String)
```
