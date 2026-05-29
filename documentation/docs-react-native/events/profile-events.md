---
sidebar_position: 2
title: Profile Events
---

# Profile Events

Profile events identify users and link their app behaviour to their Ometria profile. These events are pivotal to the functioning of the SDK, so send them as early as possible.

## Profile Identified

Track when a user logs in or identifies themselves.

| Method                                                          | Use Case                                       |
| --------------------------------------------------------------- | ---------------------------------------------- |
| `trackProfileIdentifiedEvent(customerId, email, storeId?)`      | Both identifiers available (recommended)       |
| `trackProfileIdentifiedByCustomerIdEvent(customerId, storeId?)` | Only customer ID available                     |
| `trackProfileIdentifiedByEmailEvent(email, storeId?)`           | Only email available (e.g., newsletter signup) |

```js
// Recommended unified method
Ometria.trackProfileIdentifiedEvent(
  'customer_id',
  'user@example.com',
  'store_uk' // optional
);

// Customer ID only
Ometria.trackProfileIdentifiedByCustomerIdEvent(
  'customer_id',
  'store_uk' // optional
);

// Email only
Ometria.trackProfileIdentifiedByEmailEvent(
  'user@example.com',
  'store_uk' // optional
);
```

:::tip

Having a **customerId** makes profile matching more robust. Send either event as soon as you have the information - they're not mutually exclusive.

:::

### Store Identifier

The optional `storeId` parameter identifies which store the customer belongs to. Ometria supports multiple stores for the same platform (e.g., different countries or brands).

```js
// Pass with profile events
Ometria.trackProfileIdentifiedEvent(
  'customer_id',
  'user@example.com',
  'store_uk'
);

// Or set separately
Ometria.updateStoreId('store_uk');
Ometria.updateStoreId(null); // reset
```

:::warning[Identifier Consistency]

If your business already integrates with Ometria, the identifiers sent here must correspond to those in other integrations.

Events are merged on Ometria's side into one cross-channel view of customer behaviour. Inconsistent email/customer IDs could result in duplicate profiles or data loss.

- The `customerId` and `email` must match what you send via the Ometria Data API
- If you specify both, **both must match**
- A typical error: the app generates a new customer ID on each login instead of using the server-generated ID stored in Ometria

**Recommendation:** Generate IDs centrally on your servers and send consistent ones through both the Ometria mobile SDK and Data API. If consistent IDs are impractical, use only email to identify contacts.

:::

## Profile Deidentified

Track when a user logs out:

```js
Ometria.trackProfileDeidentifiedEvent();
```

This clears the stored email, customer ID, and store identifier from local storage.

Ometria will keep tracking the user as long as they use the same app installation.
