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

## Tracking Custom Events

```js
Ometria.trackCustomEvent('promotion_signup', {
  promotionId: 'summer-sale-2024',
  source: 'homepage-banner',
});
```

### Parameters

| Parameter        | Type     | Required | Description                     |
| ---------------- | -------- | -------- | ------------------------------- |
| `eventType`      | `string` | Yes      | Custom event type identifier    |
| `additionalInfo` | `object` | No       | Additional data about the event |

## Examples

**Promotion signup:**

```js
Ometria.trackCustomEvent('promotion_signup', {
  promotionId: 'black-friday-2024',
  discountCode: 'BF24',
});
```

**Feature usage:**

```js
Ometria.trackCustomEvent('feature_used', {
  featureName: 'wishlist',
  action: 'add_item',
  itemCount: 5,
});
```

**Referral:**

```js
Ometria.trackCustomEvent('referral_sent', {
  method: 'email',
  referralCode: 'USER123',
});
```

**Survey completion:**

```js
Ometria.trackCustomEvent('survey_completed', {
  surveyId: 'nps-q4-2024',
  score: 9,
});
```
