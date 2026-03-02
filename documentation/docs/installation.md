---
sidebar_position: 2
title: Installation
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Installation

This library includes built-in support for the React Native New Architecture. While not strictly required, we strongly recommend using Expo alongside the New Architecture for the best experience. For a limited transition period, the classic bridge for the React Native Old Architecture will continue to be supported.

## 1. Install the library

<Tabs>
  <TabItem value="expo" label="Expo"  default>

The easiest way to integrate Ometria is using Expo with the config plugin. This automatically handles all native configuration.

#### 1. Install the package

<Tabs>
  <TabItem value="pnpm" label="pnpm" default>
    ```bash
    pnpm add react-native-ometria
    ```
  </TabItem>
  <TabItem value="yarn" label="yarn">
    ```bash
    yarn add react-native-ometria
    ```
  </TabItem>
  <TabItem value="npm" label="npm">
    ```bash
    npm install react-native-ometria
    ```
  </TabItem>
</Tabs>

#### 2. Configure the plugin

Add to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      ["react-native-ometria"],
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static",
            "forceStaticLinking": ["RNFBApp", "RNFBMessaging"]
          }
        }
      ]
    ]
  }
}
```

:::info
`forceStaticLinking` is required for iOS — without it, `RNFBApp` and `RNFBMessaging` are compiled as framework modules, causing a build error when they import React Native headers.
:::

#### Plugin Options

| Option                   | Required | Description                                                                                                                                                                       |
| ------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| customAppGroupIdentifier | No       | Override the auto-generated iOS App Group identifier. The plugin automatically generates the `appGroupIdentifier` from your `ios.bundleIdentifier` as `group.{bundleIdentifier}`. |
| skipNSE                  | No       | Skip the Notification Service Extension setup. When `true`, rich push notification content (images, etc.) will not work on iOS. Defaults to `false`.                              |

#### 3. Run prebuild

```bash
npx expo prebuild
```

  </TabItem>
  <TabItem value="bare" label="Bare React Native">

For projects not using Expo, follow the manual setup below.

#### 1. Install the Package

<Tabs>
  <TabItem value="pnpm2" label="pnpm" default>
    ```bash
    pnpm add react-native-ometria
    ```
  </TabItem>
  <TabItem value="yarn2" label="yarn">
    ```bash
    yarn add react-native-ometria
    ```
  </TabItem>
  <TabItem value="npm2" label="npm">
    ```bash
    npm install react-native-ometria
    ```
  </TabItem>
</Tabs>

#### 2. Native Setup

<Tabs>
  <TabItem value="new-arch" label="New Architecture" default>

#### 🍏 iOS

Add the TurboModule setup to your Podfile:

```ruby
# At the top of your Podfile (after other require statements)
require_relative '../node_modules/react-native-ometria/scripts/ometria_turbomodule'

# In your post_install block
post_install do |installer|
  react_native_post_install(
    installer,
    config[:reactNativePath],
    :mac_catalyst_enabled => false
  )

  # Register Ometria TurboModule (required for New Architecture)
  patch_ometria_turbomodule(installer)
