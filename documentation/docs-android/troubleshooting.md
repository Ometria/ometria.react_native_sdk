---
sidebar_position: 6
title: Troubleshooting
---

# Troubleshooting

## Enable Logging

Ometria logs any errors encountered during runtime by default.

You can enable advanced logging if you want more information on what's happening in the background. Just add the following line after initialising the library:

```kotlin
Ometria.initialize(
    application = this,
    apiToken = "YOUR_API_TOKEN",
    notificationIcon = R.drawable.ic_notification_nys,
    notificationColor = ContextCompat.getColor(this, R.color.colorAccent),
    notificationChannelName = "Custom Channel Name"
).loggingEnabled(true)
```
