---
sidebar_position: 3
title: Product Events
---

# Product Events

## Product viewed

A visitor clicks/taps/views/highlights or otherwise shows interest in a product.

E.g. the visitor searches for a term and selects one of the product previews from a set of results, or browses a category of clothes, and clicks on a specific shirt to see a bigger picture.

This event is about capturing interest from the visitor for this product.

```swift
trackProductViewedEvent(productId: String)
```

## View list of products

The visitor clicks/taps/views/highlights or otherwise shows interest in a product listing. This kind of screen includes search results, listings of products in a group, category, collection or any other screen that presents a list of products.

E.g., A store sells clothing, and the visitor taps on "Women's Footwear" to see a list of products in that category, or they search for "blue jumper" and see a list of products in that category.

This event should be triggered on:

* search results
* category lists
* any similar screens

```swift
trackProductListingViewedEvent(listingType: String?, listingAttributes: [String: Any]?)
```

The `listingType` parameter can be any string the client chooses (currently has no effect, but helps us and the client to see what kind of listing page the user viewed). We recommend setting this to "category" for example for category pages or "search" for a search results page.
The `listingAttributes` parameter should be an object that consists of 2 fields:
* "type" which should be an attribute that exists in the Ometria database. For example "shoe-colour".
* "id" which should be an attribute their_id that exists in the Ometria database. For example "red".

Both "id" and "type" are needed to correctly specify attributes.
