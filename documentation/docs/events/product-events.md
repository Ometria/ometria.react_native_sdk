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

**When to use:** User selects a product from search results, browses a category and clicks on a specific item, or views a product detail page.

## Product Listing Viewed

Track when a user views a list of products:

```js
Ometria.trackProductListingViewedEvent('category', {
  type: 'shoe-colour',
  id: 'red',
});
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `listingType` | `string` | Type of listing (e.g., "category", "search"). Helps identify the page type. |
| `listingAttributes` | `object` | Object with `type` and `id` that match attributes in your Ometria database. |

### Examples

**Category page:**

```js
Ometria.trackProductListingViewedEvent('category', {
  type: 'category',
  id: 'womens-footwear',
});
```

**Search results:**

```js
Ometria.trackProductListingViewedEvent('search', {
  type: 'search-term',
  id: 'blue-jumper',
});
```

**When to use:**
- Search results pages
- Category listings
- Collection pages
- Any screen showing multiple products

## Home Screen Viewed

Track when a user views the app's home page or landing screen:

```js
Ometria.trackHomeScreenViewedEvent();
```

## Screen Viewed

Track views of custom screens that are useful for marketing engagement:

```js
Ometria.trackScreenViewedEvent('OnboardingScreen', { step: '3', variant: 'B' });
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `screenName` | `string` | Name of the screen |
| `additionalInfo` | `object` | Optional additional data about the screen |

**When to use:** Promotion screens, onboarding flows, feature highlights, or any screen where marketing might want to track engagement.
