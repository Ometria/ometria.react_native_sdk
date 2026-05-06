---
sidebar_position: 5
title: Order Events
---

# Order Events

## Checkout started

The user has started the checkout process.

```swift
trackCheckoutStartedEvent(orderId: String)
```

## Order Completed

The order has been completed and paid for:

```swift
trackOrderCompletedEvent(orderId: String, basket: OmetriaBasket)
```

See [Basket Events](./basket-events.md) for the `OmetriaBasket` data type.
