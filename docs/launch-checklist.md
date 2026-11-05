# Ledgerline — Launch and user-action checklist

Items marked **U-** need Dorian (accounts, money, legal, real data, or decisions). Agents must not do
them, fake them, or work around them. Each step plan lists the U-items it depends on.

## User actions

| ID | Action | Needed by step | Notes |
|---|---|---|---|
| U-01 | Commit the mockup PNGs to `docs/design/mockups/` (`overview.png`, `1-dashboard.png`, `2-import.png`) | 02 | Needed for visual acceptance |
| U-02 | Set up an Android emulator locally (Android Studio, SDK 34+, Pixel 7 AVD) and install Maestro CLI | 01 (device gate) | Cloud agents may not have an emulator |
| U-03 | Decide the final application id (e.g. `app.ledgerline` or a reverse-domain you own) and the display name | before 28 (ideally 01) | Can't change after the first Play upload |
| U-04 | Export your **own** Binance/Bybit/OKX futures history CSVs (the date ranges should contain partial closes, a flip, both long and short, and fees in BNB if you use that) and run `scripts/anonymize-csv.ts` locally | 11 | Never commit raw exports. Commit only the anonymized output after reviewing it |
| U-05 | Review the anonymized fixtures, confirm no personal data (UID, order IDs, exact sizes if you prefer) | 11 | |
| U-06 | Confirm the Pro feature split and price hypothesis (docs/monetization.md) | 22 | |
| U-07 | Google Play Console developer account (one-time fee), payments profile, tax info | 27 | Not recurring |
| U-08 | Create the app in Play Console, upload an internal testing AAB, create the in-app product `ledgerline_pro` (non-consumable), set the price, add license testers | 27 | Billing can't be tested before this |
| U-09 | Generate an upload keystore and store it **outside the repo** with a backup; enroll in Play App Signing | 28 | Losing it is costly |
| U-10 | Host the privacy policy at a public URL (e.g. a free static page you control) | 28 | Play requires a URL |
| U-11 | Fill in the Play Data safety form (answers drafted in step 28), content rating, target audience, store listing (texts drafted in step 28), screenshots (from step 26) | 28 | |
| U-12 | Decide whether to publish the source repo (the planning repo is a private draft) and whether to enable PR-per-step on the forge | any | See docs/workflow.md |
| U-13 | Legal review of the financial disclaimer and privacy policy for your jurisdiction (optional but recommended) | 28 | Drafts aren't legal advice |

## Pre-release checklist (step 28 executes and ticks it)

- [ ] `npm run check` green; all Maestro flows green on API 34 emulator (and one older API, e.g. 29, if time allows)
- [ ] `scripts/check-release-config.ts` passes (no mock billing, correct app id, versionCode bumped, `allowBackup=false`, no debug-only permissions)
- [ ] Merged manifest reviewed: permissions list recorded in `docs/release/permissions.md`
- [ ] Release AAB builds locally (`./gradlew bundleRelease`) and installs via `bundletool` for a smoke test
- [ ] Demo/real separation verified manually: fresh install → demo → switch to real → import → backup → delete all
- [ ] Privacy policy final, hosted (U-10), linked in app (Settings → About) and in the store
- [ ] Store listing has no claims of "AI", predictions, guaranteed results, "first/only", or market comparisons
- [ ] Financial disclaimer in About and onboarding: "Ledgerline is a journal. It doesn't give financial advice."
- [ ] Billing tested with license testers: purchase, restore after reinstall, refund → revoked on next check, offline start keeps the cached entitlement (step 27)
- [ ] Widget tested: add, update after a trade, hide-amounts, demo label, tap `+` opens quick add
- [ ] Accessibility pass (step 25 report) with no open blockers
- [ ] Visual baseline accepted (step 26)
