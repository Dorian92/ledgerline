export const migration0002 = {
  version: 2,
  up: [
    `CREATE TABLE fills (
      id TEXT PRIMARY KEY,
      trade_id TEXT NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
      side TEXT NOT NULL CHECK (side IN ('buy','sell')),
      price TEXT NOT NULL,
      quantity TEXT NOT NULL,
      fee TEXT NOT NULL,
      fee_asset TEXT NOT NULL,
      reported_realized_pnl TEXT,
      executed_at INTEGER NOT NULL,
      exchange_trade_id TEXT
    )`,
    `CREATE INDEX fills_trade ON fills(trade_id)`,
  ],
};
