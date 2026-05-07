---
sidebar_position: 5
title: Order Events
---

# Order Events

Track checkout and purchase completion.

## Checkout Started

Track when the user begins the checkout process:

```js
Ometria.trackCheckoutStartedEvent('order_123');
```

:::note

This event is currently only used to count page views and has no other effect in Ometria.

:::

## Order Completed

Track when an order is completed and paid:

```js
const items: OmetriaBasketItem[] = [
  {
    productId: 'product-1',
    sku: 'sku-product-1',
    quantity: 1,
    price: 12.0,
  },
  {
    productId: 'product-2',
    sku: 'sku-product-2',
    quantity: 2,
    price: 9.0,
  },
];

Ometria.trackOrderCompletedEvent('order_123', {
  totalPrice: 30.0,
  id: 'basket_123',
  currency: 'USD',
  items,
  link: 'https://yourstore.com/order/123',
});
```

**Parameters**

| Parameter | Type            | Required | Description                               |
| --------- | --------------- | -------- | ----------------------------------------- |
| `orderId` | `string`        | Yes      | Unique order identifier                   |
| `basket`  | `OmetriaBasket` | No       | Optional basket object with order details |

**Example: Complete Checkout Flow**

```js
import Ometria, { OmetriaBasketItem } from 'react-native-ometria';

const basketItems: OmetriaBasketItem[] = [
  { productId: 'shirt-001', quantity: 1, price: 49.99 },
  { productId: 'pants-002', quantity: 1, price: 79.99 },
];

const basket = {
  totalPrice: 129.98,
  currency: 'USD',
  items: basketItems,
};

// User starts checkout
Ometria.trackCheckoutStartedEvent('order_456');

// ... user completes payment ...

// Order completed
Ometria.trackOrderCompletedEvent('order_456', basket);
```
