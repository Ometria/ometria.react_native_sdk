---
sidebar_position: 3
title: Product Events
---

# Product Events

Track user interactions with products to understand customer interests.

## Product Viewed

Track when a user shows interest in a specific product (clicks, taps, views, or highlights):

```js
Ometria.trackProductViewedEvent('product_id');
```

**Parameters:**

| Parameter   | Type     | Description                           |
| ----------- | -------- | ------------------------------------- |
| `productId` | `string` | The unique identifier for the product |

**When to use:**

- User selects a product from search results
- User browses a category and clicks on a specific item
- User views a product detail page

## Product Listing Viewed

Track when a user clicks, taps, views, or otherwise shows interest in a product listing. This includes search results, listings of products in a group, category, collection, or any other screen that presents a list of products.

For example, if a store sells clothing and the visitor taps on "Women's Footwear" to see products in that category, or searches for "blue jumper" and sees matching results.

```js
Ometria.trackProductListingViewedEvent(listingType, listingAttributes);
```

**Parameters:**

| Parameter           | Type     | Description                                                                                                                                                    |
| ------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listingType`       | `string` | Any string to identify the listing page type. We recommend "category" for category pages or "search" for search results. Helps identify what kind of page was viewed. |
| `listingAttributes` | `object` | Object with `type` and `id` fields (see below).                                                                                                                |

**Listing Attributes:**

| Field  | Type     | Description                                                                        |
| ------ | -------- | ---------------------------------------------------------------------------------- |
| `type` | `string` | An attribute that exists in the Ometria database (e.g., "shoe-colour", "category") |
| `id`   | `string` | The attribute identifier as it exists in the Ometria database (e.g., "red")         |

Both `type` and `id` are required to correctly specify attributes.

**Example:**

```js
Ometria.trackProductListingViewedEvent('category', {
  type: 'shoe-colour',
  id: 'red',
});
```

**When to use:**

- Search results pages
- Category listings
- Collection pages
- Any screen showing multiple products
