import type { Db } from '@/data/db/types';
import type { Clock } from '@/data/clock';
import type { IdGenerator } from '@/data/ids';
import { tradeInputToRow, rowToTradeInput, type TradeRow } from '@/data/mappers/trade';
import { validateTradeInput, accountFromQuote } from '@/domain/trade';
import type { TradeInput } from '@/domain/trade/types';
import { fromCanonical, toCanonical } from '@/domain/money/canonical';
import { CALC_VERSION, computeTrade } from '@/domain/trade/compute';

export function createTradesRepo(db: Db, deps: { ids: IdGenerator; clock: Clock }) {
  return {
    async create(input: TradeInput, source: 'manual' | 'import' | 'demo' = 'manual') {
      const account = accountFromQuote(input.quoteAsset);
      const v = validateTradeInput(input, account);
      if (!v.ok) {
        throw new Error(JSON.stringify(v.errors));
      }
      const id = deps.ids.randomUUID();
      const now = deps.clock.now();
      const row = tradeInputToRow(id, input, source, now);
      await db.transaction(async (tx) => {
        await tx.run(
          `INSERT INTO trades (
            id, account_id, symbol, base_asset, quote_asset, instrument, direction, status,
            opened_at, closed_at, entry_price, exit_price, quantity, max_quantity, stop_price,
            leverage, fees, fees_complete, funding, funding_status, pnl_source,
            gross_pnl, net_pnl, risk_amount, r_multiple, r_unavailable_reason,
            emotion, notes, source, import_batch_id, calc_version, created_at, updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            row.id,
            row.account_id,
            row.symbol,
            row.base_asset,
            row.quote_asset,
            row.instrument,
            row.direction,
            row.status,
            row.opened_at,
            row.closed_at,
            row.entry_price,
            row.exit_price,
            row.quantity,
            row.max_quantity,
            row.stop_price,
            row.leverage,
            row.fees,
            row.fees_complete,
            row.funding,
            row.funding_status,
            row.pnl_source,
            row.gross_pnl,
            row.net_pnl,
            row.risk_amount,
            row.r_multiple,
            row.r_unavailable_reason,
            row.emotion,
            row.notes,
            row.source,
            row.import_batch_id,
            row.calc_version,
            row.created_at,
            row.updated_at,
          ],
        );
        for (const tagId of input.tagIds) {
          await tx.run('INSERT INTO trade_tags (trade_id, tag_id) VALUES (?, ?)', [id, tagId]);
        }
      });
      return id;
    },
    async delete(id: string) {
      await db.run('DELETE FROM trades WHERE id = ?', [id]);
    },
    async get(id: string) {
      return db.get('SELECT * FROM trades WHERE id = ?', [id]);
    },
    async listForHistory(accountId: string) {
      const rows = await db.all<{
        id: string;
        symbol: string;
        direction: string;
        status: string;
        opened_at: number;
        closed_at: number | null;
        net_pnl: string | null;
        r_multiple: string | null;
        notes: string;
        emotion: string | null;
        source: string;
      }>(
        `SELECT id, symbol, direction, status, opened_at, closed_at, net_pnl, r_multiple, notes, emotion, source
         FROM trades WHERE account_id = ?
         ORDER BY COALESCE(closed_at, opened_at) DESC, id DESC`,
        [accountId],
      );
      const out = [];
      for (const r of rows) {
        const tagRows = await db.all<{ tag_id: string }>(
          'SELECT tag_id FROM trade_tags WHERE trade_id = ?',
          [r.id],
        );
        out.push({ ...r, tagIds: tagRows.map((t) => t.tag_id) });
      }
      return out;
    },
    async getTagIds(tradeId: string) {
      const tagRows = await db.all<{ tag_id: string }>(
        'SELECT tag_id FROM trade_tags WHERE trade_id = ?',
        [tradeId],
      );
      return tagRows.map((t) => t.tag_id);
    },
    async getInput(id: string): Promise<TradeInput | null> {
      const row = await db.get<TradeRow>('SELECT * FROM trades WHERE id = ?', [id]);
      if (!row) return null;
      const tagIds = await db.all<{ tag_id: string }>(
        'SELECT tag_id FROM trade_tags WHERE trade_id = ?',
        [id],
      );
      return rowToTradeInput(
        row,
        tagIds.map((t) => t.tag_id),
      );
    },
    async restore(row: TradeRow, tagIds: string[], source: 'manual' | 'import' | 'demo') {
      await db.transaction(async (tx) => {
        const now = deps.clock.now();
        await tx.run(
          `INSERT INTO trades (
            id, account_id, symbol, base_asset, quote_asset, instrument, direction, status,
            opened_at, closed_at, entry_price, exit_price, quantity, max_quantity, stop_price,
            leverage, fees, fees_complete, funding, funding_status, pnl_source,
            gross_pnl, net_pnl, risk_amount, r_multiple, r_unavailable_reason,
            emotion, notes, source, import_batch_id, calc_version, created_at, updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            row.id,
            row.account_id,
            row.symbol,
            row.base_asset,
            row.quote_asset,
            row.instrument,
            row.direction,
            row.status,
            row.opened_at,
            row.closed_at,
            row.entry_price,
            row.exit_price,
            row.quantity,
            row.max_quantity,
            row.stop_price,
            row.leverage,
            row.fees,
            row.fees_complete,
            row.funding,
            row.funding_status,
            row.pnl_source,
            row.gross_pnl,
            row.net_pnl,
            row.risk_amount,
            row.r_multiple,
            row.r_unavailable_reason,
            row.emotion,
            row.notes,
            source,
            row.import_batch_id,
            row.calc_version,
            row.created_at,
            now,
          ],
        );
        for (const tagId of tagIds) {
          await tx.run('INSERT INTO trade_tags (trade_id, tag_id) VALUES (?, ?)', [row.id, tagId]);
        }
      });
    },
    async listForAccount(accountId: string) {
      return db.all(
        `SELECT id, symbol, direction, status, opened_at, closed_at, net_pnl, r_multiple
         FROM trades WHERE account_id = ?
         ORDER BY COALESCE(closed_at, opened_at) DESC, id DESC`,
        [accountId],
      );
    },
    async update(id: string, input: TradeInput) {
      const account = accountFromQuote(input.quoteAsset);
      const v = validateTradeInput(input, account);
      if (!v.ok) {
        throw new Error(JSON.stringify(v.errors));
      }
      const now = deps.clock.now();
      const row = tradeInputToRow(id, input, 'manual', now);
      await db.run(
        `UPDATE trades SET
          symbol=?, base_asset=?, quote_asset=?, instrument=?, direction=?, status=?,
          opened_at=?, closed_at=?, entry_price=?, exit_price=?, quantity=?, max_quantity=?,
          stop_price=?, leverage=?, fees=?, fees_complete=?, funding=?, funding_status=?,
          pnl_source=?, gross_pnl=?, net_pnl=?, risk_amount=?, r_multiple=?, r_unavailable_reason=?,
          emotion=?, notes=?, updated_at=?, calc_version=?
         WHERE id=?`,
        [
          row.symbol,
          row.base_asset,
          row.quote_asset,
          row.instrument,
          row.direction,
          row.status,
          row.opened_at,
          row.closed_at,
          row.entry_price,
          row.exit_price,
          row.quantity,
          row.max_quantity,
          row.stop_price,
          row.leverage,
          row.fees,
          row.fees_complete,
          row.funding,
          row.funding_status,
          row.pnl_source,
          row.gross_pnl,
          row.net_pnl,
          row.risk_amount,
          row.r_multiple,
          row.r_unavailable_reason,
          row.emotion,
          row.notes,
          row.updated_at,
          row.calc_version,
          id,
        ],
      );
      await db.run('DELETE FROM trade_tags WHERE trade_id = ?', [id]);
      for (const tagId of input.tagIds) {
        await db.run('INSERT INTO trade_tags (trade_id, tag_id) VALUES (?, ?)', [id, tagId]);
      }
    },
    async listClosedForMetrics(accountId: string) {
      return db.all(
        `SELECT id, symbol, direction, opened_at, closed_at, net_pnl, r_multiple, quantity,
                entry_price, risk_amount, fees_complete, funding_status, emotion
         FROM trades WHERE account_id = ? AND status = 'closed'
         ORDER BY closed_at, id`,
        [accountId],
      );
    },
    async recomputeOutdated() {
      const outdated = await db.all<{ id: string }>(
        'SELECT id FROM trades WHERE calc_version < ? LIMIT 500',
        [CALC_VERSION],
      );
      for (const { id } of outdated) {
        const row = await db.get<{ id: string } & Record<string, unknown>>(
          'SELECT * FROM trades WHERE id = ?',
          [id],
        );
        if (!row) {
          continue;
        }
        const input: TradeInput = {
          accountId: row.account_id as string,
          symbol: row.symbol as string,
          baseAsset: row.base_asset as string,
          quoteAsset: row.quote_asset as TradeInput['quoteAsset'],
          instrument: row.instrument as TradeInput['instrument'],
          direction: row.direction as TradeInput['direction'],
          openedAt: row.opened_at as number,
          closedAt: row.closed_at as number | null,
          entryPrice: fromCanonical(row.entry_price as string),
          exitPrice: row.exit_price ? fromCanonical(row.exit_price as string) : null,
          quantity: fromCanonical(row.quantity as string),
          maxQuantity: fromCanonical(row.max_quantity as string),
          stopPrice: row.stop_price ? fromCanonical(row.stop_price as string) : null,
          leverage: row.leverage ? fromCanonical(row.leverage as string) : null,
          fees: fromCanonical(row.fees as string),
          feesComplete: (row.fees_complete as number) === 1,
          funding: fromCanonical(row.funding as string),
          fundingStatus: row.funding_status as TradeInput['fundingStatus'],
          pnlSource: row.pnl_source as TradeInput['pnlSource'],
          emotion: row.emotion as TradeInput['emotion'],
          tagIds: [],
          notes: row.notes as string,
        };
        const d = computeTrade(input);
        await db.run(
          `UPDATE trades SET gross_pnl=?, net_pnl=?, risk_amount=?, r_multiple=?, r_unavailable_reason=?, calc_version=?
           WHERE id=?`,
          [
            d.grossPnl ? toCanonical(d.grossPnl) : null,
            d.netPnl ? toCanonical(d.netPnl) : null,
            d.riskAmount ? toCanonical(d.riskAmount) : null,
            d.rMultiple ? toCanonical(d.rMultiple) : null,
            d.rUnavailableReason,
            CALC_VERSION,
            id,
          ],
        );
      }
    },
  };
}
