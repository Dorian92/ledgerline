# 27 — Google Play Billing (one-time Pro unlock)

## Goal

Implement `PlayBillingProvider` for the non-consumable product `ledgerline_pro`, with acknowledgement, restore, pending and refund handling and an offline cache,
tested with license testers. No backend; the limitations are documented in `docs/monetization.md`.

## Depends on / user actions

22. **U-07, U-08** (Play Console account, the app on the internal track, the product created, license testers). Without these, steps 1–3 can be built and unit-tested, but D can't pass.

## Read first

`docs/monetization.md`, `docs/plans/22-pro-gating.md`.

## Scope

1. Library selection (record as a decision): evaluate the current `react-native-iap` and `expo-iap` against these criteria: supports Play Billing Library ≥ 7 (Google's required minimum at the time; check the current Play policy), the Expo config plugin / CNG, the New Architecture, one-time products, `acknowledgePurchase`, and maintenance activity. Pick one.
2. `src/platform/billing/playProvider.ts` implementing `EntitlementProvider`:
   - `init`: connect; listen for purchase updates; `getAvailablePurchases` → if `ledgerline_pro` is owned and `purchaseState === PURCHASED` → `pro:true, source:'play'`, and the cache is updated.
     If a purchase is **unacknowledged**, acknowledge it now.
   - `purchase`: launch the flow for `ledgerline_pro`; handle `PURCHASED` (acknowledge → cache → `ok`), `PENDING` (`pending:true`, UI "Purchase pending — it'll unlock when Google Play confirms it"), user cancel, and errors (the message mapped to friendly copy).
   - `restore`: query purchases again.
   - Refunds/revocation: when online queries succeed and the product isn't owned → `pro:false` and the cache is cleared. Offline (connection failure) → use the cache (`source:'cache'`), with no time limit (one-time purchase; the documented trade-off).
   - `getPriceLabel`: from the product details (a localized formatted price).
3. `selectProvider`: return `play` when `!__DEV__ || EXPO_PUBLIC_BILLING_MODE === 'play'` and the native module is available; `unavailable` otherwise.
4. Test plan `docs/release/billing-test-plan.md`: license tester account steps; cases: buy, cancel, pending ("slow test card"), restore after reinstall, refund from Play Console → revoked after the next app start, offline start after purchase, and the device with no Google account → unavailable messaging.
5. **Decision point: "release without billing"**. If U-07/U-08 can't be completed before release, stop and ask Dorian to choose:
   (a) delay the public release (internal testing only); (b) release with Pro shown as "Coming soon" (Pro features locked); (c) release with everything free (and accept that adding a paywall later reduces what existing users get, so it'd be best to grandfather existing users, which can't be done reliably without accounts). The recommendation is (a). Don't pick (b) or (c) without his explicit decision.

## Out of scope

Server verification, subscriptions, promo codes (Play promo codes work automatically for one-time products if Dorian creates them; no code is needed beyond purchase handling).

## Tests

Unit tests with the billing library mocked: owned/unacknowledged → acknowledged; pending; cancel; error mapping; a refund clears the cache; offline uses the cache; the provider selection matrix.

## Acceptance criteria

All the test-plan cases pass on an emulator with the Play Store (a "Google Play" system image) and a license tester account. The results are recorded in the test plan.

## Gates

A, D (manual, per the test plan).

## Review checklist

- [ ] Every purchase path acknowledges.
- [ ] No Pro grant on `PENDING`.
- [ ] No credentials or keys in the repo (Play Billing needs none client-side).
