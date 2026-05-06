# iOS Docs — Phase 2 Fixes

Defects found while porting `_drafts/README_ios.md` into `docs-ios/`. Phase 1 ported everything verbatim; this file lists what to revise in a follow-up pass. Issues are grouped by severity and reference both the new docs location and the original README line numbers.

> Source of truth: `_drafts/README_ios.md` is the legacy single-file README the port was based on. Verify each item against the actual iOS SDK code before editing — the README itself was the only reference available during the port.

---

## Group 1 — Swift code that won't compile

### 1. Missing `()` after function name in NSE override

- **File:** `docs-ios/push-notifications/notification-service-extension.md`
- **README ref:** §4 Option 2, line 105
- **Code:**
  ```swift
  override func initializeOmetria -> Ometria? {
      return Ometria.initializeForExtension(appGroupIdentifier: "YOUR_App_GROUP_IDENTIFIER")
  }
  ```
- **Issue:** Swift requires `()` on every function declaration. As written this is a syntax error.
- **Suggested fix:** `override func initializeOmetria() -> Ometria?` — and **double-check the method name against the SDK source**. The RN docs (`docs-react-native/push-notifications/notification-service-extension.md`) call this hook `instantiateOmetria()`. If the iOS SDK also renamed it, this should become `instantiateOmetria()` too.
- **Side note:** The string literal `YOUR_App_GROUP_IDENTIFIER` has inconsistent capitalization (mixed `App` vs `APP`). Cosmetic but worth normalising.

### 2. Bare `return` in a `Bool`-returning function

- **File:** `docs-ios/installation.md` § 2
- **README ref:** §5, line 146
- **Code:**
  ```swift
  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
      Ometria.initialize(apiToken: "OMETRIA_API_TOKEN", appGroupIdentifier: "YOUR_APP_GROUP_IDENTIFIER")
      FirebaseApp.configure()
      return
  }
  ```
- **Issue:** `return` with no value is invalid in a function returning `Bool`.
- **Suggested fix:** `return true`.

### 3. `application(_:continue:restorationHandler:)` body never returns a Bool

- **File:** `docs-ios/deep-linking.md` § "Process universal links inside the app"
- **README ref:** §8, line ~688
- **Code:**
  ```swift
  func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
      if let url = userActivity.webpageURL {
          Ometria.sharedInstance().processUniversalLink(url) { (url, error) in
              if let url = url {
                  // ...
              } else {
                  // ...
              }
          }
      }
  }
  ```
- **Issue:** Function signature returns `Bool` but no `return` exists. Note the `processUniversalLink` callback is asynchronous, so the outer function should return synchronously (likely `return true` after kicking off the async call).
- **Suggested fix:** Add `return true` after the `if let url = userActivity.webpageURL { … }` block, and an `else { return false }` branch.

---

## Group 2 — Documentation/data inconsistencies

### 4. `OmetriaBasket` properties table doesn't match the example

- **File:** `docs-ios/events/basket-events.md` (also referenced from `events/overview.md`)
- **README ref:** §6 — properties table at lines 415–418, example at line 224
- **Conflict:**
  - Table currently lists: `currency`, `price`, `items`, `link`
  - Example code uses: `OmetriaBasket(id:, totalPrice:, currency:, items:, link:)`
- **Suggested fix:** Verify against the SDK's `OmetriaBasket` initialiser. Likely fix:
  - Add `id` (`String`, optional) — basket identifier
  - Rename `price` → `totalPrice` (`Float`/`Double`, required) to match the example
  - Keep `currency`, `items`, `link`

### 5. `OmetriaBasketItem` table missing `variantId`

- **File:** `docs-ios/events/basket-events.md`
- **README ref:** §6 — table at lines 428–431, example at lines 217–222
- **Conflict:**
  - Table lists: `productId`, `sku`, `quantity`, `price`
  - Example uses: `OmetriaBasketItem(productId:, variantId:, sku:, quantity:, price:)`
- **Suggested fix:** Add `variantId` (`String`, optional) to the properties table.

### 6. Unclear init overloads — `appGroupIdentifier` vs `enableSwizzling`

- **File:** `docs-ios/installation.md` (§ 2 vs § 3)
- **README ref:** §5
- **Conflict:**
  - § 2 example: `Ometria.initialize(apiToken:appGroupIdentifier:)`
  - § 3 ("Disabling Swizzling") example: `Ometria.initialize(apiToken:enableSwizzling:)` — no `appGroupIdentifier`