end
```

Then run:

```bash
pod install
```

:::note Why is the TurboModule patch needed?
The Ometria SDK is written in Swift, but React Native's TurboModule specs use C++ types that Swift cannot directly implement. We use an Objective-C++ wrapper (`OmetriaReactNativeSdkTurboModule`) to bridge this gap.

React Native's codegen generates a file called `RCTModuleProviders.mm` that maps module names to their implementation classes. However, codegen doesn't know about our custom wrapper class.

The `patch_ometria_turbomodule` function adds a build phase that patches `RCTModuleProviders.mm` to include our module mapping. This happens during each build, after codegen generates the file but before it's compiled.

**This is a temporary workaround** - we are actively working on a solution that won't require manual Podfile changes.
:::

:::tip
If you encounter `The Swift pod 'Ometria' depends upon 'FirebaseMessaging'` error, add this to your Podfile:

```ruby
use_frameworks! :linkage => :static
```

:::

#### 🤖 Android

New Architecture is enabled by default.

:::note Requirements
Android builds require:

- `compileSdkVersion` / `targetSdkVersion`: 36
- `minSdkVersion`: 24
:::

  </TabItem>
  <TabItem value="old-arch" label="Old Architecture">

#### 🍏 iOS

```bash
RCT_NEW_ARCH_ENABLED=0 pod install
```

:::note
If you encounter `The Swift pod 'Ometria' depends upon 'FirebaseMessaging'` error, add this to your Podfile:

```ruby
use_frameworks! :linkage => :static
```

:::

#### 🤖 Android

Set in `android/gradle.properties`:

```properties
newArchEnabled=false
```

    </TabItem>

  </Tabs>

### Xcode 26 + Firebase compatibility

:::warning
If you use Firebase (`use_frameworks! :linkage => :static`) on bare React Native and build with **Xcode 26**, you will encounter build errors. This is a known issue with no upstream fix as of March 2026. The root cause is that Xcode 26 enables explicit module builds by default (`SWIFT_ENABLE_EXPLICIT_MODULES=YES`), which ignores CocoaPods' VFS overlay mechanism that `use_frameworks!` depends on for header resolution.

These Podfile patches are required for both local and EAS builds (Xcode 26 is the default image on EAS since Expo SDK 54).
:::

Add the following to your `post_install` block in the Podfile. All fixes apply to both New and Old Architecture unless noted.

```ruby
post_install do |installer|
  react_native_post_install(installer, config[:reactNativePath], :mac_catalyst_enabled => false)

  # Fix 1: HEADER_SEARCH_PATHS
  # Xcode 26 explicit module scanner ignores VFS overlays, so ReactCommon headers are
  # not found via framework paths. Adding the source paths directly works around this.
  react_native_abs = File.expand_path(config[:reactNativePath], Pod::Config.instance.installation_root)
  react_common = "#{react_native_abs}/ReactCommon"
  extra_header_paths = [
    react_common,
    "#{react_common}/runtimeexecutor",
    "#{react_common}/runtimeexecutor/platform/ios",
    "#{react_common}/jsinspector-modern",
    "#{react_common}/callinvoker",
    "#{react_common}/react/nativemodule/core",
  ].map { |p| "\"#{p}\"" }
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |build_config|
      existing = Array(build_config.build_settings['HEADER_SEARCH_PATHS'] || '$(inherited)')
      build_config.build_settings['HEADER_SEARCH_PATHS'] = existing + extra_header_paths

      # Fix 2: -Wno-c++11-narrowing
      # Xcode 26 uses C++20 by default, which promotes CGFloat→Float narrowing conversions
      # in React Native source from warnings to errors.
      existing_cxx = Array(build_config.build_settings['OTHER_CPLUSPLUSFLAGS'] || '$(inherited)')
      unless existing_cxx.include?('-Wno-c++11-narrowing')
        build_config.build_settings['OTHER_CPLUSPLUSFLAGS'] = existing_cxx + ['-Wno-c++11-narrowing']
      end
    end
  end

  # Helper: insert a script phase before Compile Sources
  def self.add_early_phase(target, name, &block)
    unless target.build_phases.any? { |p| p.respond_to?(:name) && p.name == name }
      phase = target.new_shell_script_build_phase(name)
      compile_phase = target.build_phases.find { |p| p.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase) }
      target.build_phases.delete(phase)
      idx = compile_phase ? target.build_phases.index(compile_phase) : 0
      target.build_phases.insert(idx, phase)
      block.call(phase)
    end
  end

  # Fix 3: Yoga.h
  # Xcode 26 requires headers referenced via #import <yoga/Yoga.h> to physically exist
  # in yoga.framework/Headers/. CocoaPods' VFS overlay aliases Yoga-umbrella.h as Yoga.h
  # but the explicit scanner ignores it.
  yoga_target = installer.pods_project.targets.find { |t| t.name == 'Yoga' }
  if yoga_target
    unless yoga_target.build_phases.any? { |p| p.respond_to?(:name) && p.name == '[Ometria] Yoga.h fix' }
      phase = yoga_target.new_shell_script_build_phase('[Ometria] Yoga.h fix')
      phase.shell_script = <<~SCRIPT
        YOGA_HEADERS="${BUILT_PRODUCTS_DIR}/yoga.framework/Headers"
        YOGA_SRC="${PODS_TARGET_SRCROOT}/yoga"
        if [ -f "${YOGA_HEADERS}/Yoga-umbrella.h" ] && [ ! -f "${YOGA_HEADERS}/Yoga.h" ]; then
          cp "${YOGA_HEADERS}/Yoga-umbrella.h" "${YOGA_HEADERS}/Yoga.h"
        fi
        if [ -d "${YOGA_SRC}" ]; then
          find "${YOGA_SRC}" -name "*.h" | while read f; do
            rel="${f#${YOGA_SRC}/}"
            dest="${YOGA_HEADERS}/${rel}"
            mkdir -p "$(dirname "${dest}")"
            cp -n "$f" "${dest}"
          done
        fi
      SCRIPT
    end
  end

  # Fix 4: React.framework headers
  # React-Core's framework Headers directory is incomplete — the explicit scanner cannot
  # find #import <react/...> headers via the VFS overlay. We copy them physically.
  react_core_target = installer.pods_project.targets.find { |t| t.name == 'React-Core' }
  if react_core_target
    add_early_phase(react_core_target, '[Ometria] Fix React framework headers') do |phase|
      phase.shell_script = <<~'SCRIPT'
        REACT_NATIVE_DIR="${PODS_ROOT}/../../node_modules/react-native"
        REACT_HEADERS="${BUILT_PRODUCTS_DIR}/React.framework/Headers"
        mkdir -p "${REACT_HEADERS}"
        copy_react_headers() {
          local src="$1"
          [ -d "$src" ] || return
          find -L "$src" -name "*.h" | while IFS= read -r f; do
            relpath="${f#${src}/}"
            if echo "$relpath" | grep -q "/platform/ios/"; then
              continue
            elif echo "$relpath" | grep -q "/platform/cxx/react/"; then
              relpath="${relpath##*/platform/cxx/react/}"
            elif echo "$relpath" | grep -q "/platform/"; then
              continue
            elif echo "$relpath" | grep -q "/iosswitch/react/"; then
              relpath="${relpath##*/iosswitch/react/}"
            fi
            destfile="${REACT_HEADERS}/${relpath}"
            mkdir -p "$(dirname "$destfile")"
            cp -n "$f" "$destfile"
          done
          find -L "$src" -name "*.h" -path "*/platform/ios/react/*" | while IFS= read -r f; do
            relpath="${f#${src}/}"
            relpath="${relpath##*/platform/ios/react/}"
            destfile="${REACT_HEADERS}/${relpath}"
            mkdir -p "$(dirname "$destfile")"
            cp "$f" "$destfile"
          done
        }
        copy_react_headers "${REACT_NATIVE_DIR}/ReactCommon/react"
        copy_react_headers "${REACT_NATIVE_DIR}/ReactCommon/jsitooling/react"
        copy_react_headers "${REACT_NATIVE_DIR}/React/FBReactNativeSpec/react"
        if [ -d "${REACT_NATIVE_DIR}/React/Runtime" ]; then
          find "${REACT_NATIVE_DIR}/React/Runtime" -maxdepth 1 -name "*.h" | while IFS= read -r f; do
            cp -n "$f" "${REACT_HEADERS}/$(basename "$f")"
          done
        fi
      SCRIPT
    end
  end

  # Fixes 5 & 6 are only needed for Old Architecture
  unless ENV['RCT_NEW_ARCH_ENABLED'] == '1'

    # Fix 5: FBReactNativeSpec framework
    # Old arch code imports <FBReactNativeSpec/FBReactNativeSpec.h> but the framework is
    # named React_RCTFBReactNativeSpec.framework. The VFS alias is ignored by Xcode 26.
    fb_spec_target = installer.pods_project.targets.find { |t| t.name == 'React-RCTFBReactNativeSpec' }
    if fb_spec_target
      add_early_phase(fb_spec_target, '[Ometria] Fix FBReactNativeSpec framework') do |phase|
        phase.shell_script = <<~'SCRIPT'
          REACT_NATIVE_DIR="${PODS_ROOT}/../../node_modules/react-native"
          FB_DIR="${REACT_NATIVE_DIR}/React/FBReactNativeSpec"
          FB_HEADERS="${BUILT_PRODUCTS_DIR}/FBReactNativeSpec.framework/Headers"
          mkdir -p "${FB_HEADERS}"
          if [ -d "${FB_DIR}/FBReactNativeSpec" ]; then
            for f in "${FB_DIR}/FBReactNativeSpec"/*.h; do
              cp -n "$f" "${FB_HEADERS}/$(basename "$f")"
            done
          fi
          for f in "${FB_DIR}"/*.h; do
            [ -f "$f" ] && cp -n "$f" "${FB_HEADERS}/$(basename "$f")"
          done
        SCRIPT
      end
    end

    # Fix 6: ReactCommon framework headers + remove system header shadows
    # ReactCommon includes files like float.h that shadow standard C headers. On Xcode 26,
    # the explicit scanner picks them up before the system headers, breaking UIKit → Foundation.
    react_common_target = installer.pods_project.targets.find { |t| t.name == 'ReactCommon' }
    if react_common_target
      system_headers = %w[float.h math.h stdlib.h stdio.h string.h limits.h
                          assert.h errno.h stdint.h stddef.h stdbool.h
                          inttypes.h stdarg.h setjmp.h signal.h time.h
                          locale.h wchar.h wctype.h]
      copy_headers_phase = react_common_target.build_phases.find { |p|
        p.is_a?(Xcodeproj::Project::Object::PBXHeadersBuildPhase)
      }
      if copy_headers_phase
        copy_headers_phase.files.select { |f|
          system_headers.include?(f.file_ref&.path&.split('/')&.last)
        }.each { |f| copy_headers_phase.files.delete(f) }
      end

      add_early_phase(react_common_target, '[Ometria] Fix ReactCommon framework headers') do |phase|
        phase.shell_script = <<~'SCRIPT'
          REACT_NATIVE_DIR="${PODS_ROOT}/../../node_modules/react-native"
          RC_HEADERS="${BUILT_PRODUCTS_DIR}/ReactCommon.framework/Headers"
          mkdir -p "${RC_HEADERS}"
          for h in float.h Float.h math.h stdlib.h stdio.h string.h limits.h assert.h errno.h stdint.h stddef.h stdbool.h inttypes.h stdarg.h setjmp.h signal.h time.h locale.h wchar.h wctype.h; do
            rm -f "${RC_HEADERS}/${h}"
          done
          if [ -d "${REACT_NATIVE_DIR}/ReactCommon" ]; then
            find -L "${REACT_NATIVE_DIR}/ReactCommon" -name "*.h" -path "*/ReactCommon/*.h" | while IFS= read -r f; do
              fname=$(basename "$f")
              case "$fname" in
                float.h|Float.h|math.h|stdlib.h|stdio.h|string.h|limits.h|assert.h|errno.h|stdint.h|stddef.h|stdbool.h|inttypes.h|stdarg.h|setjmp.h|signal.h|time.h|locale.h|wchar.h|wctype.h) continue ;;
              esac
              cp -n "$f" "${RC_HEADERS}/${fname}"
            done
          fi
        SCRIPT
      end
    end
  end
end
```

| Fix | Arch | Description |
|-----|------|-------------|
| 1. `HEADER_SEARCH_PATHS` | Both | Adds ReactCommon source paths so `#import <react/...>` resolves without VFS |
| 2. `-Wno-c++11-narrowing` | Both | Suppresses C++20 narrowing errors on `CGFloat → Float` conversions in RN source |
| 3. Yoga.h | Both | Copies `Yoga-umbrella.h` as `Yoga.h` so `#import <yoga/Yoga.h>` resolves physically |
| 4. React.framework headers | Both | Populates `React.framework/Headers/` with all `react/` subdirectory headers |
| 5. FBReactNativeSpec framework | Old arch only | Creates `FBReactNativeSpec.framework/Headers/` to satisfy `#import <FBReactNativeSpec/...>` |
| 6. ReactCommon headers + system header removal | Old arch only | Populates `ReactCommon.framework/Headers/` and removes shadowing system headers (e.g. `float.h`) |

      </TabItem>

    </Tabs>

---

## 2. Initialize the SDK

After installation, initialize the SDK in your app:

```js
import Ometria from 'react-native-ometria';

await Ometria.initializeWithApiToken('API_KEY', {
  // optional params
});
```

:::warning Ometria needs to be initialized first
Any other Ometria methods must be called **after** initialization.
:::

#### Optional Parameters

| Parameter               | Platform | Description                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| notificationChannelName | Android  | Custom name for the notification channel. Default is blank.                                                                                                                                                                                                                                                                                                                                      |
| appGroupIdentifier      | iOS      | Specifies the App Group identifier used by the Notification Service Extension.<br/><br/>Expo projects: by default, this value is set to `group.{bundleIdentifier}`. You may override it if a different identifier is needed.<br/><br/>Bare React Native: this value must match the App Group configured in Xcode. Refer to [iOS Push Setup](./push-notifications/notification-service-extension) for configuration details. |

:::tip Reinitialization
Since version 2.3.0, the SDK allows for reinitialization of the Ometria instance. You can call `initializeWithApiToken` again later in the app if needed.
:::

---

## 3. Start Tracking Events

After initialization, you can start tracking customer behaviour:

```js
// Identify the user
Ometria.trackProfileIdentifiedByEmailEvent('user@example.com');

// Track a product view
Ometria.trackProductViewedEvent('product-123');

// Track adding to basket
Ometria.trackBasketUpdatedEvent({
  totalPrice: 29.99,
  id: 'basket-456',
  currency: 'USD',
  items: [{ productId: 'product-123', quantity: 1, sku: 'SKU123' }],
});
```

See [Event Tracking](./events/overview) for the complete list of available events.
