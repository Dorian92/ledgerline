# 07 — Metrics engine

## Goal
Pure functions for periods, summary metrics, equity/drawdown series, and daily/hourly/calendar buckets, exactly as specified.

## Depends on
04 (03).

## Read first
`docs/financial-semantics.md` §5–§7 (normative).

## Scope
1. `src/domain/metrics/types.ts`: `MetricTrade` (the projection from `listClosedForMetrics`, with Dec fields), `PeriodKey = '7D'|'30D'|'YTD'|'ALL'`.
2. `periods.ts`: `periodRange(key, now, tz): { start: number | null; end: number }`; `inPeriod(trade, range)` by `closedAt`.
3. `summary.ts`: `computeSummary(trades: MetricTrade[], range, opts: { startingBalance: Dec | null }): Summary`
   ```ts
   interface Summary {
     netPnl: Dec; tradeCount: number; wins: number; losses: number; breakevens: number;
     winRate: Dec | null; avgR: Dec | null; rSampleSize: number;
     equity: { t: number; e: Dec }[];             // includes the start point
     startEquity: Dec; endEquity: Dec;
     maxDrawdownAbs: Dec; maxDrawdownPct: Dec | null;
     returnPct: Dec | null;
     caveats: { fundingUnknown: number; feesIncomplete: number };
   }
   ```
   `trades` is the full closed list (all time), so the start equity can include pre-period trades.
4. `buckets.ts`: `dailyPnl(trades, tz): Map<DayKey, { net: Dec; count: number; wins: number; losses: number }>`;
   `hourOfDay(trades, tz): Array<{ hour: 0..23; count; wins; losses; net: Dec; winRate: Dec | null }>` (by `openedAt`);
   `calendarMonth(trades, year, month, tz): { days: Array<{ dayKey; net: Dec | null; count; intensity: 0|1|2|3|4 }>; total: Dec; firstWeekday: number }`
   (weeks start **Monday**, matching the mockup's M T W T F S S).
5. `series.ts`: `downsampleEquity(points, maxPoints = 120)` (keeps first, last, min and max per bucket). This is a display helper and stays Dec until the chart layer.
6. `src/domain/metrics/index.ts` re-exports.

## Out of scope
UI, tilt rules (19), SQL aggregation.

## Tests
- Periods: 7D on 2026-11-05 15:00 Europe/Berlin starts 2026-10-30 00:00 local; 30D across the DST change on 2026-10-25; YTD; ALL `start=null`.
- Summary on a hand-built set of 6 trades (write the expected values out in the test): net, wins/losses/breakeven, winRate excludes breakeven, avgR over the R subset only with `rSampleSize`.
- Equity/DD: equity sequence 10000 → 10500 → 9975 → 10200 → 9800 → 11000: DD_abs = 700 (10500 → 9800), DD_pct = 6.666…%. Starting balance null → DD_pct null, DD_abs computed from E_0=0 sequence.
  Peak ≤ 0 anywhere → pct null.
- Period start equity includes earlier trades.
- Return pct null when E_0 ≤ 0.
- Daily: a trade closing at 23:30 UTC lands on the next day in Europe/Berlin. Σ daily net == period net (property).
- Hour-of-day uses openedAt (a trade opened 21:50 and closed 22:10 → hour 21).
- Calendar: Oct 2026 starts on Thursday (firstWeekday index 3 with Monday=0); intensity scaling (the max-abs day gets 4, zero → 0, no trades → null net).
- Caveat counts.
- Performance test: 10k generated trades, `computeSummary` + `dailyPnl` + `hourOfDay` < 300 ms in Node (a loose CI bound; the device budget is checked in 25). Mark it with `test.concurrent` off and a generous timeout.

## Acceptance criteria
All tests pass; functions are pure (take `now`/`tz`); coverage ≥ 90%.

## Gates
A.

## Review checklist
- [ ] Sorting by `(closedAt, id)` everywhere for determinism.
- [ ] DST-safe day arithmetic only through `src/domain/time`.

## Risks / notes
Decimal-heavy loops over 10k trades are fine. If the Node bound fails, sum in a single pass and avoid creating intermediate arrays.
