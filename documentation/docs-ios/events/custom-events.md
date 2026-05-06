---
sidebar_position: 7
title: Custom Events
---

# Custom Events

Your app might have specific flows or pages that are of interest to the marketing team.

E.g. Marketing might want to send an email or notification to any user who signed up for a specific promotion, or interacted with a button or specific element of the app.

If you send a custom event corresponding to that action, they will be able to trigger an [automation campaign](https://support.ometria.com/hc/en-gb/articles/360011378398-Automation-campaigns-overview) on it.

Check with the marketing team about the specifics, and what they might need. Especially if they're already using Ometria for email, they will know about automation campaigns and custom events.

```swift
trackCustomEvent(customEventType: String, additionalInfo: [String: Any]?)
```
