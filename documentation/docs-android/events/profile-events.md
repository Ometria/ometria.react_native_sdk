---
sidebar_position: 2
title: Profile Events
---

# Profile Events

## Profile identified

An app user has just identified themselves, i.e. logged in.

```kotlin
trackProfileIdentifiedByCustomerIdEvent(customerId: String, storeId: String? = null)
```

Their **customer ID** is their **user ID** in your database.

Sometimes a user only supplies their email address without fully logging in or having an account. In that case, Ometria can profile match based on email:

```kotlin
trackProfileIdentifiedByEmailEvent(email: String, storeId: String? = null)
```

Having a **customerId** makes profile matching more robust.

It's not mutually exclusive with sending an email event; for optimal integration you should send either event as soon as you have the information.

These two events are pivotal to the functioning of the SDK, so make sure you send them as early as possible.

### Store Identifier

The optional `storeId` parameter identifies which store the customer belongs to. Ometria supports multiple stores for the same ecommerce platform (e.g. separate stores for different countries).

```kotlin
// Pass with profile events
trackProfileIdentifiedByCustomerIdEvent(customerId: String, storeId: String? = null)
trackProfileIdentifiedByEmailEvent(email: String, storeId: String? = null)

// Or set separately
updateStoreId(storeId: String?)
updateStoreId(null) // reset
```

:::warning[Identifier Consistency]

If your business already integrates with Ometria, the identifiers sent here must correspond to those in other integrations.

Events are merged on Ometria's side into one cross-channel view of customer behaviour. Inconsistent email/customer IDs could result in duplicate profiles or data loss.

- The `customerId` and `email` must match what you send via the Ometria Data API
- If you specify both, **both must match**
- A typical error: the app generates a new customer ID on each login instead of using the server-generated ID stored in Ometria

**Recommendation:** Generate IDs centrally on your servers and send consistent ones through both the Ometria mobile SDK and Data API. If consistent IDs are impractical, use only email to identify contacts.

:::

## Profile deidentified

Undo a **profileIdentified** event.

Use this if a user logs out, or otherwise signals that this device is no longer attached to the same person.

```kotlin
trackProfileDeidentifiedEvent()
```

This clears the stored email, customer ID, and store identifier from local storage.

Ometria will keep tracking the user as long as they use the same app installation.
