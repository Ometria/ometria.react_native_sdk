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

## Profile deidentified

Undo a **profileIdentified** event.

Use this if a user logs out, or otherwise signals that this device is no longer attached to the same person.

```kotlin
trackProfileDeidentifiedEvent()
```

## Update store identifier

Ometria supports multiple stores for the same ecommerce platform (e.g. separate stores for different countries).
There are three different ways to update the store identifier:

1. Using an optional parameter in the `profileIdentified` events tracking methods

```kotlin
trackProfileIdentifiedByCustomerIdEvent(customerId: String, storeId: String? = null)
trackProfileIdentifiedByEmailEvent(email: String, storeId: String? = null)
```

When omitting the `storeId` parameter, or providing a `null` value, the store identifier will not be affected in any way. Only sending a valid, non-null parameter will cause the store identifier to be updated to that value.

2. Using the dedicated method that allows setting/resetting the store identifier

```kotlin
updateStoreId(storeId: String?)
```

* with a null `storeId` parameter, the method resets the store identifier.
* with a non-null `storeId` parameter, the method sets the store identifier to the provided value.

3. Using the `profileDeidentified` event
Tracking a profile deidentified event, will reset the `customerId`, the `email`, and the `storeId` for the current app installment.
