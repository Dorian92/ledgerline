# 18 — Insights: calendar heatmap and hour-of-day

## Goal
Build the Insights tab's descriptive charts: a monthly calendar PnL heatmap with month navigation and an hour-of-day PnL/win-rate chart, both with sample-size caveats.
The tilt detector section comes in step 19. Pro gating comes in step 22, so everything is ungated in this step.

## Depends on
09 (07, 02).

## Read first
`docs/financial-semantics.md` §7, `docs/design-system.md` (overview "Insights", §5 charts a11y).

## Scope
1. `app/(tabs)/insights.tsx` → `src/features/insights/InsightsScreen.tsx`. Header "Insights" + a PRO pill placeholder (a visual-only pill now; step 22 wires the gating) + DEMO pill.
   A period `Segmented` (7D/30D/YTD/ALL, default ALL, persisted separately from the dashboard) applies to the hour chart and tilt (19). The calendar has its own month navigation.
2. Calendar card: header "October 2026" with ‹ › buttons (disabled beyond the first trade month / the current month) and the month total (`+$1,842.30`) on the right;
   weekday header M T W T F S S; 7-column grid of rounded cells; each cell shows the day number (small, top-left) and a compact net (`+412`, 0 dp, k-suffix ≥ 10k) when it has trades.
   Colors: green/red with 4 opacity steps by `intensity`; no trades → `neutralCell`; today outlined violet. Tapping a day → bottom sheet with that day's trades (`TradeRow`s) + the day total, tap → detail.
   Uses `calendarMonth` from step 07.
3. Hour-of-day card: title "PnL by hour of day", a "local time" caption (or "UTC" per the display tz), and `HourBarChart` (24 bars; up = green, down = red, from a zero baseline; x labels 0, 6, 12, 18, 23).
   A toggle "Net PnL | Win rate" (for win rate: bars from 0–100% with a 50% reference line; hours with < 5 trades are drawn hatched/muted and labeled "low sample").
   Tapping a bar shows a tooltip row below the chart: "14:00–15:00 · 18 trades · 61% win · +$412.80".
   Pure path/geometry builder in `src/ui/charts/bars.ts`, unit-tested.
4. Caveat footer: "Descriptive statistics of your past closed trades. Small samples can mislead. Not advice."
5. States: loading; empty (< 1 closed trade: "Insights appear after your first closed trades"); low data (< 20 closed trades in the period: the charts still render with a banner "Only N trades. Patterns may be noise").
6. A11y: the calendar grid is `accessibilityRole="grid"`-like: each cell has a label "October 12, profit 412 dollars, 3 trades"; the bar chart has a summary label + each bar accessible as a button when in tooltip mode.

## Out of scope
Tilt rules (19), gating (22), weekly/monthly breakdown tables, long/short splits.

## Tests
- `bars.ts` geometry: zero baseline when all positive / all negative / mixed; equal widths; low-sample flag.
- Calendar component: renders the correct leading blanks for a month starting Thursday; the total; navigation bounds; the day sheet lists that day's trades.
- Hour chart: the toggle switches the dataset; the tooltip text.
- View-model functions are pure and tested with the demo seed at a fixed `now` (the calendar totals equal the Σ of daily nets).

## Acceptance criteria
Calendar month totals and cells match the history's daily totals for the same days; the hour chart counts sum to the period trade count.

## Gates
A, D (`e2e/insights.yaml`: demo, previous month, tap a day, toggle the hour chart), V.

## Visual check
Compare with the overview's Insights panel: month header + total, grid density, green/red cell styling, the bar chart look, card spacing.
Expected deviation: real numbers; low-sample styling.
