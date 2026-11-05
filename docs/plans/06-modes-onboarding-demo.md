# 06 — Data modes, onboarding and demo data

## Goal

Separate demo data from real data physically (two DB files), add first-run onboarding with "Explore demo" /
"Start my journal", create the first real account, and add a deterministic, self-consistent synthetic demo dataset.

## Depends on

02, 05.

## Read first

`docs/architecture.md` §4–§5, `docs/design-system.md` §4 (items 4–6), `docs/data-model.md`.

## Scope

1. `src/state/session.ts` (zustand): `{ mode: 'unset'|'demo'|'real'; activeAccountId: string | null; setMode; setActiveAccount }`,
   hydrated from the real DB's `app_prefs` at bootstrap and persisted on change.
2. `src/data/bootstrap.ts`: extend to `openDatabases()` → `{ realDb, getDemoDb(): Promise<Db> }`. The demo DB (`ledgerline-demo.db`) is created on first
   demo use, migrated, and seeded if empty. `resetDemo()` closes the demo DB, deletes the file (`expo-file-system`, `SQLite.deleteDatabaseAsync`), then re-seeds.
3. `DbProvider` exposes the DB **for the current mode**. Switching mode re-keys the React Query cache (query keys start with `[mode, accountId]`) and remounts the tabs.
4. `src/domain/demo/generate.ts`: `generateDemoData({ seed: number, now: number, tz: string }): { account; trades: TradeInput[] }`
   - A seeded PRNG (mulberry32), **no Math.random**.
   - Account: "Demo account", quote `USD`, starting balance `10000`.
   - ~220 closed trades over the 120 days before `now` plus 2 open trades. Symbols BTC-PERP, ETH-PERP, SOL-PERP (realistic price bands), long/short ~60/40,
     ~58% win rate, ~70% with valid stops, emotions mostly calm with some FOMO/revenge/fear, setup tags from the defaults, short notes from a fixed list.
   - Deliberately embed patterns that the tilt rules (step 19) can find: several trades opened < 5 min after a loss, a size increase after
     3-loss streaks, and a weaker win rate for trades opened after 22:00 local.
   - Today has exactly 3 closed trades (2 wins, 1 loss) so the dashboard, history and widget show the same "today".
   - Prices/quantities are generated as decimal strings (integer math on scaled ints, then converted), never floats.
   - `source: 'demo'`.
5. Seeding inserts through the trades repository (so derived values are computed by the real code) in a single transaction.
6. Onboarding routes:
   - `app/(onboarding)/welcome.tsx`: the Ledgerline wordmark, the value line "A private trading journal that lives on your phone.",
     3 bullets (Offline. No account. / Import Binance, Bybit, OKX CSVs*, where the asterisk lists only the exchanges actually supported and is updated in step 17 /
     Spot tilt patterns in your own data), a primary button "Start my journal", a secondary "Explore with demo data", and the footer disclaimer
     "Ledgerline is a journal, not financial advice."
   - `app/(onboarding)/create-account.tsx`: name (default "Main"), quote currency (USDT default / USDC / USD), optional starting balance with
     helper text "Used for % return and drawdown. You can change it later." → creates the account → mode `real` → `(tabs)`.
   - Root `app/index.tsx` redirects based on `mode`: unset → welcome, otherwise → tabs.
7. `DEMO DATA` pill in `ScreenHeader` when `mode === 'demo'`. Tapping it opens a small sheet: "You're viewing sample data. Nothing here is real."
   with "Start my journal" (switch to real; goes to create-account if there are no real accounts) and "Reset demo data".
8. Demo guards: `src/features/guards.ts` `useRealModeOnly()` returns `{ allowed: boolean, reason }`. Import, backup, export and restore entry points (built later) must use it.
   Add a unit test helper so later steps can assert it.
9. Placeholder Home in this step: show the account name, mode and trade count (temporary dev text, replaced in 09) so the device gate can verify seeding.

## Out of scope

Settings screen (20); multiple real accounts UI (20); dashboard UI (09).

## Tests

- Generator determinism: same seed + now → deep-equal output; a different seed → different output.
- Generator consistency: every trade passes `validateTradeInput`; today has 3 closed trades, 2 wins and 1 loss; win rate between 50 and 65%;
  ≥ 5 revenge-pattern trades; ≥ 2 oversize-after-streak instances; post-22:00 win rate ≥ 15 pp below overall (tz `Europe/Berlin` and `UTC` both checked).
- Separation (better-sqlite3 with two DBs): seeding demo writes nothing to the real DB; `useRealModeOnly` is false in demo; a real-DB scan for `source='demo'` finds 0 rows.
- Onboarding component tests: create-account validation (empty name, starting balance ≤ 0 rejected, comma decimal accepted).
- Mode switch: the query cache keys change (unit test on a key factory `qk.trades(mode, accountId)`).

## Acceptance criteria

- Fresh install → welcome. Demo → tabs with the DEMO pill and a seeded count. Pill → "Start my journal" → create account → real mode with 0 trades.
- Relaunch keeps the mode. "Reset demo data" regenerates relative to the current date.

## Gates

A, D (`e2e/onboarding.yaml`: fresh install with `clearState`, then demo path, then switch to real, then create an account), V.

## Visual check

Welcome, create-account and the demo pill sheet. No mockup exists for these, so follow the tokens and the dashboard header style. Check the copy is honest.

## Review checklist

- [ ] No code path can write `source='demo'` rows into the real DB.
- [ ] Generator uses no floats or `Math.random`.
- [ ] Mode persists across restarts.

## Risks / notes

Closing and deleting an open expo-sqlite DB while queries are in flight can crash. Cancel and clear React Query first, then close, then delete.
