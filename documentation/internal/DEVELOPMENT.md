# Development Guide

This document explains how to develop the `react-native-ometria` library locally using the example apps.

## Project Structure

```
ometria/
├── src/                    # Library source code
├── example/                # Bare React Native example app
├── example-expo/           # Expo example app
├── plugin/                 # Expo config plugin
└── package.json            # Library package.json
```

## Prerequisites

- Node.js >= 20
- pnpm (`npm install -g pnpm`)

## Getting Started

### Install Dependencies

Install dependencies for the library (from root):

```bash
pnpm install
```

Install dependencies for the Expo example:

```bash
cd example-expo
pnpm install
```

### How Local Linking Works

The `example-expo/package.json` uses `link:..` to reference the local library:

```json
"react-native-ometria": "link:.."
```

This creates a symlink from `example-expo/node_modules/react-native-ometria` to the parent directory, so:
- Changes to `src/` are immediately available
- No need to rebuild or republish during development
- The Expo config plugin resolves correctly

### Metro Configuration

Metro is configured in `example-expo/metro.config.js` to:

1. **Watch the parent directory** for hot reloading:
   ```javascript
   config.watchFolders = [path.resolve(__dirname, '..')];
   ```

2. **Block the library's node_modules** to prevent duplicate dependencies:
   ```javascript
   config.resolver.blockList = [
     new RegExp(`^${escape(path.join(root, 'node_modules'))}\\/.*$`),
   ];
   ```

The second point is **critical for old architecture support**. Here's why:

- The library root has its own `node_modules/` with `react-native` as a devDependency
- In old architecture, `NativeModules` is a per-bundle JS object
- If Metro resolves `react-native` from the library's node_modules instead of the app's, you get a different `NativeModules` instance that's empty
- This causes the app to freeze when importing Ometria

In new architecture (TurboModules), this isn't an issue because `TurboModuleRegistry` uses a global native registry that's shared across all JS bundles.

## Building the Expo Example

```bash
cd example-expo
npx expo prebuild --clean
npx expo run:ios
# or
npx expo run:android
```

## Running Scripts

### Library (root directory)

```bash
pnpm lint
pnpm typescript
```

### Expo Example

```bash
cd example-expo
pnpm start           # Start Metro bundler
npx expo run:ios     # Build and run on iOS
npx expo run:android # Build and run on Android
```

## For Users Cloning the Example

If you clone just the `example-expo` folder for standalone use:

1. Change the dependency to the published npm version:
   ```json
   "react-native-ometria": "^2.8.0"
   ```

2. The `watchFolders` in metro.config.js is harmless - non-existent directories are safely ignored.

## Troubleshooting

### Changes to library not reflecting

Changes should reflect immediately via the symlink. Try:
1. Restart Metro: `pnpm start --clear`
2. Rebuild native code: `npx expo prebuild --clean`

### TypeScript errors about missing types

Make sure you have the latest dependencies installed in both root and example-expo.

### Expo plugin not found

Ensure `pnpm install` was run in example-expo - the `link:..` dependency must be installed for the Expo plugin to resolve.

### App freezes when importing Ometria (old architecture only)

This happens when Metro resolves `react-native` from the library's `node_modules/` instead of the app's. Solutions:

1. **Verify metro.config.js** has the `blockList` configured to block the library's node_modules (see Metro Configuration section above)

2. **Delete the library's react-native** as a quick fix:
   ```bash
   rm -rf /path/to/library/node_modules/react-native
   ```

3. **Clear Metro cache** after fixing:
   ```bash
   npx expo start --clear
   ```

This only affects old architecture because `NativeModules` is per-bundle, while TurboModules use a global registry.
