---
sidebar_position: 1
slug: /
title: Getting Started
---

# Ometria React Native SDK

Ometria helps your marketing department understand and better engage with your customers by delivering personalised emails and push notifications.

The SDK has two key objectives:

1. **Tracking customer behaviour** through events - a subset of events is automatically handled by the Ometria SDK, but you can customize it to your needs
2. **Sending and displaying push notifications** - requires app developer integration

## Before You Begin

See [Setting up your mobile app with Firebase credentials](https://support.ometria.com/hc/en-gb/articles/360013658478-Setting-up-your-mobile-app-with-Firebase-credentials) in the Ometria help centre to get an API key.

## Quick Start

### 1. Install the package

```bash
npm install react-native-ometria
# or
yarn add react-native-ometria
```

### 2. Install iOS dependencies

```bash
cd ios && pod install
```

### 3. Initialize the SDK

```js
import Ometria from 'react-native-ometria';

await Ometria.initializeWithApiToken('YOUR_API_KEY', {
  notificationChannelName: 'Example Channel Name', // optional, Android only
  appGroupIdentifier: 'group.com.yourapp', // optional, iOS only
});
```

### 4. Track user identity

```js
// When user logs in
Ometria.trackProfileIdentifiedByCustomerIdEvent('customer_id');
// or
Ometria.trackProfileIdentifiedByEmailEvent('user@example.com');
```

## What's Next?

- [Installation](./installation) - Detailed installation guide including New Architecture setup
- [Event Tracking](./events/overview) - Track customer behaviour
- [Push Notifications](./push-notifications/setup) - Set up Firebase and push notifications
- [Deep Linking](./deep-linking) - Handle app links from emails
