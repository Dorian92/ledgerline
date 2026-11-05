# 04 — Trade calculations

## Goal
Implement trade types, input validation, per-trade derived values (gross/net PnL, risk, R), and
average-cost position reconstruction from fills, exactly as specified.

## Depends on
03.

## Read first
`docs/financial-semantics.md` §2–§4 (normative), `docs/data-model.md` (Domain types).

## Scope
1. `src/domain/trade/types.ts`: the types from data-model.md (`TradeInput`, `TradeDerived`, `Direction`, `Emotion`, …) plus `SymbolInfo { display, base, quote, instrument }`.
2. `src/domain/trade/symbol.ts`: `parseSymbol(raw: string, instrument: 'perp'|'spot'): SymbolInfo | null` for inputs like
   `BTCUSDT`, `BTC-USDT`, `BTC/USDT`, `BTC-USDT-SWAP`, `BTC-PERP` (manual entry), uppercasing; quote suffix in {USDT, USDC, USD}.
   Manual entry also accepts a bare base (`BTC`) with the account quote → `BTC-PERP`.
3. `src/domain/trade/validate.ts`: `validateTradeInput(input, account): ValidationResult` with field errors:
   `symbol_required`, `quote_mismatch`, `entry_positive`, `exit_positive`, `qty_positive`, `stop_positive`,
   `closed_before_opened`, `exit_without_close_time` / `close_time_without_exit`, `notes_too_long`, `fees_invalid`.
   A stop on the wrong side is **not** a validation error. It's allowed and yields R unavailable with a UI hint.
4. `src/domain/trade/compute.ts`: `export const CALC_VERSION = 1; computeTrade(input: TradeInput): TradeDerived` per §3.1–§3.3,
   `classifyOutcome(net: Dec): 'win'|'loss'|'breakeven'` per §3.4.
5. `src/domain/trade/positions.ts`: `buildPositionsFromFills(fills: FillInput[], opts: { mode: 'one-way'|'hedge' }): PositionBuildResult`
   - `FillInput { sourceIndex, key: {symbol, positionSide}, side, price, quantity, feeQuote: Dec, feeOther?: {asset, amount}, executedAt, reportedRealizedPnl? }`
   - Output: `{ closed: BuiltTrade[]; stillOpen: { key, sourceIndexes[] }[]; errors: { sourceIndex, code }[] }`,
     where `BuiltTrade` contains the `TradeInput` fields (minus account/tags/notes) + `sourceIndexes[]` + `feesComplete` + `reportedRealizedSum?`.
   - Implements §4 exactly: increase, reduce, close at exact zero, flip split with a prorated fee, orphan reduce → `opened_before_export`
     for that key's fills until flat, still open at the end, hedge-mode flip → `inconsistent_hedge_fill`, no dust tolerance.
   - Sorting: `(executedAt, sourceIndex)`, stable.
6. `src/domain/trade/index.ts` re-exports.

## Out of scope
DB, UI, CSV specifics, funding import.

## Tests (cite § numbers in test names)
- §3.3 worked example: gross 124.125, net 120.025, risk 58.875, R ≈ 2.0386 (`toFixed(4)` = `2.0386`), display `+2.04R`.
- Short example: entry 3512.8, exit 3541.2, qty 2.4, fees 3.1 → gross −68.16, net −71.26. Stop 3560 → risk 113.28, R −0.6291….
- R unavailable reasons: no stop; long with stop above entry; short with stop below entry; stop == entry; open trade.
- Funding sign: funding −1.5 reduces net; +2 increases it. A rebate fee −0.4 increases net.
- Property: `gross(long,e,x,q) == −gross(short,e,x,q)`; `net == gross − fees + funding`; R sign == net sign when available.
- Outcome: net 0.004 → breakeven, 0.005 → breakeven (half-even to 0.00), 0.006 → win, −0.006 → loss.
- Positions:
  1. Simple long open/close with 2 fills.
  2. Scale in (3 buys) and scale out (2 sells) → one trade, avg prices, maxQuantity = total buy qty.
  3. Partial close leaves an open remainder → `stillOpen`.
  4. Flip: long 1 BTC, sell 1.5 → close 1 (fee prorated 2/3) + open short 0.5, then close → 2 trades.
  5. Orphan reduce at file start → errors for those fills; later fills of a fresh position are fine.
  6. Hedge mode: simultaneous long and short keys produce independent trades; a hedge flip → error.
  7. Non-quote fee (BNB) → `feesComplete=false`; quote fees summed only.
  8. Property: for random valid fill sequences that end flat, `Σ realized` == `computeTrade` gross on the built averages, and Σ built quantity == Σ reducing fill quantity.
  9. Exact-zero rule: a residual 1e-18 → still open (no dust tolerance).

## Acceptance criteria
- 100% of the above cases pass. Domain coverage stays ≥ 90%.
- No function reads the clock or the time zone.

## Gates
A.

## Review checklist
- [ ] Average entry isn't recomputed on reductions.
- [ ] Prorated fee uses exact decimal division (no rounding).
- [ ] Unknown cases return errors, not best guesses.

## Risks / notes
Exchanges may compute realized PnL per fill with rounding. That's why exchange-reported values are a
consistency check (`pnl_mismatch` warning) and not an assertion in this step.
