<div align="center">
  <img src="https://mobile-sdk.docs.ometria.com/img/logo.svg" alt="Ometria" width="120" height="120" />
  <h1>Ometria React Native SDK</h1>
  <p>
    <strong>Ometria helps your marketing department understand and better engage with your customers by delivering personalised emails and push notifications.</strong>
  </p>
  <p>
    <a href="https://mobile-sdk.docs.ometria.com/react-native"><strong>📚 Read the documentation »</strong></a>
  </p>
</div>

---

The app has two key objectives:

- **Getting information about customers** (what do they like?)
- **Reaching out to customers** (saying the right thing to the right people)

For your mobile app, this means:

- **Tracking customer behaviour** through events. A subset of events is automatically handled by the Ometria SDK, but you have to customize it to your needs. [See the event tracking plan ↗](https://support.ometria.com/hc/en-gb/articles/360018440917-Creating-an-event-tracking-plan-for-your-mobile-app)
- **Sending and displaying push notifications**, which requires app developer integration

You can also look at the sample apps we have included for reference implementations. [See example-expo ↗](https://github.com/Ometria/ometria.react_native_sdk/tree/master/example-expo)

**Before you begin**, visit the Ometria help centre and follow the steps there to get an API key. [Get an API key ↗](https://support.ometria.com/hc/en-gb/articles/360013658478-Setting-up-your-mobile-app-with-Firebase-credentials)

## Quick start

The recommended setup for new projects is Expo with the New Architecture.

**1. Install the package**

```sh
pnpm add react-native-ometria
# or
yarn add react-native-ometria
# or
npm install react-native-ometria
```

**2. Add the Ometria and Firebase plugins to your `app.json` / `app.config.ts`**

```json
{
  "expo": {
    "plugins": [
      ["react-native-ometria"],
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static",
            "forceStaticLinking": ["RNFBApp", "RNFBMessaging"]
          }
        }
      ]
    ]
  }
}
```

**3. Start using the SDK**

```js
import Ometria from 'react-native-ometria';

...

Ometria.initializeWithApiToken('YOUR_API_KEY').then(() => {
  Ometria.trackProfileIdentifiedByEmailEvent('user@example.com');
});
```

## Documentation

- [Installation](https://mobile-sdk.docs.ometria.com/react-native/installation) - Detailed installation guide including bare React Native setup
- [Event Tracking](https://mobile-sdk.docs.ometria.com/react-native/events/overview) - Track customer behaviour
- [Push Notifications](https://mobile-sdk.docs.ometria.com/react-native/push-notifications/setup) - Set up Firebase and push notifications
- [Deep Linking](https://mobile-sdk.docs.ometria.com/react-native/deep-linking) - Handle app links from emails
