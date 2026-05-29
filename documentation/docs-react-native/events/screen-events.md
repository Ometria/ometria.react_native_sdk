---
sidebar_position: 6
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

Tracking a visitor's independent screen views helps us track their engagement with the app, as well as where they are in a journey.

An analogous event on a website would be to track independent page views.

The common eCommerce screens all have their own top-level event: basket viewed, list of products viewed, etc.

Your app may have a specific type of page that is useful for marketers to track engagement with.

E.g. if you're running a promotion, and viewing a specific screen indicates interest in the promotion, which marketing might later want to follow up on.

To track these custom screens, use the _Screen viewed_ event:

```js
Ometria.trackScreenViewedEvent('OnboardingScreen', { step: '3', variant: 'B' });
```

**Parameters:**

| Parameter        | Type     | Description                               |
| ---------------- | -------- | ----------------------------------------- |
| `screenName`     | `string` | Name of the screen                        |
| `additionalInfo` | `object` | Optional additional data about the screen |
