# 11 — Import format research and evidence

## Goal
Establish **evidence-backed** CSV format specifications for Binance, Bybit and OKX futures history, plus anonymized real fixtures,
before writing any adapter. Exchanges without evidence are explicitly marked unsupported in v1.

## Depends on / user actions
01 (TS tooling for the script). **U-04** (Dorian exports his own CSVs) and **U-05** (he reviews the anonymized output).
Without U-04, do steps 1–3 and 6 (script, templates, docs from official sources), and leave real-evidence rows "pending".
Steps 13–15 stay blocked for any exchange without evidence.

## Read first
`docs/import-spec.md` (all), `docs/financial-semantics.md` §4.

## Scope
1. `scripts/anonymize-csv.ts` (run with `npx tsx`; add `tsx` as a dev dependency):
   `npx tsx scripts/anonymize-csv.ts --in fixtures/csv/raw/x.csv --out fixtures/csv/real-anonymized/binance/<formatId>__1.csv --exchange binance --id-cols "Order No,Trade ID" --uid-cols "UID" --time-shift-days 0 --qty-scale 1`
   - Reads bytes, keeps the BOM, delimiter, quoting, line endings and header byte-exact.
   - Replaces the ID columns with stable fake IDs (`A000001`…, mapping consistent within the file), blanks UID/email-like columns,
     optionally shifts timestamps by whole days (preserving the original string format) and scales quantity/fee/PnL columns by a factor
     (preserving decimal places). Prices stay unchanged.
   - Writes the `.meta.json` sidecar skeleton (import-spec §6).
   - Refuses to write into `fixtures/csv/real-anonymized` if any cell matches an email regex or a ≥ 9-digit number in a non-whitelisted column (privacy guard).
   - Unit tests for the script's pure functions (`src/../scripts/__tests__` or `scripts/lib/*.test.ts`) on a SYNTHETIC input.
2. `fixtures/csv/raw/` is gitignored (already in 01). Document in `fixtures/README.md`: how to export (per exchange, the menu path filled in from step 5), how to anonymize, what never to commit.
3. Template `docs/import-formats/_template.md`: export menu path, export type name, date-range limits, file type/encoding/delimiter/BOM, a header row (verbatim),
   per-column semantics (unit, sign convention, time zone, number format, examples), row granularity (fill vs closed position vs per partial close),
   position-side/hedge representation, fee asset behavior, funding presence, contract vs base units, known quirks, evidence list (fixture files, official doc URL + retrieval date), and the **decision**: supported kind/formatId or unsupported + reason.
4. With U-04 done, for each exchange:
   - Anonymize ≥ 1 real export (ideally one with partial closes, a flip, long+short, and a non-quote fee if applicable).
   - Fill in `docs/import-formats/<exchange>.md` from the actual file, not from memory.
   - Record `expected` totals in the meta sidecar from the exchange UI (e.g. the realized PnL sum for the date range) or a hand calculation, and say which.
   - Answer financial-semantics Q-01 for Bybit/OKX.
5. Official documentation cross-check (web): search the exchange help center for the export description and record the URLs and retrieval dates.
   Treat help-center text as secondary evidence. Column names must come from a real file or an official sample file.
6. Update `docs/import-spec.md` §7 with the final table, and `docs/decisions.md` with D-0xx per exchange (supported formatId / unsupported).
7. Synthetic fixture generator `scripts/gen-synthetic-csv.ts` that writes `fixtures/csv/synthetic/<exchange>/SYNTHETIC_*.csv` **mirroring the verified header**
   for the edge cases listed in import-spec §6. If an exchange is unverified, no synthetic file for it is generated (otherwise the synthetic file would be mistaken for its format).

## Out of scope
Adapter code (13–15), the generic pipeline (12), XLSX handling, API docs research for sync.

## Tests
Anonymizer: ID mapping stable; header unchanged byte-for-byte; quantity scaling keeps decimal places; the privacy guard trips on an email.

## Acceptance criteria
- For each of Binance, Bybit and OKX: `docs/import-formats/<exchange>.md` exists with a **decision**. "Supported" requires a real anonymized fixture + meta (or an official sample file). "Unsupported in v1" carries a reason.
- No raw exports in git (`git log --stat` reviewed).
- import-spec §7 updated.

## Gates
A.

## Review checklist
- [ ] Every column claim in a format doc is traceable to a fixture or an official sample file.
- [ ] Fixture metadata explains where `expected` values came from.
- [ ] Dorian confirmed (U-05) in the progress log.

## Risks / notes
- Exchanges may only offer XLSX, or email the export asynchronously, or limit date ranges (e.g. 3–6 months per export). Document these limits, because they affect the "opened before export" UX.
- Binance fees in BNB are common, so expect `fees_complete=0` cases.
- OKX swap sizes in contracts are the main precision risk (import-spec §5).
