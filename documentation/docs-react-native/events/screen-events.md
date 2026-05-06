---
sidebar_position: 4
title: Screen Events
---

# Screen Events

Track general screen views to understand user navigation patterns.

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

**Parameters:**

| Parameter        | Type     | Description                               |
| ---------------- | -------- | ----------------------------------------- |
| `screenName`     | `string` | Name of the screen                        |
| `additionalInfo` | `object` | Optional additional data about the screen |

**When to use:**

- Promotion screens
- Onboarding flows
- Feature highlights
- Any screen where marketing might want to track engagement
