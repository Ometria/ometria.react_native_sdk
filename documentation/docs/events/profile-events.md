---
sidebar_position: 2
title: Profile Events
---

# Profile Events

Profile events identify users and link their app behaviour to their Ometria profile.

## Profile Identified

Track when a user logs in or identifies themselves.

### By Customer ID

```js
Ometria.trackProfileIdentifiedByCustomerIdEvent('customer_id');
```

### By Email

When a user only provides their email without logging in:

```js
Ometria.trackProfileIdentifiedByEmailEvent('user@example.com');
```

### By Both (Recommended)

For the most robust profile matching:

```js
Ometria.trackProfileIdentifiedEvent('customer_id', 'user@example.com');
```

:::tip
Having a **customerId** makes profile matching more robust. Send either event as soon as you have the information.
:::

:::warning
These identifiers must match those in your e-commerce platform and Ometria data API. A common error is generating new customer IDs on each login instead of using consistent server-generated IDs.
:::

## Profile Deidentified

Track when a user logs out:

```js
Ometria.trackProfileDeidentifiedEvent();
```

This clears the stored email and customer ID from local storage. It also resets the store identifier.

## Store Identifier

Ometria supports multiple stores (e.g., different countries). You can set the store identifier in three ways:

### 1. With Profile Events

Pass an optional `storeId` parameter:

```js
Ometria.trackProfileIdentifiedByEmailEvent('user@example.com', 'store_uk');
Ometria.trackProfileIdentifiedByCustomerIdEvent('customer_id', 'store_us');
Ometria.trackProfileIdentifiedEvent('customer_id', 'user@example.com', 'store_eu');
```

### 2. Separate Method

```js
// Set store identifier
Ometria.updateStoreId('store_uk');

// Reset store identifier
Ometria.updateStoreId(null);
```

### 3. Profile Deidentified

Calling `trackProfileDeidentifiedEvent()` automatically resets the store identifier along with the customer ID and email.
