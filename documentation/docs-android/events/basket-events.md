---
sidebar_position: 4
title: Basket Events
---

# Basket Events

Track shopping cart interactions to understand purchase intent.

## Basket viewed

The user has viewed a dedicated page, screen or modal with the contents of the shopping basket.

```kotlin
trackBasketViewedEvent()
```

## Basket updated

The user has changed their shopping basket.

```kotlin
trackBasketUpdatedEvent(basket: OmetriaBasket)
```

:::info

Always send the **full current basket** - not just the updated parts. This helps recover from lost or out-of-sync events; the latest update is always authoritative.

:::

## `OmetriaBasket`

An object that describes the contents of a shopping basket.

### Properties

* `id`: (`String`, optional) - A unique identifier for this basket.
* `currency`: (`String`, required) - A string representing the currency in ISO currency format. e.g. `"USD"`, `"GBP"`.
* `totalPrice`: (`Float`, required) - Total basket price.
* `items`: (`Array[OmetriaBasketItem]`) - An array containing the item entries in this basket.
* `link`: (`String`, optional) - A deeplink to the web or in-app page for this basket. Can be used in a notification sent to the user, e.g. "Forgot to check out? Here's your basket to continue: &lt;link&gt;". Following that link should take them straight to the basket page.

## `OmetriaBasketItem`

An object representing one entry of a particular item in a basket.

It can have its own price and quantity based on different rules and promotions that are being applied.

### Properties

* `productId`: (`String`, required) - Unique product identifier.
* `sku`: (`String`, optional) - Stock keeping unit.
* `quantity`: (`Int`, required) - Number of items.
* `price`: (`Float`, required) - Price per item (currency from parent basket).
* `variantId`: (`String`, optional) - Variant product identifier.
