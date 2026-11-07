import type { Db } from '@/data/db/types';

export type PublicFillRow = {
  id: string;
  exchange_fill_id: string;
  symbol: string;
  side: string;
  direction_label: string;
  price: string;
  quantity: string;
  fee: string;
  fee_token: string;
  builder_fee: string | null;
  closed_pnl: string | null;
  start_position: string | null;
  executed_at: number;
  crossed: number;
  batch_id: string;
};

export function createPublicFillsRepo(db: Db) {
  return {
    async listForAccount(accountId: string, limit = 500): Promise<PublicFillRow[]> {
      return db.all<PublicFillRow>(
        `SELECT id, exchange_fill_id, symbol, side, direction_label, price, quantity,
                fee, fee_token, builder_fee, closed_pnl, start_position, executed_at, crossed, batch_id
         FROM imported_public_fills
         WHERE account_id = ?
         ORDER BY executed_at DESC, exchange_fill_id DESC
         LIMIT ?`,
        [accountId, limit],
      );
    },
    async countForAccount(accountId: string): Promise<number> {
      const row = await db.get<{ c: number }>(
        'SELECT COUNT(*) as c FROM imported_public_fills WHERE account_id = ?',
        [accountId],
      );
      return row?.c ?? 0;
    },
  };
}
