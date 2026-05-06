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

## Order completed

The order has been completed and paid for.

```kotlin
trackOrderCompletedEvent(orderId: String, basket: OmetriaBasket)
```