- **Issue:** The reader can't tell whether these are separate overloads, whether `appGroupIdentifier` has a default, or whether the swizzling example is missing it.
- **Suggested fix:** Document the actual init signature(s) with all parameter labels, defaults, and which are required. Show one full call in § 2 that combines both `appGroupIdentifier` and `enableSwizzling`.

---

## Group 3 — Misleading or outdated content

### 7. "Option 1: handleNotification" wrongly claims you don't need an NSE

- **File:** `docs-ios/push-notifications/setup.md` § "Handling Push Notifications" → Option 1
- **README ref:** §4, lines 32–53
- **Issue:** The bullets say "No separate target or extension is needed", but the method signature `(_ request: UNNotificationRequest, contentHandler: @escaping (UNNotificationContent) -> Void)` is the exact shape of `UNNotificationServiceExtension.didReceive(_:withContentHandler:)` — i.e. it must be called from inside an NSE. Also, §2's init takes `appGroupIdentifier`, which only makes sense if an NSE + App Group exist.
- **Suggested fix:** Reframe Option 1 as "a simpler way to *write* your NSE" rather than "a way to skip the NSE". Keep the App Group + entitlements setup as a prerequisite shared with Option 2; Option 1 just replaces the `NotificationService.swift` implementation with a one-liner that delegates to `Ometria.handleNotification`.

### 8. AASA filename uses underscores instead of hyphens

- **File:** `docs-ios/deep-linking.md` § "Create an apple-app-site-association file"
- **README ref:** §8, lines 660–661
- **Issue:**
  > 'Save it and name it `"apple_app_site_association"` (notice that no extension has been used…)'
  Apple requires the filename **`apple-app-site-association`** (hyphens, no extension). With underscores the OS will not pick it up.
- **Suggested fix:** Change the prose to `apple-app-site-association`. The section heading already uses the correct spelling — only the in-paragraph instruction is wrong.

### 9. `userNotificationCenter(_:didReceive:withCompletionHandler:)` never calls its handler

- **File:** `docs-ios/installation.md` § 3 "Disabling Swizzling"
- **README ref:** §5, lines 182–184
- **Code:**
  ```swift
  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
      Ometria.sharedInstance().handleNotificationResponse(response)
      // completionHandler() is never called
  }
  ```
- **Issue:** Apple's docs say not calling the completion handler can cause the app to be terminated. The neighbouring `willPresent` example does call its handler.
- **Suggested fix:** Add `completionHandler()` after the Ometria call.

### 10. `pod setup` advice is outdated

- **File:** `docs-ios/installation.md` § 1
- **README ref:** §3, line 27
- **Issue:** `pod setup` was deprecated in CocoaPods 1.8 (2019); the master spec repo is now set up automatically on first install. The step still works but is unnecessary noise for new readers.
- **Suggested fix:** Remove step 2 and renumber. Step 1 (install the gem) followed by step 3 (`pod init` + add `pod 'Ometria'`) is sufficient.

### 11. `intro.md` oversimplifies event tracking

- **File:** `docs-ios/intro.md`
- **README ref:** §1, line 13
- **Issue:** Bullet says "Tracking customer behaviour through events - handled by Ometria." But §6 makes clear that *most* events are manually tracked. The RN intro phrases this more accurately:
  > "a subset of events is automatically handled by the Ometria SDK, but you have to customize it to your needs"
- **Suggested fix:** Rephrase to match the RN wording so users don't expect zero work.

### 12. `their_id` jargon leaked into customer-facing docs

- **File:** `docs-ios/events/product-events.md` § "View list of products"
- **README ref:** §6
- **Issue:** "`id` which should be an attribute *their_id* that exists in the Ometria database" — `their_id` reads like an internal database column name. The RN docs share the same wording; both should be cleaned up together.
- **Suggested fix:** Replace `their_id` with a customer-facing description, e.g. "the attribute identifier as it exists in the Ometria database".

---

## Outside scope of phase 2 (worth tracking separately)

### Image hosting fragility

- **Files:** `docs-ios/push-notifications/notification-service-extension.md`, `docs-ios/deep-linking.md`
- **Issue:** Two of the screenshots are uploaded GitHub user assets (`github.com/Ometria/ometria.ios_sdk/assets/6207062/...`) which can be deleted/changed and don't have repo-tracking guarantees. The other four are `raw.githubusercontent.com/wiki/...` (slightly more stable but still external).
- **Suggested fix:** Migrate all six images to `documentation/static/img/ios/` and reference them with `/img/ios/...` URLs.

### Pre-existing RN sidebar collision (not iOS-specific)

- **File:** `docs-react-native/events/`
- **Issue:** Both `basket-events.md` and `screen-events.md` have `sidebar_position: 4`. iOS docs avoid this; RN should be fixed too in a separate PR.
