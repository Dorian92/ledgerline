# Ledgerline — Architecture

Status: **accepted for v1** (planning phase, Nov 2026). Changes go through `docs/decisions.md`.

Ledgerline is a private, offline crypto trading journal for Android (Expo / React Native + TypeScript).
All data and computation stay on the device. There is no account, no backend, no analytics, and no
recurring infrastructure. The only network calls v1 makes are those Google Play Billing makes on its own
when a purchase is attempted or restored (step 27).

## 1. Platform and toolchain

| Concern | Decision | Notes |
|---|---|---|
| Framework | Expo, **latest stable SDK at step 01** (record exact version in `docs/decisions.md`) | New Architecture on (Expo default). |
| Language | TypeScript `strict: true`, `noUncheckedIndexedAccess: true` | No `any` in `src/domain`, `src/data`. |
| Target | **Android only** (emulator API 34+ x86_64; minSdk = Expo default) | No Xcode/iOS work. iOS is `docs/future-scope.md`. |
| Build | **Development build** via `npx expo run:android` (local Gradle). Not Expo Go. | Required by the widget, billing, SQLite native config. No EAS dependency (EAS free tier optional later). |
| Native project | **CNG / prebuild**: `android/` is generated and **gitignored**; all native config via `app.config.ts` + config plugins. | Keeps upgrades sane. If a custom Kotlin module is needed it lives in `modules/` (Expo Modules API). |
| Package manager | npm (lockfile committed) | |
| Navigation | `expo-router` (file-based, typed routes) | Tabs + modal routes + deep links. |
| Storage | `expo-sqlite` (async API) behind a `Db` interface | Tests use `better-sqlite3` behind the same interface. |
| Decimal math | `decimal.js` wrapped in `src/domain/money` | **No JS floats for money/qty/price in domain or import code.** |
| Async data | `@tanstack/react-query` | Query keys per account and mode. Mutations invalidate. |
| UI/session state | `zustand` (small stores: mode, active account, privacy prefs mirror) | |
| Forms | `react-hook-form` + `zod` | |
| Lists | `@shopify/flash-list` | History and import preview. |
| Charts | `react-native-svg` + our own pure path builders | No charting library; path math is unit-tested. |
| CSV | `papaparse` | Parse from a string read with `expo-file-system`. |
| Hashing | `@noble/hashes` (sha256) | Pure JS, the same in Jest and on device. |
| IDs | `expo-crypto` `randomUUID()` in the app, `node:crypto` in tests, through an injected `IdGenerator` | |
| Dates/TZ | `date-fns` v4 + `@date-fns/tz` | Hermes `Intl` time-zone support is verified in step 03. |
| Files | `expo-document-picker`, `expo-file-system`, `expo-sharing` | Import, backup, export. |
| Fonts | `@expo-google-fonts/inter`, `@expo-google-fonts/jetbrains-mono` | |
| Widget | `react-native-android-widget` (config plugin + headless task) | Fallback: our own Kotlin widget in `modules/` (step 23). |
| Notifications | `expo-notifications` local scheduling only | No push token, no FCM. |
| Privacy | `expo-local-authentication` (app lock), `expo-screen-capture` (block screenshots) | |
| Billing | `react-native-iap` or `expo-iap`, chosen in step 27 | Behind an `EntitlementProvider` interface. |
| Tests | Jest (`jest-expo` preset), `@testing-library/react-native`, `fast-check`, `better-sqlite3`; Maestro for device E2E | See `docs/testing-strategy.md`. |
| Lint/format | ESLint (`eslint-config-expo` flat config) + Prettier | Plus the import-boundary rules below. |

## 2. Source layout

```
app/                         expo-router routes (thin: wire hooks to feature components)
  _layout.tsx                providers, fonts, DB bootstrap, error boundary, app lock gate
  (onboarding)/              welcome.tsx, create-account.tsx
  (tabs)/                    _layout.tsx, index.tsx (Dashboard), trades.tsx, insights.tsx, settings.tsx
  trade/new.tsx              Quick add (modal)
  trade/[id]/index.tsx       Trade detail
  trade/[id]/edit.tsx        Edit (reuses the quick-add form)
  import/                    index.tsx (source + file), preview.tsx, result.tsx
  settings/                  accounts.tsx, privacy.tsx, data.tsx, reminders.tsx, about.tsx
  pro.tsx                    Pro / paywall (modal)
src/
  domain/                    PURE TypeScript. No react, react-native, or expo imports.
    money/                   Decimal wrapper, parse/format, units
    trade/                   Trade types, validation, PnL/R calculations, positions from fills
    metrics/                 periods, summary stats, equity/drawdown, daily/hourly/calendar aggregation
    insights/                tilt rules
    import/                  csv → detect → normalize → validate → dedupe → ImportPlan; adapters/
    backup/                  backup schema (zod) + (de)serialize
    demo/                    seeded synthetic data generator
  data/
    db/                      Db interface, expo adapter, migrations/, migrate.ts
    repositories/            accounts, trades, tags, imports, prefs
    queries/                 react-query hooks (useTrades, useDashboard, …)
  features/                  UI by feature: dashboard/, trades/, trade-form/, import/, insights/, settings/, onboarding/, pro/
  ui/                        tokens.ts, typography, primitives (Card, Pill, Button, Money, Segmented, Fab, Banner, EmptyState, ErrorState, Skeleton, Sheet, Chip)
  platform/                  widget/, notifications/, billing/, files/, privacy/ (native-facing adapters)
  state/                     zustand stores
  test/                      test utilities (sqlite test adapter, factories, render helpers)
fixtures/csv/
  real-anonymized/<exchange>/   anonymized REAL exports (see import-spec §6)
  synthetic/<exchange>/         generated files, filenames start with `SYNTHETIC_`
e2e/                         Maestro flows (*.yaml) + screenshots/ (gitignored output)
docs/                        this documentation
```

