# Publishing a New Version

Use this checklist before publishing to npm.

---

## 1. Bump the version

**`package.json`** — `version`:
```json
"version": "2.8.0"
```

## 2. Update version fallbacks in native files

These are used when the consuming app hasn't set the `OmetriaRNSdkVersion` metadata key.
They must match the version in `package.json`.

**`ios/OmetriaReactNativeSdk.swift`**:
```swift
static let bareRnSdkVersion = "2.8.0"
```

**`android/src/main/java/com/ometriareactnativesdk/OmetriaReactNativeSdkModule.kt`**:
```kotlin
private const val BARE_RN_SDK_VERSION = "2.8.0"
```

## 3. Update CHANGELOG.md

Add an entry at the top for the new version.

## 4. Run TypeScript checks

```sh
pnpm typescript
cd example && npx tsc --noEmit
cd ../example-expo && npx tsc --noEmit
```

## 5. Commit and tag

```sh
git add .
git commit -m "chore: release x.x.x"
git tag vx.x.x
git push origin release/x.x.x --tags
```

## 6. Publish to npm

```sh
npm publish
```

> Make sure you are logged in (`npm whoami`) and have access to the `react-native-ometria` package.

---

## What gets published

The `files` field in `package.json` controls what is included in the npm package:

```json
"files": [
  "src",
  "android",
  "ios",
  "scripts",
  "plugin/build",
  "app.plugin.js",
  "ometria-react-native-sdk.podspec"
]
```

**Before publishing, verify the package contents:**
```sh
npm pack --dry-run
```

Things that should NOT be in the package:
- `android/build/` — Gradle build output (included via the broad `android` entry)
- `ios/Pods/` — CocoaPods dependencies (included via the broad `ios` entry)

`example/`, `example-expo/`, and `node_modules/` are not in `files` so they are never packed.

---

## Checklist

- [ ] `package.json` version bumped
- [ ] `ios/OmetriaReactNativeSdk.swift` `bareRnSdkVersion` updated
- [ ] `android/.../OmetriaReactNativeSdkModule.kt` `BARE_RN_SDK_VERSION` updated
- [ ] `CHANGELOG.md` updated
- [ ] TypeScript checks pass
- [ ] `npm pack --dry-run` looks clean
- [ ] Git tag created and pushed
