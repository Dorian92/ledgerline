# Ledgerline — CSV import specification (v1)

CSV import is the **primary** way to get real data into Ledgerline. Manual entry is secondary.

## 1. Honest support policy

- An exchange format is **"supported"** only when its adapter is tested against at least one
  **real, anonymized export** committed under `fixtures/csv/real-anonymized/<exchange>/`, or against an
  official example published by the exchange (link and retrieval date recorded). The format document
  `docs/import-formats/<exchange>.md` records the evidence.
- Synthetic fixtures (`fixtures/csv/synthetic/`, files named `SYNTHETIC_*.csv`, with a first line comment
  in the fixture README) are for edge cases only. **They never count as evidence** that we support a format.
- If no evidence exists for an exchange by the end of step 11, its tile in the import UI shows
  "Not supported yet. Send us a sample?" (a mailto link to the developer, which is optional and offline-safe)
  and its adapter isn't built. Shipping two exchanges, or one, is an acceptable v1 outcome.
- Export formats change. Every adapter declares `formatId` with a version, plus a **header signature**.
  Unknown headers are rejected ("We don't recognize this file"). We never guess column meanings.

## 2. v1 scope

In scope:
- Binance, Bybit and OKX **USDT-/USDC-margined perpetual futures** history exports (one export type per
  exchange, chosen in step 11), and **spot** only if it falls out of the same export for free.
- One account per import. The user chooses the target account, or creates one, before preview. The account
  quote currency must match the rows; rows with another quote currency are errors (`quote_mismatch`).
- Files up to **10 MB / 50,000 data rows**. Larger files are rejected with guidance to split by date range.
- Encodings: UTF-8 (with or without BOM). UTF-16LE is detected and decoded if step 11 finds an exchange
  that emits it. Otherwise it's rejected.
- Delimiters: `,` and `;` (papaparse auto-detection, checked against the header signature).
- XLSX: **not supported** in v1. If an exchange only exports XLSX, the user is told to "Save as CSV",
  and only if that conversion is verified to keep the columns. Otherwise the exchange is marked unsupported.

Out of scope for v1: coin-margined/inverse, options, copy-trading sub-accounts, transfers and deposits,
spot-margin interest, merging multiple files at once, editing rows inside the preview, API sync.

## 3. Pipeline (pure, in `src/domain/import`)

```
bytes ─▶ decode ─▶ parse (papaparse, header:false) ─▶ detect(adapter by header signature)
      ─▶ adapter.normalize(rows, {tz}) ─▶ RowResult[] (fill | closedPosition | error)
      ─▶ validate (common rules) ─▶ fingerprint ─▶ dedupe (in-file + vs DB set)
      ─▶ build trades (positions.ts for fills, direct for closed positions)
      ─▶ ImportPlan { summary, rows[], trades[], warnings[] }
```

Then commit (in `src/data/repositories/imports.ts`, step 16) applies an `ImportPlan` atomically.

### Adapter interface

```ts
interface ImportAdapter {
  formatId: string;                     // 'binance.futures.trade-history.v1'
  exchange: 'binance' | 'bybit' | 'okx';
  kind: 'fills' | 'closed-positions';
  label: string;                        // 'Binance Futures — Trade History'
  headerSignature: { required: string[]; optional?: string[] };   // exact header names after trim/BOM strip
  timestampPolicy: { kind: 'fixed'; tz: 'UTC' } | { kind: 'ask'; defaultTz: 'UTC' };
  normalize(row: Record<string,string>, ctx: NormalizeCtx): NormalizedRow;  // never throws; returns error rows
}
type NormalizedRow =
  | { kind: 'fill'; sourceIndex: number; symbol: SymbolInfo; side: 'buy'|'sell'; positionSide: 'long'|'short'|'both';
      price: Dec; quantity: Dec; fee: Dec; feeAsset: string; realizedPnl?: Dec; executedAt: number; exchangeTradeId?: string; raw: string[] }
  | { kind: 'closed'; sourceIndex: number; symbol: SymbolInfo; direction: 'long'|'short'; entry: Dec; exit: Dec; quantity: Dec;
      grossPnl?: Dec; fees?: Dec; funding?: Dec; openedAt: number; closedAt: number; exchangeId?: string; raw: string[] }
  | { kind: 'error'; sourceIndex: number; code: RowErrorCode; message: string; raw: string[] };
```

## 4. Row statuses, counts and fingerprints

Each data row ends in exactly one status:

| Status | Meaning | Imported? |
|---|---|---|
| `valid` | Clean | yes |
| `warning` | Importable with a caveat: `fee_non_quote_asset`, `pnl_mismatch`, `funding_unknown`, `still_open` (not imported; see below) | yes, except `still_open` |
| `duplicate` | Same fingerprint already in the DB, or earlier in the same file | no |
| `error` | Not importable: `missing_field`, `bad_number`, `bad_timestamp`, `quote_mismatch`, `unsupported_instrument`, `opened_before_export`, `residual_quantity`, `inconsistent_hedge_fill` | no |

