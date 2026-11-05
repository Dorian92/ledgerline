# Ledgerline — Data model (SQLite schema v1)

Applies to both `ledgerline.db` (real) and `ledgerline-demo.db` (demo). The `app_prefs` table is only
_used_ in the real DB but is created in both, to keep a single migration set.

## Conventions

- IDs are `TEXT` UUID v4.
- Timestamps are `INTEGER` **Unix epoch milliseconds, UTC**. Nothing stores local time. Local day and hour
  are derived at read time using the display time zone (`docs/financial-semantics.md` §7).
- Money, prices and quantities are `TEXT` **canonical decimal strings**: no exponent, no thousands
  separators, `.` as the decimal point, no trailing zeros beyond one fractional zero, `-` for negatives.
  For example `"68412.5"`, `"0.15"`, `"-138.5"`, `"0"`. They are produced only by `Money.toCanonical()` (step 03).
- Booleans are `INTEGER` 0/1.
- Enums are `TEXT` with `CHECK` constraints.
- `PRAGMA foreign_keys = ON` and `PRAGMA journal_mode = WAL` are set at open.
- Migrations: `src/data/db/migrations/NNNN_name.ts` exporting `{ version: number, up: string[] }`. The
  runner compares against `PRAGMA user_version` and applies each pending migration **inside a
  transaction**. Migrations are append-only. A released migration is never edited (step 05).

## Tables (migration 0001_init)

```sql
CREATE TABLE app_prefs (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,              -- JSON-encoded
  updated_at INTEGER NOT NULL
);
-- keys: mode ('unset'|'demo'|'real'), active_account_id, display_tz ('device'|'UTC'),
--       hide_amounts (bool), app_lock (bool), block_screenshots (bool),
--       reminder ({enabled,hour,minute}), tilt_thresholds (object), onboarding_completed_at,
--       entitlement_cache ({pro:boolean, source, checked_at}), dismissed_tilt_day ('YYYY-MM-DD')

CREATE TABLE accounts (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 40),
  exchange         TEXT CHECK (exchange IN ('binance','bybit','okx','other')),   -- nullable = manual
  quote_currency   TEXT NOT NULL CHECK (quote_currency IN ('USDT','USDC','USD')),
  starting_balance TEXT,                  -- nullable; quote units; > 0 when present
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL,
  archived_at      INTEGER
);

CREATE TABLE trades (
  id               TEXT PRIMARY KEY,
  account_id       TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  symbol           TEXT NOT NULL,         -- display symbol, e.g. 'BTC-PERP', 'ETH/USDT'
  base_asset       TEXT NOT NULL,         -- 'BTC'
  quote_asset      TEXT NOT NULL,         -- must equal account.quote_currency in v1
  instrument       TEXT NOT NULL CHECK (instrument IN ('perp','spot')),
  direction        TEXT NOT NULL CHECK (direction IN ('long','short')),
  status           TEXT NOT NULL CHECK (status IN ('open','closed')),
  opened_at        INTEGER NOT NULL,
  closed_at        INTEGER,               -- NOT NULL iff status='closed'
  entry_price      TEXT NOT NULL,         -- average entry, quote per 1 base
  exit_price       TEXT,                  -- average exit; NOT NULL iff closed
  quantity         TEXT NOT NULL,         -- base units, > 0; for closed trades = closed qty
  max_quantity     TEXT NOT NULL,         -- peak open base qty (== quantity for manual trades)
  stop_price       TEXT,                  -- initial stop; nullable
  leverage         TEXT,                  -- informational only, never used in PnL
  fees             TEXT NOT NULL DEFAULT '0',   -- quote units, positive = cost, negative = rebate
  fees_complete    INTEGER NOT NULL DEFAULT 1,  -- 0 when some fee was in a non-quote asset (e.g. BNB)
  funding          TEXT NOT NULL DEFAULT '0',   -- quote units, signed: positive = received
  funding_status   TEXT NOT NULL DEFAULT 'none' CHECK (funding_status IN ('included','none','unknown')),
  pnl_source       TEXT NOT NULL CHECK (pnl_source IN ('computed','exchange')),
  gross_pnl        TEXT,                  -- cached, closed only
  net_pnl          TEXT,                  -- cached, closed only
  risk_amount      TEXT,                  -- cached; null when R unavailable
  r_multiple       TEXT,                  -- cached; null when R unavailable
  r_unavailable_reason TEXT,              -- 'no_stop'|'stop_wrong_side'|'zero_risk'|'open'|null
  emotion          TEXT CHECK (emotion IN ('calm','fomo','revenge','fear')),
  notes            TEXT NOT NULL DEFAULT '' CHECK (length(notes) <= 4000),
  source           TEXT NOT NULL CHECK (source IN ('manual','import','demo')),
  import_batch_id  TEXT REFERENCES import_batches(id) ON DELETE SET NULL,
  calc_version     INTEGER NOT NULL,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL,
  CHECK ((status = 'closed') = (closed_at IS NOT NULL AND exit_price IS NOT NULL))
);
CREATE INDEX trades_account_closed ON trades(account_id, status, closed_at);
CREATE INDEX trades_account_opened ON trades(account_id, opened_at);
CREATE INDEX trades_batch ON trades(import_batch_id);

CREATE TABLE fills (                       -- only for imported fill-based trades
  id               TEXT PRIMARY KEY,
  trade_id         TEXT NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  side             TEXT NOT NULL CHECK (side IN ('buy','sell')),
  price            TEXT NOT NULL,
  quantity         TEXT NOT NULL,         -- base units
  fee              TEXT NOT NULL,         -- in fee_asset units
  fee_asset        TEXT NOT NULL,
  reported_realized_pnl TEXT,             -- as reported by exchange, nullable
  executed_at      INTEGER NOT NULL,
  exchange_trade_id TEXT
);
CREATE INDEX fills_trade ON fills(trade_id);

CREATE TABLE tags (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 24),
  created_at INTEGER NOT NULL,
  archived_at INTEGER
);
CREATE UNIQUE INDEX tags_name ON tags(name COLLATE NOCASE);
-- seeded (real + demo): Breakout, HTF trend, Range fade, News

CREATE TABLE trade_tags (
  trade_id TEXT NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  tag_id   TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (trade_id, tag_id)
);

CREATE TABLE import_batches (
  id                 TEXT PRIMARY KEY,
  account_id         TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  exchange           TEXT NOT NULL,
  format_id          TEXT NOT NULL,       -- e.g. 'binance.futures.trade-history.v1'
  file_name          TEXT NOT NULL,
  file_sha256        TEXT NOT NULL,
  source_tz          TEXT NOT NULL,       -- IANA tz used to interpret timestamps, e.g. 'UTC'
  total_rows         INTEGER NOT NULL,
  imported_rows      INTEGER NOT NULL,
  duplicate_rows     INTEGER NOT NULL,
  error_rows         INTEGER NOT NULL,
  trades_created     INTEGER NOT NULL,
  created_at         INTEGER NOT NULL,
  undone_at          INTEGER
);

CREATE TABLE import_fingerprints (
  account_id   TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  fingerprint  TEXT NOT NULL,             -- sha256 hex, see import-spec §4
  batch_id     TEXT NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  PRIMARY KEY (account_id, fingerprint)
);
```

