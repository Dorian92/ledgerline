# Third-party public wallet fills — import schema (v1 draft)

**Status:** `public.hyperliquid.fills.v1` **verified** against
`fixtures/csv/real-anonymized/hyperliquid/public.hyperliquid.fills.v1__stuxfred-candidate.csv` (+ `.meta.json`).
Adapter is registered; import mode is **public-fill-ledger** (no synthetic trades). Device steps:
`docs/import-formats/hyperliquid-public-device-steps.md`.

## Purpose

Users may journal **observed** fills from a **public on-chain or API-visible wallet** that is **not
their own** (research, benchmarking). Ledgerline must:

- Import only **facts present in the file** (price, size, fees, timestamps, optional exchange-reported closed PnL).
- **Never** invent stops, leverage, R, funding, or entry/exit on `closed-positions` rows with synthetic `openedAt`.
- Label data as **third-party public** in the journal (not the user’s wallet).
- Stay **offline**: retrieval happens outside the app (browser, script); the app only receives a CSV via file picker.

## Supported pipeline path (today)

| Source shape                                    | Adapter `kind`     | Faithful for…                                                                             | Avoid for…                                       |
| ----------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Fill ledger (one row per execution)             | `fills`            | Price, size, time, fees; **closed trades** via `positions.ts` (§4 financial-semantics)    | Transfers, funding, margin interest, open-only   |
| Pre-aggregated closed round-trips w/ entry/exit | `closed-positions` | Each row is an explicit closed trade **only if** file includes real `OpenedAt`/`ClosedAt` | Raw fill dumps (do **not** use `test.closed.v1`) |

**Do not use** `test.closed.v1` or the in-app synthetic sample for real data — it sets `openedAt = closedAt − 1h`.

### Fields the app does **not** require (stay unavailable)

- Stop → R stays **unavailable** (`no_stop`) unless the user adds a stop manually after import.
- Funding → `funding_status = 'unknown'` (perp) unless the file includes funding per trade (not in v1 schema).
- Leverage → stored as null / not shown; never inferred from wallet equity.
- FX / quote conversion → account quote must match row quote (`quote_mismatch` otherwise).

### Fidelity gaps (code as of pass 3)

| Source fact             | Stored today?                                                                                                                | Notes                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Fill price, size, fee   | Yes (`fills` → `trades_fills`)                                                                                               | Quote fee only; non-quote fee → `fees_complete = 0` + warning                           |
| Per-fill `ClosedPnl`    | **Partial** — `FillInput.reportedRealizedPnl` exists; wired for `public.fills.v1` template + optional column in test adapter | Trade-level `pnl_source = 'exchange'` when all closing fills report PnL and sum is used |
| Entry / exit on trade   | **Derived** from fill sequence (linear avg-cost)                                                                             | Matches §3.1 when no exchange gross; may differ from UI if HL rounds differently        |
| Third-party attribution | Yes — `ImportPlan.attribution` → trade `notes` prefix                                                                        | Shown on import preview                                                                 |

## Minimal exact CSV schema — `public.fills.v1`

**`format_id`:** `public.fills.v1` (generic) or `public.hyperliquid.fills.v1` (after HL-specific fixture evidence).

**Adapter kind:** `fills`  
**`exchange` (batch metadata):** `public`  
**Timestamp policy:** UTC (`ExecutedAt` ISO-8601 with `Z`, or epoch ms in a single column — adapter must declare pattern in evidence doc).

### Required columns (exact header names)

| Header       | Meaning                                        | Example (PLACEHOLDER)   |
| ------------ | ---------------------------------------------- | ----------------------- |
| `ExecutedAt` | Fill time UTC                                  | `PLACEHOLDER_ISO8601`   |
| `Symbol`     | Journal symbol, suffix `-PERP` for linear perp | `PLACEHOLDER_COIN-PERP` |
| `Side`       | `buy` or `sell` (taker/maker direction)        | `buy`                   |
| `Price`      | Quote per 1 base unit                          | `PLACEHOLDER_PRICE`     |
| `Size`       | Base quantity (> 0)                            | `PLACEHOLDER_SIZE`      |
| `FillId`     | Stable id from source (hash/tid) for dedup     | `PLACEHOLDER_FILL_ID`   |

### Optional columns

| Header      | Meaning                                                            |
| ----------- | ------------------------------------------------------------------ |
| `Fee`       | Fee in **account quote** (positive = cost)                         |
| `FeeAsset`  | If not account quote → row warning `fee_non_quote_asset`           |
| `ClosedPnl` | Exchange-reported realized PnL on this fill (quote); omit on opens |

### Identity / fingerprint

`FillId` is used for dedup (`fingerprintRow(formatId, fillId)`). Never omit.

### Sample file (PLACEHOLDER values only — not real data)

```csv
ExecutedAt,Symbol,Side,Price,Size,Fee,ClosedPnl,FillId
PLACEHOLDER_ISO8601,PLACEHOLDER_COIN-PERP,buy,PLACEHOLDER_PRICE,PLACEHOLDER_SIZE,PLACEHOLDER_FEE,,PLACEHOLDER_FILL_ID_OPEN
PLACEHOLDER_ISO8601,PLACEHOLDER_COIN-PERP,sell,PLACEHOLDER_PRICE,PLACEHOLDER_SIZE,PLACEHOLDER_FEE,PLACEHOLDER_CLOSED_PNL,PLACEHOLDER_FILL_ID_CLOSE
```

Replace placeholders after you export from the verified source (e.g. Hyperliquid `userFills` / public wallet APIs — **confirm column names against a real sample** before enabling `public.hyperliquid.fills.v1`).

## Hyperliquid (candidate — unverified)

Public discussions often reference fills with **price**, **size**, **fee**, **closedPnl**, and time fields. **Do not ship** `public.hyperliquid.fills.v1` until:

1. A real-anonymized CSV is in `fixtures/csv/real-anonymized/hyperliquid/`.
2. A sidecar `.meta.json` records retrieval URL and date (`import-spec` §6).
3. Spot-check: sum of `ClosedPnl` on closing legs vs computed linear gross within §3.1 tolerance.

## Workflow (real mode)

1. User has a **journal account** (not demo); import is blocked in demo (`useRealModeOnly`).
2. **Choose CSV file** (document picker) — no network in app.
3. Preview shows format label + **third-party public** banner when `attribution` is set.
4. Commit writes trades with `source = 'import'`, `notes` prefix with attribution (wallet + source description).
5. Undo import removes batch only (existing real data preserved).

## Out of scope (v1)

- Wallet connect, API keys, automatic sync.
- Relabeling synthetic/demo rows as real.
- Building trades from deposits/transfers only.
- Claiming Binance/Bybit/OKX support without fixtures.

## Open questions (append to `financial-semantics.md` when answered)

- HL: hedge vs one-way — `positionSide` column required?
- HL: symbol mapping `BTC` → `BTC-PERP` vs `BTC-USD` — evidence from export only.
- Partial exports: `opened_before_export` handling vs user expectation.