The **summary invariant** (tested): `total = valid + warning + duplicate + error`. The import button reads
"Import **M** trades from **N** rows", where `N = valid + importable warnings` and `M` = the number of trades built.
For fill exports, M < N. The mockup's "312 valid / 9 duplicates / 4 warnings of 316 rows → Import 303"
is internally inconsistent; our UI must always satisfy the invariant.

**Fingerprint** = `sha256( formatId + '\u001f' + (exchangeTradeId ?? canonicalRow) )`, where
`canonicalRow` = the raw cells of the adapter's identity columns (declared per adapter) after trimming, joined by `\u001f`.
Raw timestamp strings are used, *not* parsed instants, so re-importing with a different time-zone choice
still dedupes. Fingerprints are stored per account, and only for rows that were actually imported.

**Idempotency** (tested): importing the same file twice yields 0 new trades the second time.
Importing an overlapping later export imports only the new rows. Positions that were `still_open` in
the first file are imported once they're closed in the second.

## 5. Normalization rules (all adapters)

- **Numbers:** strip surrounding whitespace and known unit suffixes declared by the adapter (e.g. `"0.15 BTC"`
  → `0.15`, unit checked against the symbol). Thousands separators are rejected unless the adapter declares
  them. Scientific notation is accepted (`1E-8`). Parse with `Money.parse` only.
- **Timestamps:** parse with the adapter's declared pattern in the source tz, then convert to epoch ms UTC.
  If the format has no tz marker, the preview shows a **"Times in this file are: UTC ▾"** selector
  (UTC default, device tz, or a common list). The choice is stored in `import_batches.source_tz`.
- **Symbols:** `BTCUSDT` → base `BTC`, quote `USDT`, display `BTC-PERP` (perp) or `BTC/USDT` (spot). Quote
  detection only matches the suffixes `USDT`, `USDC`, `USD`. Anything else is `unsupported_instrument`.
  OKX `BTC-USDT-SWAP` → base `BTC`, quote `USDT`, perp.
- **Contract quantities:** if an export gives size in **contracts** (likely OKX swaps), the base quantity needs
  the contract value. v1 options, decided in step 11: (a) use an exchange-reported base-unit column if present;
  (b) use a bundled, dated `contractSizes.ts` table **only** for symbols verified against the exchange
  documentation, with other symbols as `unsupported_instrument`; (c) if neither is possible, use
  `pnl_source='exchange'` with exchange-reported PnL, and quantity left as contracts is **not allowed**,
  so the row is an error. We never guess.
- **Fees:** sign normalized to positive = cost. Fees in the quote asset are summed. Fees in other assets
  (e.g. BNB) are recorded on the fill (`fee_asset`), excluded from quote fees, and the trade gets `fees_complete=0` and a row warning.
- **Funding:** usually in separate exports. v1 does **not** import funding files. Imported perp trades get
  `funding_status='unknown'`, unless the chosen export includes funding per position, in which case it's `included`.
- **Direction:** from the position-side column (hedge mode) or derived from the fill sequence (one-way mode, §4 of financial-semantics).

## 6. Fixtures and anonymization

- `fixtures/csv/real-anonymized/<exchange>/<formatId>__<n>.csv`, produced from Dorian's own exports by
  `scripts/anonymize-csv.ts` (step 11). It replaces order/trade IDs with stable fake IDs, and may shift all
  timestamps by a constant and scale quantities by a constant factor, applied consistently, so PnL relationships hold.
  Column headers, number formats, time formats, ordering and quirks are kept **byte-exact**.
- Each real fixture has a sidecar `<file>.meta.json`: `{ exchange, exportPath (menu path in the exchange UI), exportedOn, anonymization, expected: { rows, trades, netPnlSum } }`.
  `expected` comes from the exchange's own UI totals where possible.
- Synthetic fixtures cover: flips, partial closes, hedge mode, orphan reduce, still open, BNB fees, a `;`
  delimiter, BOM, a bad number, a missing price, in-file duplicates, quote mismatch, and 50k rows (generated at test time, not committed).

## 7. Per-exchange status (update in step 11)

| Exchange | Candidate export | Kind | Evidence | Status |
|---|---|---|---|---|
| Binance | USDⓈ-M Futures → Trade History export (has a realized-profit column per fill, per public UI) | fills | none yet | **unverified** |
| Bybit | Derivatives → Closed P&L export (or Trade History) | closed-positions? | none yet | **unverified** |
| OKX | Trading history / Position history export | closed-positions? fills? | none yet | **unverified** |

The candidates above come from general knowledge of the exchange UIs and **haven't been verified**.
Step 11 replaces this table with evidence-backed entries.
