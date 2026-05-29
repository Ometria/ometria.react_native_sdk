---
sidebar_position: 5
title: Order Events
---

# Order Events

## Checkout started

The user has started the checkout process.

```kotlin
trackCheckoutStartedEvent(orderId: String)
```

:::note

This event is currently only used to count page views and has no other effect in Ometria.

:::

## Order completed

The order has been completed and paid for.

```kotlin
trackOrderCompletedEvent(orderId: String, basket: OmetriaBasket)
```
