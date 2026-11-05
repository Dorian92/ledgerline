# 12 — Import core pipeline

## Goal
Build the exchange-agnostic pure pipeline from bytes to an `ImportPlan`: decode, parse, detect, normalize via adapters, validate,
fingerprint, dedupe and build trades, with honest counts, chunked so the UI stays responsive.

## Depends on
04 (03). It doesn't need step 11: test with a **test-only adapter** over synthetic data (`formatId: 'test.fills.v1'`).

## Read first
`docs/import-spec.md` §3–§5 (normative), `docs/financial-semantics.md` §4.

## Scope
1. `npm i papaparse @noble/hashes` and `npm i -D @types/papaparse`.
2. `src/domain/import/decode.ts`: `decodeCsvBytes(bytes: Uint8Array): { text: string; encoding: 'utf-8'|'utf-8-bom'|'utf-16le' } | { error: 'unsupported_encoding' }` (BOM sniffing, `TextDecoder` with a fallback check for Hermes support; if `TextDecoder` is missing on Hermes, read the file as UTF-8 text via expo-file-system in the platform layer and pass the text in instead, and support both entry points).
3. `parse.ts`: `parseCsv(text): { header: string[]; rows: string[][]; delimiter }`, using papaparse `header:false, skipEmptyLines:'greedy'`. Header cells are trimmed and BOM-stripped.
   Limits: > 50,000 data rows → `too_many_rows`; text length > 10 MB → `too_large`.
4. `detect.ts`: `detectAdapter(header, adapters): { adapter } | { error: 'unknown_format'; closest?: { formatId; missing: string[] } }`. A match requires all `required` headers. Ties → the adapter with more matched optional headers. Ambiguity → error.
5. `types.ts`: the `ImportAdapter`, `NormalizedRow`, `RowStatus`, `RowErrorCode`, `RowWarningCode` and `ImportPlan` types:
   ```ts
   interface ImportPlan {
     formatId: string; exchange: string; label: string; sourceTz: string; fileSha256: string;
     summary: { total: number; valid: number; warning: number; duplicate: number; error: number; importableRows: number; tradesToCreate: number };
     rows: Array<{ index: number; status: RowStatus; codes: string[]; display: PreviewCells }>;   // PreviewCells: time, symbol, side, qty, price (strings)
     trades: Array<{ input: Omit<TradeInput,'accountId'|'tagIds'|'notes'|'emotion'>; fills: FillInput[]; fingerprints: string[] }>;
     messages: Array<{ level: 'warning'|'error'; text: string; rowIndexes: number[] }>;   // grouped, human-readable
   }
   ```
6. `fingerprint.ts`: per import-spec §4, `sha256` hex from `@noble/hashes/sha256` + `utils.bytesToHex`.
7. `plan.ts`: `async buildImportPlan({ text, adapters, account: { quoteCurrency }, existingFingerprints: Set<string>, sourceTz, onProgress? }): Promise<ImportPlan | ImportFailure>`
   - Normalizes rows in chunks of 500 with `await yieldToEventLoop()` between chunks (an injected function; tests use a resolved promise).
   - Common validation: quote mismatch, required fields, positive price/qty, timestamp parse.
   - Dedupe: in-file duplicates (the second occurrence is `duplicate`), then against `existingFingerprints`.
   - Fills → `buildPositionsFromFills` (one-way or hedge, as the adapter declares per row) → trades; maps position errors back to rows (`opened_before_export`, …) and `still_open` warnings.
   - Closed-position rows → one trade each (`pnlSource='exchange'` when gross PnL is given; `pnl_mismatch` check).
   - Status precedence per row: error > duplicate > warning > valid.
   - The summary invariant is asserted at the end (throws an internal error if violated, so bugs surface).
   - `messages`: grouped like the mockup: "Row 4 matches an existing trade, so it'll be skipped", "Row 6 has no fill price and will be skipped …", with up to 3 row numbers then "and N more". Row numbers are **1-based data-row indexes** (the first row after the header is row 1), the same numbers the preview table shows.
8. `src/domain/import/adapters/index.ts`: a registry (empty array plus the test adapter only under `__tests__`).
9. Synthetic fixtures for the test adapter in `src/domain/import/__tests__/fixtures/SYNTHETIC_test_*.csv` covering import-spec §6 edge cases, plus a generated 50k file at test time.

## Out of scope
Real exchange adapters (13–15), DB commit (16), UI (17).

## Tests
- Decode: BOM, UTF-16LE sample, invalid bytes.
- Parse: `;` delimiter, quoted commas, CRLF, trailing empty lines, header-only file → 0 rows.
- Detect: exact, missing column → `closest` reported, ambiguous.
- Plan: each status path; precedence; in-file duplicates; existing fingerprints; still-open → not in trades and its fingerprints are **not** in `trades[].fingerprints`; orphan reduce; quote mismatch.
- Property: the summary invariant for random mixes; `tradesToCreate === trades.length`; every importable row index belongs to exactly one trade's fingerprints.
- Idempotency (pure): plan A → collect fingerprints → plan the same text with them → `tradesToCreate === 0`, all rows duplicate or error/still_open.
- Overlap: file 2 = file 1's tail + new rows → only new trades.
- Timezone: the same file with `sourceTz` UTC vs `Asia/Kolkata` → instants differ by 5:30, fingerprints identical.
- Performance: 50k rows plan < 8 s in Node (loose), with progress called ≥ 100 times.

## Acceptance criteria
All tests green, coverage ≥ 90% for `src/domain/import`; no adapter-specific logic in core files.

## Gates
A.

## Review checklist
- [ ] No floats; numbers via `parseCsvDecimal`.
- [ ] Error rows never throw; one bad row never aborts the file.
- [ ] Messages are honest and actionable.
