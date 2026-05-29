---
sidebar_position: 5
title: Order Events
---

# Order Events

## Checkout started

The user has started the checkout process.

```swift
trackCheckoutStartedEvent(orderId: String? = nil)
```

`orderId` is optional — pass it when you have one, otherwise omit.

:::note

This event is currently only used to count page views and has no other effect in Ometria.

:::

## Order Completed

The order has been completed and paid for:

```swift
trackOrderCompletedEvent(orderId: String, basket: OmetriaBasket? = nil)
```

`basket` is optional. See [Basket Events](./basket-events.md) for the `OmetriaBasket` data type.
