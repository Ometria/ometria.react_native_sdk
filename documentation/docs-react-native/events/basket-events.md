---
sidebar_position: 4
title: Basket Events
---

# Basket Events

Track shopping cart interactions to understand purchase intent.

## Basket Viewed

Track when a user views a dedicated page, screen, or modal with the contents of their shopping basket:

```js
Ometria.trackBasketViewedEvent();
```

## Basket Updated

Track when the shopping cart contents change:

```js
const items: OmetriaBasketItem[] = [
  {
    productId: 'product-1',
    sku: 'sku-product-1',
    quantity: 1,
    price: 12.0,
    variantId: 'variant-1',
  },
  {
    productId: 'product-2',
    sku: 'sku-product-2',
    quantity: 2,
    price: 9.0,
    variantId: 'variant-2',
  },
];

Ometria.trackBasketUpdatedEvent({
  totalPrice: 30.0,
  id: 'basket_123',
  currency: 'USD',
  items,
  link: 'https://yourstore.com/basket/123',
});
```

:::info

Always send the **full current basket** - not just the updated parts. This helps recover from lost or out-of-sync events; the latest update is always authoritative.

:::

## Data Types

### OmetriaBasket

| Property     | Type                  | Required | Description                                                            |
| ------------ | --------------------- | -------- | ---------------------------------------------------------------------- |
| `id`         | `string`              | No       | Unique identifier for this basket                                      |
| `currency`   | `string`              | Yes      | ISO 4217 currency code (e.g., "USD", "GBP")                            |
| `totalPrice` | `number`              | Yes      | Total basket price                                                     |
| `items`      | `OmetriaBasketItem[]` | Yes      | Array of basket items                                                  |
| `link`       | `string`              | No       | A deeplink to the web or in-app page for this basket. Can be used in a notification sent to the user, e.g. "Forgot to check out? Here's your basket to continue: &lt;link&gt;". Following that link should take them straight to the basket page. |

### OmetriaBasketItem

| Property    | Type     | Required | Description                                  |
| ----------- | -------- | -------- | -------------------------------------------- |
| `productId` | `string` | Yes      | Unique product identifier                    |
| `sku`       | `string` | No       | Stock keeping unit                           |
| `quantity`  | `number` | Yes      | Number of items                              |
| `price`     | `number` | Yes      | Price per item (currency from parent basket) |
| `variantId` | `string` | No       | Variant product identifier                   |

**Example: Complete Basket Flow**

```js
import Ometria, { OmetriaBasketItem } from 'react-native-ometria';

// User adds first item
const items: OmetriaBasketItem[] = [
  { productId: 'shoe-001', quantity: 1, price: 89.99 },
];

Ometria.trackBasketUpdatedEvent({
  totalPrice: 89.99,
  currency: 'GBP',
  items,
});

// User adds another item
items.push({ productId: 'sock-002', quantity: 2, price: 12.99 });

Ometria.trackBasketUpdatedEvent({
  totalPrice: 115.97,
  currency: 'GBP',
  items,
});

// User views basket
Ometria.trackBasketViewedEvent();
```
