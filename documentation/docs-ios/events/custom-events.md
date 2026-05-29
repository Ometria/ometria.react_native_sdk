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

```swift
Ometria.sharedInstance().trackCustomEvent(
    customEventType: "promotion_signup",
    additionalInfo: [
        "promotionId": "summer-sale-2024",
        "source": "homepage-banner"
    ]
)
```

### Parameters

| Parameter         | Type             | Required | Description                     |
| ----------------- | ---------------- | -------- | ------------------------------- |
| `customEventType` | `String`         | Yes      | Custom event type identifier    |
| `additionalInfo`  | `[String: Any]?` | No       | Additional data about the event |

## Examples

**Promotion signup:**

```swift
Ometria.sharedInstance().trackCustomEvent(
    customEventType: "promotion_signup",
    additionalInfo: [
        "promotionId": "black-friday-2024",
        "discountCode": "BF24"
    ]
)
```

**Feature usage:**

```swift
Ometria.sharedInstance().trackCustomEvent(
    customEventType: "feature_used",
    additionalInfo: [
        "featureName": "wishlist",
        "action": "add_item",
        "itemCount": 5
    ]
)
```

**Referral:**

```swift
Ometria.sharedInstance().trackCustomEvent(
    customEventType: "referral_sent",
    additionalInfo: [
        "method": "email",
        "referralCode": "USER123"
    ]
)
```

**Survey completion:**

```swift
Ometria.sharedInstance().trackCustomEvent(
    customEventType: "survey_completed",
    additionalInfo: [
        "surveyId": "nps-q4-2024",
        "score": 9
    ]
)
```
