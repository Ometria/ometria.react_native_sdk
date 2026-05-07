# Android Docs — Phase 2 Fixes

The 9 source-side issues originally listed here (Markdown rendering bugs, doc/data inconsistencies, misleading content) were applied directly to `docs-android/` on 2026-05-07 and verified against the SDK source at `ometria.android_sdk @ master`. See `ANDROID_PHASE2_REVIEW.html` in this directory for the full review. The one item below remains because it extends beyond a quick edit pass.

---

## Outside scope (track separately)

### Image hosting fragility

- **File:** `docs-android/installation.md` § 1 (Step 2)
- **Issue:** The Gradle Sync screenshot is `https://user-images.githubusercontent.com/8706456/91582697-...png` — an uploaded user asset that can be deleted/changed at any time and has no repo-tracking guarantees. Same fragility class flagged in the iOS port.
- **Suggested fix:** Migrate to `documentation/static/img/android/` and reference via `/img/android/...` URLs.
