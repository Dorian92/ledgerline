# 13 — Binance adapter

## Goal
Implement the Binance futures CSV adapter **exactly as documented** in `docs/import-formats/binance.md` (step 11), validated against the real anonymized fixture.

## Depends on
11 (Binance decision = supported), 12. **If step 11 marked Binance unsupported, skip this step:** tick it as "skipped (unsupported)" in the roadmap with a link to the decision.

## Read first
`docs/import-formats/binance.md` (normative for columns), `docs/import-spec.md` §3–§5, `docs/financial-semantics.md` §4.

## Scope
1. `src/domain/import/adapters/binance.ts` implementing `ImportAdapter`:
   - `formatId` and `label` from the format doc (e.g. `binance.futures.trade-history.v1`).
   - `headerSignature.required` = the verbatim header columns the adapter depends on; `optional` = the others.
   - `timestampPolicy` per the doc (e.g. fixed UTC if the header says `(UTC)`, otherwise `ask`).
   - `normalize`: map symbol (`parseSymbol`), side, price, qty (strip unit suffixes per the doc), fee + fee asset, realized PnL (as `reportedRealizedPnl`),
     time, exchange trade id; position side (hedge `LONG/SHORT`, one-way `BOTH`) if present, otherwise one-way.
   - Identity columns for the fingerprint, per the doc (prefer the trade ID if present).
   - Instruments outside scope (COIN-M symbols like `BTCUSD_PERP`, delivery contracts with a date suffix) → `unsupported_instrument`.
2. Register it in `adapters/index.ts`.
3. Cross-check: when every fill of a trade has a reported realized PnL, compare the Σ reported with the computed gross → a `pnl_mismatch` warning above the tolerance.

## Out of scope
Spot export (unless the doc says it's the same file), funding/transaction history files, other exchanges.

## Tests
- The real fixture(s): detection selects this adapter; summary counts and Σ net (or Σ gross where fees are incomplete) equal `meta.json` `expected` **exactly**; `pnl_mismatch` count is 0, or as documented.
- Synthetic edge cases generated from the verified header (step 11 generator): BNB fee → `fees_complete=0` warning; flip; hedge mode; unit suffix stripping; COIN-M row → error; a bad number → error.
- Header with an extra unknown column → still detected. Header missing a required column → `unknown_format` with `closest`.

## Acceptance criteria
Real-fixture totals match; every quirk listed in the format doc has a test.

## Gates
A.

## Review checklist
- [ ] Column names are copied verbatim from the format doc, not from memory.
- [ ] Nothing is guessed: unknown values → error rows.
