# ometria.react_native_sdk

**Language**: TypeScript/JavaScript + native iOS/Android bridge
**Purpose**: Official Ometria React Native SDK. Wraps the native iOS and Android SDKs via a React Native bridge. Supports both classic bridge and New Architecture (TurboModules).

## Key capabilities
- Event tracking (screen views, basket, orders, custom events)
- Push notification handling
- Targets React Native 0.81.4+
- New Architecture (TurboModules) support for iOS
- npm: `react-native-ometria`

## Code structure
- `src/` — TypeScript SDK implementation
- `ios/` — iOS native bridge
- `android/` — Android native bridge
- `example/` — sample application
- `scripts/` — build scripts

## Distribution
- npm/yarn: `react-native-ometria`

## Related repos
- `ometria.android_sdk` — Android native dependency
- `ometria.ios_sdk` — iOS native dependency
- `ometria.react_native_sdk_internal` — internal/development version