**Boundary rules** (ESLint `no-restricted-imports`, added in step 01 and tightened as folders appear):
- `src/domain/**` must not import `react`, `react-native`, `expo*`, `@tanstack/*`, `zustand`, `src/data`, `src/ui`, `src/features`, `src/platform`.
- `src/domain/**` and `src/data/**` must not use `parseFloat`, `Number(` or unary `+` on money strings. Use `src/domain/money`. Enforced with `no-restricted-globals` / `no-restricted-syntax` for `parseFloat`. `Number(` is covered by review.
- `src/features/**` must not import `src/data/db` directly. Go through repositories or query hooks.

## 3. Runtime data flow

```
UI (features/*) ──hooks──▶ data/queries (react-query) ──▶ repositories ──▶ Db (expo-sqlite)
       ▲                                                     │
       │                                     domain/* (pure) ◀┘  (calc on write; metrics on read)
       └──── invalidate on mutation ◀──── mutations (create/update/delete/import/restore)
```

- **Calc on write:** when a trade is created, edited, or imported, the repository calls
  `domain/trade/compute.ts` and stores the cached derived fields (`gross_pnl`, `net_pnl`, `risk_amount`,
  `r_multiple`, `calc_version`). Reads never recompute per-trade numbers. A migration bump of
  `CALC_VERSION` triggers a recompute of all trades at startup (step 05).
- **Metrics on read:** dashboard, history and insights load the closed trades of the active account
  (light row projection) and compute aggregates in `domain/metrics` in JS. Target: 10k trades in under
  150 ms on the emulator (step 25 verifies). No SQL aggregation of money (SQLite has no decimal type).
- **Invalidation:** every mutation invalidates `['account', mode, accountId]`-prefixed queries and calls
  `platform/widget.requestUpdate()` (step 23).

## 4. Data modes: Demo vs Real

There are two physically separate SQLite files:

| Mode | File | Contents |
|---|---|---|
| Real | `ledgerline.db` | User data plus the `app_prefs` table (the global prefs live here, including `mode`) |
| Demo | `ledgerline-demo.db` | Seeded synthetic data. Reset by deleting and re-seeding. |

- The active mode lives in `app_prefs.mode` (`'demo' | 'real' | 'unset'`) in the real DB, so the real DB
  file is always opened first (it's tiny when empty).
- A visible **DEMO DATA** pill sits in every screen header while in demo mode (mockup). Demo data is
  generated by `src/domain/demo` with a fixed seed, and every demo account is named "Demo account".
- Hard guarantees (tested): imports, backups, exports and restores **only operate on the real DB**.
  The import, backup and export entry points are disabled in demo mode with an explanation ("Switch to your
  journal to import"). The widget shows "DEMO" in demo mode. Manual add in demo mode writes to the demo DB
  and is wiped on reset.
- Pro features are unlocked inside demo mode, on demo data only, so users can evaluate them.

## 5. Navigation and deep links

- Scheme: `ledgerline`. Routes: `ledgerline://` (dashboard), `ledgerline://trade/new` (quick add),
  `ledgerline://trades`, `ledgerline://insights`.
- First launch (`mode = 'unset'`) shows `(onboarding)/welcome` with two choices: "Explore with demo data"
  or "Start my journal". The second creates an account (name, quote currency, optional starting balance).
- Tabs: Home, Trades, Insights, Settings (mockup bottom bar). A FAB on Home and Trades opens `trade/new`.
- Import is reached from Settings → Data and from the Home and Trades empty states.

## 6. Monetization architecture (summary; details in `docs/monetization.md`)

`src/platform/billing` exposes `EntitlementProvider { getStatus(); purchase(); restore(); }` with:
- `UnavailableProvider`: the default in any build where billing is not configured. Pro stays locked and
  the paywall says "Purchases aren't available in this build".
- `MockProvider`: only when `__DEV__ === true && EXPO_PUBLIC_BILLING_MODE === 'mock'`. The paywall shows a
  "MOCK PURCHASE — development only" banner. A startup assertion and a release-build check script
  (`scripts/check-release-config.ts`) fail if mock mode leaks into a release build.
- `PlayBillingProvider` (step 27): Google Play one-time non-consumable product.

Feature gating goes through `useEntitlement().has('pro')` and `<ProGate>` only.

## 7. Error handling and observability

- Root error boundary with "Something went wrong. Your data is safe on this device." plus Restart, and
  "Copy error details", which copies a local technical summary to the clipboard. Nothing is ever sent anywhere.
- Each screen has explicit `loading | empty | error | ready` states (`docs/design-system.md` §6).
- DB bootstrap failure (migration error) leads to a dedicated recovery screen offering "Export raw database
  file" (copies the .db via the share sheet) and "Reset app data" (double confirmation).
- No analytics, no crash-reporting SDK in v1 (privacy promise). This is a deliberate trade-off and is documented.

## 8. Security and privacy posture

- Data at rest: app-private storage (Android sandbox). There's **no SQLCipher in v1**. We rely on Android
  file-based encryption and the optional app lock. This is stated honestly in the privacy policy.
- `android:allowBackup` is set to **false** (config plugin) so journal data doesn't silently go to Google
  Drive auto-backup. Users back up explicitly through our backup file. See decision D-012.
- Backup files are plaintext JSON. The UI warns that a backup contains the whole journal. Encrypted
  backups are future scope.
- No `INTERNET` permission is needed for core features. Billing pulls in the Play Billing library, which
  talks to Google Play through the Play Store app. Step 28 verifies the final merged manifest permissions.
