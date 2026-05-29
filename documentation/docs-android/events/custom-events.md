---
sidebar_position: 7
title: Custom Events
---

# Custom Events

Track app-specific actions that are relevant to your marketing team.

## When to Use Custom Events

Custom events are useful when:

- Marketing wants to trigger [automation campaigns](https://support.ometria.com/hc/en-gb/articles/360011378398-Automation-campaigns-overview) based on specific user actions
- You need to track app-specific flows or interactions
- Users interact with promotional content or special features

**Examples:**

- User signs up for a promotion
- User completes onboarding
- User enables notifications
- User refers a friend
- User uses a specific feature

Check with the marketing team about the specifics, and what they might need. Especially if they're already using Ometria for email, they will know about automation campaigns and custom events.

## Tracking Custom Events

```kotlin
Ometria.instance().trackCustomEvent(
    customEventType = "promotion_signup",
    additionalInfo = mapOf(
        "promotionId" to "summer-sale-2024",
        "source" to "homepage-banner"
    )
)
```

### Parameters

| Parameter         | Type             | Required | Description                     |
| ----------------- | ---------------- | -------- | ------------------------------- |
| `customEventType` | `String`         | Yes      | Custom event type identifier    |
| `additionalInfo`  | `Map<String, Any>` | No     | Additional data about the event |

## Examples

**Promotion signup:**

```kotlin
Ometria.instance().trackCustomEvent(
    customEventType = "promotion_signup",
    additionalInfo = mapOf(
        "promotionId" to "black-friday-2024",
        "discountCode" to "BF24"
    )
)
```

**Feature usage:**

```kotlin
Ometria.instance().trackCustomEvent(
    customEventType = "feature_used",
    additionalInfo = mapOf(
        "featureName" to "wishlist",
        "action" to "add_item",
        "itemCount" to 5
    )
)
```

**Referral:**

```kotlin
Ometria.instance().trackCustomEvent(
    customEventType = "referral_sent",
    additionalInfo = mapOf(
        "method" to "email",
        "referralCode" to "USER123"
    )
)
```

**Survey completion:**

```kotlin
Ometria.instance().trackCustomEvent(
    customEventType = "survey_completed",
    additionalInfo = mapOf(
        "surveyId" to "nps-q4-2024",
        "score" to 9
    )
)
```
