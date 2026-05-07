# iOS Docs — Phase 2 Fixes

The 12 source-side issues originally listed here (3 Swift compile errors, 3 doc/data inconsistencies, 6 misleading-or-outdated content items) were applied directly to `docs-ios/` on 2026-05-07 and no longer need a separate phase-2 pass. The two items below remain because they extend beyond a quick edit pass.

---

## Outside scope (track separately)

### Image hosting fragility

- **Files:** `docs-ios/push-notifications/notification-service-extension.md`, `docs-ios/deep-linking.md`
- **Issue:** Two of the screenshots are uploaded GitHub user assets (`github.com/Ometria/ometria.ios_sdk/assets/6207062/...`) which can be deleted/changed and don't have repo-tracking guarantees. The other four are `raw.githubusercontent.com/wiki/...` (slightly more stable but still external).
- **Suggested fix:** Migrate all six images to `documentation/static/img/ios/` and reference them with `/img/ios/...` URLs.

### Pre-existing RN sidebar collision (not iOS-specific)

- **File:** `docs-react-native/events/`
- **Issue:** Both `basket-events.md` and `screen-events.md` have `sidebar_position: 4`. iOS docs avoid this; RN should be fixed too in a separate PR.
