---
sidebar_position: 1
title: Overview
---

# Event Tracking

You need to track your users' behaviour to understand them. Some behaviour is automatically detected, while other events need to be manually tracked. Many of these methods have analogous events in our [website tracker](https://support.ometria.com/hc/en-gb/articles/4405356106653-JavaScript-tracker).

## Automatically Tracked Events

These events are tracked automatically once the SDK is initialized:

| Event                        | Description                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Application installed**    | App was installed (sent on first launch)                                                                                  |
| **Application launched**     | App was launched                                                                                                          |
| **Application foregrounded** | App brought to foreground from background                                                                                 |
| **Application backgrounded** | App sent to background                                                                                                    |
| **Notification received**    | Push notification received in quit state (iOS only, requires [Notification Service Extension](../push-notifications/notification-service-extension)) |

## Manually Tracked Events

See the following guides for details on each event type:

- [Profile Events](./profile-events) - User identification and logout
- [Product Events](./product-events) - Product views and listings
- [Basket Events](./basket-events) - Shopping cart interactions
- [Order Events](./order-events) - Checkout and purchases
- [Custom Events](./custom-events) - App-specific events

## Event Batching

To reduce power and bandwidth consumption, events are batched and sent when:

- 10 events have been collected
- Firebase token is refreshed
- A notification is received
- App is foregrounded or backgrounded

### Manual Flush

Send all pending events immediately:

```js
Ometria.flush();
```

### Clear Events

Clear all tracked events that haven't been flushed:

```js
Ometria.clear();
```
