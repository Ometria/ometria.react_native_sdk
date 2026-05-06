---
sidebar_position: 4
title: Basket Events
---

# Basket Events

## Basket viewed

The visitor has viewed a dedicated page, screen or modal with the contents of the shopping basket:

```swift
trackBasketViewedEvent()
```

## Basket updated

The visitor has changed their shopping basket:

```swift
trackBasketUpdatedEvent(basket: OmetriaBasket)
```

This event takes the full current basket as a parameter - not just the updated parts.

This helps recover from lost or out of sync basket events: the latest update is always authoritative.

## `OmetriaBasket`

An object that describes the contents of a shopping basket.

### Properties

* `currency`: (`String`, required) - A string representing the currency in ISO currency format. e.g. `"USD"`, `"GBP"`
* `price`: (`float`, required) - A float value representing the pricing.
* `items`: (`Array[OmetriaBasketItem]`) - An array containing the item entries in this basket.
* `link`: (`String`) - A deeplink to the web or in-app page for this basket. Can be used in a notification sent to the user, e.g. "Forgot to check out? Here's your basket to continue: ". Following that link should take them straight to the basket page.

## `OmetriaBasketItem`

An object that describes the contents of a shopping basket.

It can have its own price and quantity based on different rules and promotions that are being applied.

### Properties

* `productId`: (`String`, required) - A string representing the unique identifier of this product.
* `sku`: (`String`, optional) - A string representing the stock keeping unit, which allows identifying a particular item.
* `quantity`: (`Int`, required) - The number of items that this entry represents.
* `price`: (`Float`, required) - Float value representing the price for one item. The currency is established by the OmetriaBasket containing this item
