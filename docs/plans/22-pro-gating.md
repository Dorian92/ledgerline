# 22 — Pro entitlement, gating and paywall (no real billing yet)

## Goal

Introduce the entitlement abstraction with the Unavailable and dev-only Mock providers, the paywall screen, and gating for the Pro features.
Make it impossible for a release build to grant Pro without real billing.

## Depends on / user actions

19, 20. U-06 (confirm the feature split; if it's not confirmed, implement the split from `docs/monetization.md` as is).

## Read first

`docs/monetization.md` (all), `docs/architecture.md` §6.

## Scope

1. `src/platform/billing/types.ts`:
   ```ts
   type EntitlementStatus = {
     pro: boolean;
     source: 'none' | 'mock' | 'play' | 'cache';
     checkedAt: number | null;
     pending?: boolean;
   };
   interface EntitlementProvider {
     kind: 'unavailable' | 'mock' | 'play';
     init(): Promise<void>;
     getStatus(): Promise<EntitlementStatus>;
     purchase(): Promise<
       | { ok: true }
       | { ok: false; reason: 'unavailable' | 'cancelled' | 'pending' | 'error'; message?: string }
     >;
     restore(): Promise<EntitlementStatus>;
     getPriceLabel(): Promise<string | null>; // localized price from the store, null when unknown
   }
   ```
2. `unavailableProvider.ts` (always `pro:false`, purchase → `unavailable`); `mockProvider.ts` (in-memory + `app_prefs.entitlement_cache` with `source:'mock'`; price label "$—.— (mock)").
3. `selectProvider.ts`: `if (__DEV__ && process.env.EXPO_PUBLIC_BILLING_MODE === 'mock') return mock; else if (playConfigured) return play /* step 27 */; else return unavailable;`
   On startup in a non-`__DEV__` build: if a cached entitlement has `source:'mock'`, **discard it**.
4. `scripts/check-release-config.ts` (run with `npx tsx`), used in step 28 and as `npm run check:release`:
   fails if `EXPO_PUBLIC_BILLING_MODE` is set to `mock` in `.env.production`/`eas.json`/the env, if the bundled `app.config.ts` resolves a mock flag, if `android.package` is the placeholder (warning until U-03, error when `--strict`), or if `allowBackup` isn't false. Unit-test its pure checker function.
5. `src/features/pro/useEntitlement.ts` (react-query + zustand mirror; re-checks on app resume), `<ProGate feature="insights"|"widget"|"accounts" fallback={...}>`.
   **Demo mode override**: `has('pro')` returns true when `mode==='demo'` (on demo data only) and the UI shows "Pro preview on demo data".
6. Gated surfaces:
   - Insights tab: non-Pro real mode shows a preview (the calendar of the current month visible, with the hour chart and tilt cards blurred/obscured by a card) "Unlock Insights with Ledgerline Pro" → paywall. The underlying numbers **aren't rendered** behind the blur (avoid leaking); show placeholder shapes.
   - Accounts: creating a 2nd real account → paywall. Existing extra accounts (e.g. created before gating, or after a refund) stay readable and editable; only creation is gated.
   - Widget: entitlement exposed to the widget snapshot (used in 23).
7. Paywall `app/pro.tsx` (modal): title "Ledgerline Pro", a one-time purchase line "One-time purchase · no subscription", a feature list (Insights: calendar, hours, tilt detector · Home-screen widget · Multiple accounts),
   "Everything else stays free: import, journal, dashboard, backups.", the price from `getPriceLabel()` or "Price shown by Google Play", a primary button "Unlock Pro" and a "Restore purchase" link.
   Provider states: `unavailable` → the button is disabled and the note reads "Purchases aren't available in this build."; `mock` → a top banner "MOCK PURCHASE — development only. No payment happens."
8. Settings → Ledgerline Pro row: status ("Unlocked · via Google Play" / "Not unlocked" / "Mock (dev)").

## Out of scope

Google Play Billing (27), promo codes, family sharing, time-limited trials.

## Tests

- `selectProvider` in combinations of `__DEV__` and env (mock `__DEV__` via jest globals).
- The release cache-discard rule.
- `ProGate` renders the fallback vs the children; demo override; the account-creation gate.
- The Insights locked preview doesn't render any real money values (query by text for the currency format → none).
- check-release-config pure checker cases.

## Acceptance criteria

- With a dev build and `EXPO_PUBLIC_BILLING_MODE=mock`, Pro can be toggled with a visible mock banner; without the env var, Pro can't be unlocked in real mode.
- `npm run check:release` fails when mock mode is configured.

## Gates

A, D (`e2e/pro.yaml` with mock mode: Insights locked in real mode → paywall → mock unlock → Insights visible), V (paywall, locked Insights).

## Review checklist

- [ ] There's no code path where `source:'mock'` yields Pro in a release build.
- [ ] Paywall copy makes no claims beyond the feature list; the price isn't hard-coded.
