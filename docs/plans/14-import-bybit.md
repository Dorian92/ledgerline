# 14 — Bybit adapter

## Goal
Implement the Bybit derivatives CSV adapter exactly as documented in `docs/import-formats/bybit.md`, validated against the real anonymized fixture.

## Depends on
11 (Bybit = supported), 12. Skip if unsupported (same rule as step 13).

## Read first
`docs/import-formats/bybit.md`, `docs/import-spec.md` §3–§5, `docs/financial-semantics.md` §3–§4 and Q-01.

## Scope
1. `src/domain/import/adapters/bybit.ts`, the same structure as step 13.
2. If the chosen export is **closed P&L** (`kind: 'closed-positions'`):
   - Map entry/exit average, closed qty, closed PnL (→ `pnlSource='exchange'`, `reportedGrossPnl` = PnL **before** fees if the export separates fees, otherwise follow the doc's semantics precisely; if the doc can't establish whether PnL is net or gross, mark the adapter unsupported and record it),
     fees (opening + closing, if given), open/close times if present (if only the close time exists, `openedAt = closedAt` and the detail screen notes "open time unknown". Record this in the format doc. Hour-of-day insights then exclude these trades, so add an `openedAtKnown` flag. **If this flag is needed, add migration 0002** with `opened_at_known INTEGER NOT NULL DEFAULT 1`, and update data-model.md).
   - Partial closes: follow the Q-01 answer. If each row is a partial close, each row becomes its own trade, and the format doc + the import preview message say so: "Bybit reports each partial close separately; they're imported as separate trades."
   - `maxQuantity = quantity` (unknown peak) → R uses the closed qty (it only matters once the user adds a stop).
3. If the chosen export is **fills**: identical approach to Binance.
4. Register the adapter.

## Out of scope
Spot, options, USDC options, unified-account transaction logs.

## Tests
The same categories as step 13: real fixture totals exact, synthetic edge cases from the verified header, detection.

## Acceptance criteria / Gates
Same as step 13. Gate A.

## Review checklist
- [ ] Net-vs-gross semantics of the PnL column are justified with evidence in the format doc.