### Notes

- `trades.source = 'demo'` only appears in the demo DB. A test asserts that the real DB never contains it.
- Hard delete everywhere (no soft-delete). Undoing an import deletes its trades (`trades.import_batch_id = ?`)
  and its fingerprints (cascade via `batch_id`), and sets `undone_at`. The batch row is kept for history.
- Deleting an account cascades to its trades, fills, batches and fingerprints.
- Tag rename/archive is supported. Deleting a tag removes its `trade_tags` rows.
- There are no `deposits/withdrawals` tables in v1, so percent metrics are approximate (`financial-semantics.md` §6).

## Domain types (TypeScript, `src/domain/trade/types.ts`)

```ts
type Decimal = import('../money').Dec; // wrapper, never a JS number
type Direction = 'long' | 'short';
type Emotion = 'calm' | 'fomo' | 'revenge' | 'fear';
type QuoteCurrency = 'USDT' | 'USDC' | 'USD';

interface TradeInput {
  // what the form / importer provides
  accountId: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: QuoteCurrency;
  instrument: 'perp' | 'spot';
  direction: Direction;
  openedAt: number;
  closedAt: number | null;
  entryPrice: Decimal;
  exitPrice: Decimal | null;
  quantity: Decimal;
  maxQuantity?: Decimal;
  stopPrice: Decimal | null;
  leverage: Decimal | null;
  fees: Decimal;
  feesComplete: boolean;
  funding: Decimal;
  fundingStatus: 'included' | 'none' | 'unknown';
  pnlSource: 'computed' | 'exchange';
  reportedGrossPnl?: Decimal; // only when pnlSource='exchange'
  emotion: Emotion | null;
  tagIds: string[];
  notes: string;
}
interface TradeDerived {
  // output of computeTrade(), cached in DB
  grossPnl: Decimal | null;
  netPnl: Decimal | null;
  riskAmount: Decimal | null;
  rMultiple: Decimal | null;
  rUnavailableReason: 'no_stop' | 'stop_wrong_side' | 'zero_risk' | 'open' | null;
  calcVersion: number;
}
interface TradeRow extends TradeInput, TradeDerived {
  id: string;
  status: 'open' | 'closed';
  source: 'manual' | 'import' | 'demo';
  importBatchId: string | null;
  createdAt: number;
  updatedAt: number;
}
```

## Backup file format (`ledgerline-backup-YYYYMMDD-HHmm.json`)

```json
{
  "format": "ledgerline-backup",
  "formatVersion": 1,
  "schemaVersion": 1,
  "appVersion": "1.0.0",
  "exportedAt": 1793000000000,
  "data": {
    "accounts": [],
    "trades": [],
    "fills": [],
    "tags": [],
    "tradeTags": [],
    "importBatches": [],
    "importFingerprints": [],
    "prefs": { "display_tz": "device", "tilt_thresholds": {} }
  }
}
```

- Rows use DB column names (snake_case) and canonical decimal strings, which validated with zod on restore.
- Excluded from backups: `mode`, `app_lock`, `entitlement_cache`, `dismissed_tilt_day`, and everything demo.
- Restore = validate the whole file, then in **one transaction**: delete all user tables, insert all rows,
  recompute derived fields if `calc_version` differs. If anything fails, roll back, so the existing data stays intact.
- `formatVersion` > the supported version is rejected with "This backup was made by a newer Ledgerline".

## Trade CSV export (`ledgerline-trades-YYYYMMDD.csv`)

Columns: `id,account,symbol,direction,status,opened_at_utc,closed_at_utc,entry_price,exit_price,quantity,stop_price,fees,funding,funding_status,gross_pnl,net_pnl,r_multiple,emotion,tags,notes,source`.
Timestamps are ISO-8601 UTC with a `Z` suffix. Values are canonical decimals. Tags are joined with `|`. Encoding is RFC 4180.
The export is for spreadsheets and is **not** re-importable as a Ledgerline format in v1. The backup JSON is the restore path.
