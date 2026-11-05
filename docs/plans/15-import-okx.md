# 15 — OKX adapter

## Goal
Implement the OKX derivatives CSV adapter exactly as documented in `docs/import-formats/okx.md`, with the contract-size rule from import-spec §5.

## Depends on
11 (OKX = supported), 12. Skip if unsupported.

## Read first
`docs/import-formats/okx.md`, `docs/import-spec.md` §5 (contract quantities), `docs/financial-semantics.md` §1.

## Scope
1. `src/domain/import/adapters/okx.ts`, the same structure as steps 13/14. Instrument ids `BTC-USDT-SWAP` → perp BTC/USDT. `-USD-SWAP` (coin-margined) → `unsupported_instrument`. Dated futures → unsupported.
2. Quantity units: follow the format doc's decision:
   - (a) a base-unit column exists → use it;
   - (b) contracts only → `src/domain/import/adapters/okxContractSizes.ts` with `{ instId, ctVal, ctValCcy, verifiedOn, sourceUrl }` entries **only for the instruments verified** in step 11 (from OKX public instrument docs, retrieved manually; no runtime network). Unknown instId → `unsupported_instrument` with the message "OKX reports this market in contracts; Ledgerline can't convert it yet."
   - (c) neither works → the adapter isn't shipped, and step 11 should already have said so.
3. PnL semantics and partial-close handling per the format doc (see the step 14 rules for closed-position exports).
4. Register the adapter.

## Tests
Real fixture totals exact; a contract-size conversion test (e.g. 3 contracts × ctVal 0.01 = 0.03 BTC, if verified); an unknown instId → error; coin-margined → error.

## Acceptance criteria / Gates
Same as step 13. Gate A.

## Review checklist
- [ ] Every `okxContractSizes` entry has a source and a date.
- [ ] Contract counts never flow into `quantity` unconverted.
