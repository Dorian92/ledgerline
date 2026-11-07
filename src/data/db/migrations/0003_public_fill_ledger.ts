export const migration0003 = {
  version: 3,
  up: [
    `ALTER TABLE import_batches ADD COLUMN ledger_rows_created INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE import_batches ADD COLUMN attribution_note TEXT`,
    `CREATE TABLE imported_public_fills (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      batch_id TEXT NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
      exchange_fill_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL CHECK (side IN ('buy','sell')),
      direction_label TEXT NOT NULL,
      price TEXT NOT NULL,
      quantity TEXT NOT NULL,
      fee TEXT NOT NULL,
      fee_token TEXT NOT NULL,
      builder_fee TEXT,
      closed_pnl TEXT,
      start_position TEXT,
      executed_at INTEGER NOT NULL,
      crossed INTEGER NOT NULL DEFAULT 0,
      UNIQUE(account_id, exchange_fill_id)
    )`,
    `CREATE INDEX imported_public_fills_account ON imported_public_fills(account_id, executed_at DESC)`,
  ],
};
