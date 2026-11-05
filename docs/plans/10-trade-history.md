# 10 — Trade history

## Goal
Build the Trades tab from the overview mockup: trades grouped by local day with daily PnL headers, an "Open" section, search,
filter chips plus an advanced filter sheet, and edit/delete with immediate recalculation and undo.

## Depends on
07, 08.

## Read first
`docs/financial-semantics.md` §7, `docs/design-system.md` (overview "Trades", correction 5).

## Scope
1. `npx expo install @shopify/flash-list`.
2. Data: `useHistory(filter)` loads the account's trades via `trades.listForHistory(accountId, filter)`. For v1 load all matching rows (no paging)
   with a light projection, because ≤ 10k rows is fine. Build sections with a pure `buildHistorySections(trades, tz, now)` in `src/domain/metrics/history.ts`:
   `[{ kind: 'header', dayKey, label: 'Today · Thu, Nov 5' | 'Wed, Nov 4' | 'Mon, Oct 12, 2025', net: Dec, count }, { kind: 'trade', … }, …]`,
   with the "Open" section first. Header net = Σ net of the **filtered** trades of that day (a label says "filtered" when a filter is active).
3. Filter model `src/domain/metrics/filter.ts`: `{ text?: string; symbols?: string[]; direction?: 'long'|'short'; outcome?: 'win'|'loss'|'breakeven';
   emotions?: Emotion[]; tagIds?: string[]; from?: DayKey; to?: DayKey; source?: 'manual'|'import' }`, applied in SQL where simple (account, direction, source, date range, symbols)
   and in JS for text (symbol + notes, case-insensitive), outcome, emotions and tags. Pure `matchesFilter` is unit-tested.
4. UI `src/features/trades/TradesScreen.tsx`:
   - Header "Trades" (+ DEMO pill), a search field (debounced 200 ms) and quick chips like the mockup: **All**, plus the top 3 symbols by count (dynamic, not hard-coded BTC/ETH/SOL), **Losers**, and "Filters" (opens a sheet with all filter fields and Reset/Apply).
   - FlashList with sticky day headers (`stickyHeaderIndices`), `TradeRow` items with the symbol, side pill, leverage, `HH:mm · first setup tag`, net and R.
   - Swipe isn't required. Long-press a row → action sheet: Edit, Delete. Tap → detail.
   - Delete → removed optimistically plus a snackbar "Trade deleted · Undo" for 5 s. Undo re-inserts the same row (keep the full `TradeRow` + tags in memory; repo `restore(trade)` inserts with the original id).
   - FAB → quick add.
   - States: loading skeleton rows; empty account ("No trades yet" + Import / Add); no results ("No trades match these filters" + Reset).
5. Totals recalc: after any mutation, invalidation refreshes the history and dashboard. Verify that editing a trade's close date moves it to another day section.

## Out of scope
CSV export from history (21), bulk select, pagination.

## Tests
- `buildHistorySections`: grouping by local day across midnight in two tz; the Open section first; day net sums; labels for today/yesterday/this year/other years.
- `matchesFilter`: each field and combinations.
- Component: search filters rows; the Losers chip; empty states; delete + undo restores the row and the header total (mock repo).
- Repo: `restore(trade)` round-trip equality, including tags.
- Performance: `buildHistorySections` on 10k trades < 100 ms in Node.

## Acceptance criteria
- Day headers always equal the sum of their visible rows.
- Deleting or editing updates the dashboard numbers when switching back to Home (no stale cache).
- Smooth scroll with 10k demo-scale trades (dev-only "Seed 10k trades" action in the dev gallery, used again in 25).

## Gates
A, D (`e2e/history.yaml`: demo, search "ETH", the Losers chip, open a trade, delete + undo, delete, check the header total changed), V.

## Visual check
Compare with the overview's Trades panel: title, chip row, day header with the date left and the colored daily total right, row layout.

## Review checklist
- [ ] Sticky headers work on Android with FlashList (if broken, fall back to non-sticky headers and record a decision).
- [ ] Undo doesn't duplicate on a double tap.
