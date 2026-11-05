# 28 — Release preparation (Android / Google Play)

## Goal
Make Ledgerline releasable on Google Play: release build configuration and signing guide, a permissions audit, privacy policy and store listing drafts,
Data safety answers, an updated local run guide, and execution of the pre-release checklist. Uploading and publishing stay user actions.

## Depends on / user actions
26, 27 (or the step 27 decision point resolved). **U-03, U-09, U-10, U-11** (U-13 recommended).

## Read first
`docs/launch-checklist.md`, `docs/monetization.md`, `docs/architecture.md` §8.

## Scope
1. **Config**: the final `android.package` (U-03) and `versionCode`/`version` in `app.config.ts`, with the policy: `versionCode = major*10000 + minor*100 + patch`. Release icon and adaptive icon (violet "L" mark; simple vector-derived PNGs) and the splash.
2. **Signing (guide + config, no secrets in git)**: `docs/release/signing.md`: generate an upload key with `keytool` (U-09), store it outside the repo, and put its path and passwords in `~/.gradle/gradle.properties` (`LEDGERLINE_UPLOAD_STORE_FILE`, …).
   A config plugin `plugins/withReleaseSigning.ts` adds a `signingConfigs.release` that reads these properties **only if present** (otherwise the release falls back to debug signing with a loud Gradle warning, so local release-variant testing still works).
3. **Build**: `npm run build:aab` → `expo prebuild --platform android --clean && cd android && ./gradlew bundleRelease`; `npm run build:apk-release` for local install testing (`assembleRelease`). Document `bundletool build-apks --connected-device` for testing the AAB.
4. **Permissions audit**: inspect the merged manifest (`android/app/build/intermediates/merged_manifests/release/...`) and record every permission and its source in `docs/release/permissions.md`.
   Use `android.blockedPermissions` in the config to remove unneeded ones (e.g. `SYSTEM_ALERT_WINDOW`, `READ/WRITE_EXTERNAL_STORAGE` if they're pulled in, and `INTERNET` **only if** verified that the release build works without it, including billing via the Play Store IPC. If unsure, keep `INTERNET` and say so honestly in the privacy policy: "The app makes no network requests of its own; Google Play's billing component communicates with Google").
5. **check-release-config** (`npm run check:release -- --strict`): extend it with the fixed-clock env, the package placeholder, versionCode monotonicity (compared with `docs/release/versions.md`), and `allowBackup`.
6. **Privacy policy draft** `docs/release/privacy-policy.md` (and the in-app `src/content/privacyPolicy.ts` generated from it): what's stored (journal data on the device only), what isn't collected (no account, no analytics, no ads, no tracking), imported files processed on-device, backups user-controlled, purchases processed by Google Play (subject to Google's policy), notifications local only, app lock via Android biometrics (the app never receives biometric data), data deletion (in-app Delete all data plus uninstall), children (not directed at children), contact email (placeholder for Dorian), effective date. Mark it "Draft — not legal advice (U-13)".
7. **Store listing draft** `docs/release/store-listing.md`: the app name, a short description (≤ 80 chars, e.g. "Private, offline crypto trading journal. Import CSVs, track PnL, spot tilt."), a full description (honest; lists the supported exchanges exactly as shipped; no AI/prediction/advice claims; mentions the one-time Pro unlock and what's free), screenshot list (from `docs/design/accepted/`), feature graphic notes, category (Finance), contact details placeholder.
8. **Data safety form answers** `docs/release/data-safety.md`: data collected: none (the developer collects nothing); data shared: none; purchase history is handled by Google Play (per Play guidance this is usually not declared by the developer when the developer doesn't receive it; verify with the current Play documentation and note the source); encryption in transit: N/A; deletion: in-app.
9. **Financial disclaimer** verified in onboarding, About and the store listing.
10. **README / local run guide**: prerequisites, emulator setup, dev build, tests, e2e, release build, troubleshooting (Gradle JDK, KVM, Metro port 8137).
11. **Execute `docs/launch-checklist.md` → Pre-release checklist**, ticking each item with evidence (commands/output in the progress log). Upload, publishing, the Play Console forms and pricing are U-actions; prepare everything they need.
12. Tag `v1.0.0` in git after Dorian approves (don't tag before that).

## Out of scope
Publishing to production, iOS, marketing site, EAS Submit.

## Acceptance criteria
`npm run check`, `npm run e2e`, `npm run check:release -- --strict` and `npm run build:aab` all succeed; all the docs above exist; the pre-release checklist is fully ticked or the remaining items are explicitly U-owned.

## Gates
A, D (release APK smoke on the emulator: onboarding, import, quick add, widget, backup, purchase via a license tester if 27 is done).
