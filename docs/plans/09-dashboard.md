# 09 — Dashboard

## Goal

Build the Home dashboard from the mockup: period selector, net PnL hero, stat tiles, equity curve, recent trades and FAB, with all states.

## Depends on

07, 08.

## Read first

`docs/financial-semantics.md` §5–§6, `docs/design-system.md` (mockup 1-dashboard, corrections 4 and 6), `docs/architecture.md` §3.

## Scope

1. `src/data/queries/useDashboard.ts`: loads `listClosedForMetrics(accountId)` (cached under `[mode, accountId, 'metricsTrades']`),
   computes `computeSummary` for the selected period in a `useMemo`. The period is held in zustand `src/state/ui.ts` (`dashboardPeriod`, default `30D`, persisted in prefs).
   `now` comes from a `useNow(60_000)` hook (a minute tick) so "today" rolls over. `tz` comes from `useDisplayTz()` (device tz via `Intl.DateTimeFormat().resolvedOptions().timeZone`; the UTC pref arrives in 20).
2. `app/(tabs)/index.tsx` → `src/features/dashboard/DashboardScreen.tsx` in a ScrollView:
   - Header: eyebrow account name ("Ledgerline" in the mockup → use the account name), title "Dashboard", right: DEMO pill when in demo mode.
   - Caption `NET PNL · 30D`; hero `Money` (40 sp mono, colored); subline `+25.26% · 142 trades` (the percent only when `returnPct` is non-null).
   - `Segmented` 7D / 30D / YTD / ALL.
   - 3 `StatTile`s: WIN RATE (`58.4%` or `—`), AVG R (`+0.62R` or `—`, with the sample size in the a11y label and a long-press/tap info sheet "Average over 37 of 142 trades with a stop"),
     MAX DD (`−8.7%`, or the abs amount when pct is null).
   - An info icon on the stat row opens the caveat sheet (financial-semantics §6 text + funding/fees caveat counts).
   - Equity curve card: title "Equity curve", right `$10,000 → $12,526` (start → end, compact 0 dp), and `EquityChart`.
   - Tilt banner slot: render nothing for now (step 19 fills it).
   - Recent trades card: the 3 most recently closed trades (`TradeRow`), "See all" → Trades tab. Tapping a row → detail.
   - FAB (bottom-right, above the tab bar) → `trade/new`.
3. `src/ui/charts/EquityChart.tsx`: props `{ points: {t:number; e:Dec}[]; height?: number }`. It uses a pure `buildEquityPath(points, width, height, padding)` in
   `src/ui/charts/paths.ts` (converts Dec → number **only here**, documented), with a line `#22C55E` (red if end < start), gradient fill, 3 dotted gridlines and an end dot.
   An empty or 1-point series → a flat baseline with "Not enough trades yet".
   A11y: `accessible` with a summary label (design-system §5).
4. States: loading skeleton (hero, tiles, chart), error with retry, **empty real account** ("No closed trades yet" + "Import trades" (disabled until 17, showing "Coming soon"; keep the button wired to the `import` route once it exists) + "Add a trade"),
   **empty period** (the account has trades but none in the period: "No trades closed in the last 7 days" + a link to switch to ALL).
5. Hide-amounts support: pass `hidden` from a `usePrivacy()` hook (a stub returning false until step 20).

## Out of scope

Tilt banner logic (19), account switcher (20), widget (23).

## Tests

- `buildEquityPath`: monotonic x, min/max mapping, a single point, all-equal values (no divide by zero).
- DashboardScreen with a mocked `useDashboard`: renders hero/tiles/chart with formatted values; `—` for null winRate/avgR; DD falls back to abs; the empty real-account state; the empty-period state; the loading skeleton; the error retry calls refetch.
- Integration: for the demo seed with a fixed `now`, the numbers shown equal `computeSummary` outputs (test via a pure `toDashboardViewModel(summary)` function).

## Acceptance criteria

- Every number on screen comes from `computeSummary` via the view model; nothing is computed in components.
- Period switch updates all numbers within one render.
- The demo dashboard's "today" trades match what history shows in step 10.

## Gates

A, D (`e2e/dashboard.yaml`: demo mode, switch through the 4 periods, tap "See all", tap the FAB, then close), V.

## Visual check

Side by side with `1-dashboard.png`: order (header, caption, hero, subline, segmented, tiles, equity card, [banner], recent trades, FAB), colors, the gradient chart, tile typography.
Expected deviations: real computed values; USD glyph only for USD accounts.

## Review checklist

- [ ] The Dec→number conversion happens only in `paths.ts`.
- [ ] The minute tick doesn't recompute metrics unless the day/period range changes (memo on range).

## Risks / notes

`react-native-svg` gradient (`LinearGradient` + `Defs`) works on Android. Keep the path ≤ 120 points via `downsampleEquity`.
