# React Native Ometria - Support Timeline

Framework   Architecture       Version          2025             2026 Q1 - Q2        from 2026 Q3 or 2027
Bare RN     Old Architecture   <= 0.81.x        ✅ + Example     ✅ + Example        ❌ No support
Bare RN     New Architecture   >= 0.76.x        -                ✅ + Example        📄 Docs only, no example
Expo        Old Architecture   <=54             -                ✅ + Example        ❌ No support
Expo        New Architecture   >=53             -                ✅ + Example        ✅ + Example

---

## Why This Approach

1. **Expo is the industry standard** - Firebase, Stripe, OneSignal all use config plugins
2. **Reduces maintenance** - Expo automates native setup; no manual file editing
3. **Follows React Native's direction** - Old Architecture is being removed regardless

---

## For Users

**Expo users** configure via JSON:
```json
{
  "plugins": [["react-native-ometria", { "appGroupIdentifier": "group.com.app" }]]
}
```

**Bare RN users** continue with current manual setup (documented).
