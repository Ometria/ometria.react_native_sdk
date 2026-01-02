---
sidebar_position: 6
title: Troubleshooting (draft)
---

# Troubleshooting

Common issues and solutions when working with the Ometria React Native SDK.

## FirebaseMessaging Swift Pod Error

If you see `The Swift pod 'Ometria' depends upon 'FirebaseMessaging'` error when running `pod install`:

```ruby
# Add to your Podfile
use_frameworks! :linkage => :static
```

## TypeScript Build Issues

If you have TypeScript errors related to the example folder:

```json
{
  "exclude": ["example"]
}
```

## Debugging

Enable advanced logging to see what's happening in the background:

```js
Ometria.isLoggingEnabled(true);
```

Ometria logs any errors encountered during runtime by default. These logs are accessible in your development environment's console.

:::tip
For a complete working example, see the [example-expo](https://github.com/Ometria/ometria.react-native-sdk/tree/main/example-expo) directory.
:::
