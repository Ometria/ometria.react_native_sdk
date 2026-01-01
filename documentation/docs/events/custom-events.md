---
sidebar_position: 6
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

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventType` | `string` | Yes | Custom event type identifier |
| `additionalInfo` | `object` | No | Additional data about the event |

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

## Deep Link Opened

Track when a user opens a deep link from a notification:

```js
Ometria.trackDeepLinkOpenedEvent('/profile', 'ProfileScreen');
```

See [Handling Notification URLs](../push-notifications/setup#handling-notification-urls) for more details.

## Best Practices

1. **Coordinate with marketing** - Check what events they need for automation campaigns
2. **Use consistent naming** - Establish a naming convention for event types
3. **Include relevant data** - Pass any information that helps segment users
4. **Don't over-track** - Focus on actionable events, not every tap
