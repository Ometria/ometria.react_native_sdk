---
sidebar_position: 2
title: Installation
---

# Installation

## 1. Install the library

### Step 1 - Add the Ometria-android library as a gradle dependency:

We publish builds of our library to the **Maven central repository** as an .aar file.

This file contains all of the classes, resources, and configurations that you'll need to use the library.

To install the library inside **Android Studio**, declare it as dependency in your app level `build.gradle` file:

```gradle
dependencies {
    implementation 'com.ometria:android-sdk:1.11.2'
}
```

### Step 2 - Perform Gradle Sync:

Perform a **Gradle Sync** to build your project and incorporate the dependency additions noted above:

![Screenshot 2020-08-13 at 16 47 21](https://user-images.githubusercontent.com/8706456/91582697-d51c0a80-e958-11ea-96eb-46f0d49c3d59.png)

This downloads the aar dependency, giving you access to the Ometria library API calls.

If it can't find the dependency, you should make sure you've specified `mavenCentral()` as a repository in your `build.gradle`.

## 2. Initialise the library

Once you've set up your build system or IDE to use the Ometria library, you can initialise it in your code.

We recommend initialising the SDK in your Application subclass. You'll need to provide:
* the application context;
* your Ometria API token;
* the notifications icon;
* the notifications color (optional), and;
* the notifications channel name (optional).

```kotlin
Ometria.initialize(
    application = this,
    apiToken = "YOUR_API_KEY",
    notificationIcon = R.drawable.ic_notification_nys,
    notificationColor = ContextCompat.getColor(this, R.color.colorAccent),
    notificationChannelName = "Custom Channel Name"
)
```

Ometria logs any errors encountered during runtime by default. See [Troubleshooting](./troubleshooting.md) if you want to enable advanced logging.

## 3. Using multiple Ometria API tokens within the same app instance (Reinitializing the SDK)

There are cases where different flows of an application should log events under different tokens (think of different user roles, or other similar scenarios).
To address this, we offer the possibility of reinitializing the Ometria SDK. Although we currently do not keep references to multiple instances of the SDK,
we ensure that on reinitialization there will be a flush attempt for all the events that have been logged up to that point on the old instance.

Reinitializing the SDK requires the exact steps as a normal initialization.
