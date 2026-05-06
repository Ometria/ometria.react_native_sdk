# Android Docs — Phase 2 Fixes

Defects found while porting `_drafts/README_android.md` into `docs-android/`. Phase 1 ported everything verbatim; this file lists what to revise in a follow-up pass. Issues are grouped by severity and reference both the new docs location and the original README line numbers.

> Source of truth: `_drafts/README_android.md` is the legacy single-file README the port was based on. Verify each item against the actual Android SDK code before editing — the README itself was the only reference available during the port.

---

## Group 1 — Markdown rendering bugs (visible in current docs)

### 1. `MESSAGING\_EVENT` shows a literal backslash inside a code block

- **File:** `docs-android/push-notifications/setup.md` (Option 1 and Option 2 XML snippets)
- **README ref:** §6, lines 421 and 452
- **Code (current):**
  ```xml
  <action android:name="com.google.firebase.MESSAGING\_EVENT" />
  ```
- **Issue:** The README escaped the underscore for Markdown (`\_`) but the escape leaked into a fenced code block, where the parser treats it as a literal backslash. The actual Android constant is `com.google.firebase.MESSAGING_EVENT` (no backslash). A reader copying this XML into their `AndroidManifest.xml` would get an action name that does not match the Firebase SDK and the Ometria service would never be invoked.
- **Suggested fix:** Remove the backslash in both occurrences. Inside ` ```xml ` blocks, underscores need no escaping.

### 2. `OmetriaBasket.link` example loses its `<link>` placeholder in MDX

- **File:** `docs-android/events/basket-events.md` § "`OmetriaBasket` → Properties"
- **README ref:** §5, lines 328–329
- **Source:**
  > `link`: (`String`, optional) - A deeplink to the web or in-app page for this basket. Can be used ina notification sent to the user, e.g. "Forgot to check out? Here's your basket to continue: \<link\>".
- **Issue:** The README writes `<link>` in plain text, but MDX (Docusaurus's renderer) treats `<link>` as a JSX/HTML tag and silently drops it. The port works around this with HTML entities (`&lt;link&gt;`) so the rendered output matches what the README intended. Worth flagging because the same pattern in the source-side README would be invisible if anyone re-reads the README on GitHub vs. the docs site.
- **Suggested fix:** In any future re-edit of the README, swap `<link>` for `` `<link>` `` (a code span) or escape it. Already handled in the docs port; this entry is just a record of the source-side issue.
- **Side note:** "ina notification" → "in a notification" — typo, single space.

---

## Group 2 — Documentation/data inconsistencies

### 3. `OmetriaBasketItem` description copy-pasted from `OmetriaBasket`

- **File:** `docs-android/events/basket-events.md` § "`OmetriaBasketItem`"
- **README ref:** §5, line 333
- **Current text:**
  > An object that describes the contents of a shopping basket.
  > It can have its own price and quantity based on different rules and promotions that are being applied.
- **Issue:** The first sentence is verbatim the description of `OmetriaBasket` (line 320). `OmetriaBasketItem` represents a single line item, not the whole basket.
- **Suggested fix:** Rewrite the first sentence — e.g. "An object representing a single item entry within an `OmetriaBasket`."

### 4. `OmetriaBasket.totalPrice` declared `(float, ...)` but `OmetriaBasketItem.price` declared `(Float, ...)`

- **File:** `docs-android/events/basket-events.md`
- **README ref:** §5, lines 326 (basket) and 342 (item)
- **Issue:** Kotlin's primitive is `Float` (capital F). The basket properties table uses lowercase `float`; the item properties table uses correct capitalised `Float`. Both reference the same Kotlin type — they should match.
- **Suggested fix:** Normalise to `Float` in both tables.

### 5. "Notification recieved" — typo

- **File:** `docs-android/events/overview.md` § "Automatically tracked events"
- **README ref:** §5, line 358
- **Issue:** Misspelling of "received". The iOS README spells the same row correctly.
- **Suggested fix:** Change `**Notification recieved**` → `**Notification received**`.

### 6. `loggingEnabled(true)` example drops `notificationColor` and `notificationChannelName`

- **Files:**
  - `docs-android/troubleshooting.md` (advanced-logging snippet)
  - `docs-android/push-notifications/handling-interaction.md` (sample app)
- **README ref:** §4 lines 73–79; §6 lines 502–506
- **Issue:** §4's first init example uses the full 5-arg form (with `notificationColor` and `notificationChannelName`). Both subsequent examples that demonstrate `.loggingEnabled(true)` drop those two parameters. They're documented as optional, so the code is technically valid, but readers comparing the two examples may not realise that. Two separate occurrences of the same inconsistency.
- **Suggested fix:** Either keep the 5-arg form everywhere, or split the docs so the 3-arg form is shown once with explicit "the optional parameters are omitted here for brevity" prose.

---

## Group 3 — Misleading or outdated content

### 7. `intro.md` oversimplifies event tracking

- **File:** `docs-android/intro.md`
- **README ref:** §1, line 13
- **Issue:** Bullet says "Tracking customer behaviour through events - handled by Ometria." But §5 makes clear that *most* events are manually tracked. The RN intro phrases this more accurately:
  > "a subset of events is automatically handled by the Ometria SDK, but you have to customize it to your needs"
- **Suggested fix:** Rephrase to match the RN wording so users don't expect zero work. (Same fix should be applied to the iOS intro — it has the same wording.)

### 8. `their_id` jargon leaked into customer-facing docs

- **File:** `docs-android/events/product-events.md` § "View list of products"
- **README ref:** §5, line 277
- **Issue:** `id` "should be an attribute *their_id* that exists in the Ometria database" — `their_id` reads like an internal database column name. The iOS and RN docs share the same wording; all three should be cleaned up together.
- **Suggested fix:** Replace `their_id` with a customer-facing description, e.g. "the attribute identifier as it exists in the Ometria database".

### 9. Anchor link `#handling_interaction_with_notifications_that_contain_urls` was broken in the README

- **File:** Source-side issue only — already migrated in the port.
- **README ref:** §5, line 244
- **Issue:** Linked to an underscored anchor. Most Markdown renderers (including Docusaurus and GitHub) generate hyphen-slugs, so the anchor would not resolve in either rendering of the README.
- **Suggested fix:** In the port, rewritten to `./push-notifications/handling-interaction.md`. In the source README (if it's still maintained), the anchor should become `#handling-interaction-with-notifications-that-contain-urls` (hyphens) for GitHub rendering.

---

## Outside scope of phase 2 (worth tracking separately)

### Image hosting fragility

- **File:** `docs-android/installation.md` § 1 (Step 2)
- **Issue:** The Gradle Sync screenshot is `https://user-images.githubusercontent.com/8706456/91582697-...png` — an uploaded user asset that can be deleted/changed at any time and has no repo-tracking guarantees. Same fragility class flagged in the iOS port.
- **Suggested fix:** Migrate to `documentation/static/img/android/` and reference via `/img/android/...` URLs.
