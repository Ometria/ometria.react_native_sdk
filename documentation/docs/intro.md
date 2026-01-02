---
sidebar_position: 1
slug: /
title: Getting Started
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Ometria React Native SDK

Ometria helps your marketing department understand and better engage with your customers by delivering personalised emails and push notifications. The app has two key objectives:

- **Getting information about customers** (what do they like?)
- **Reaching out to customers** (saying the right thing to the right people)

For your mobile app, this means:

- **Tracking customer behaviour** through events - a subset of events is automatically handled by the Ometria SDK, but you have to customize it to your needs [↗](https://support.ometria.com/hc/en-gb/articles/360018440917-Creating-an-event-tracking-plan-for-your-mobile-app)
- **Sending and displaying push notifications** - requires app developer integration

You can also look at the sample apps we have included for reference implementations. [↗](https://github.com/Ometria/ometria.react-native-sdk/tree/main/example-expo)

**Before you begin** you need to get an API key from Ometria. [↗](https://support.ometria.com/hc/en-gb/articles/360013658478-Setting-up-your-mobile-app-with-Firebase-credentials)

## Quick Start

This is the recommended setup for new projects using Expo with the New Architecture.

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
  <TabItem value="npm" label="npm" >
    ```bash
    npm install react-native-ometria
    ```
  </TabItem>
</Tabs>

#### 2. Add the Expo plugin to your `app.json` or `app.config.ts`

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

#### 3. Start using the SDK

```js
import Ometria from 'react-native-ometria';

...

Ometria.initializeWithApiToken('YOUR_API_KEY');

// Track user identity
Ometria.trackProfileIdentifiedByEmailEvent('user@example.com');
```

## What's Next?

- [Installation](./installation) - Detailed installation guide including bare React Native setup
- [Event Tracking](./events/overview) - Track customer behaviour
- [Push Notifications](./push-notifications/setup) - Set up Firebase and push notifications
- [Deep Linking](./deep-linking) - Handle app links from emails

:::tip
For a complete working example, see the [example-expo](https://github.com/Ometria/ometria.react-native-sdk/tree/main/example-expo) directory in the SDK repository.
:::
