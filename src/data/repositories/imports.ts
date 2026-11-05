import type { Db } from '@/data/db/types';
import type { Clock } from '@/data/clock';
import type { IdGenerator } from '@/data/ids';
import { tradeInputToRow } from '@/data/mappers/trade';
import type { ImportPlan } from '@/domain/import/types';
import { validateTradeInput, accountFromQuote } from '@/domain/trade';
import type { TradeInput } from '@/domain/trade/types';

export class DemoModeError extends Error {
  constructor() {
    super('Imports are disabled in demo mode');
  }
}

export class ImportCommitError extends Error {}

export function createImportsRepo(
  db: Db,
  deps: { ids: IdGenerator; clock: Clock; mode: 'real' | 'demo' },
) {
  return {
    async existingFingerprints(accountId: string): Promise<Set<string>> {
      const rows = await db.all<{ fingerprint: string }>(
        'SELECT fingerprint FROM import_fingerprints WHERE account_id = ?',
        [accountId],
      );
      return new Set(rows.map((r) => r.fingerprint));
    },
    async commit(opts: { accountId: string; plan: ImportPlan; fileName: string }) {
      if (deps.mode === 'demo') {
        throw new DemoModeError();
      }
      const now = deps.clock.now();
      const batchId = deps.ids.randomUUID();
      let tradesCreated = 0;
      await db.transaction(async (tx) => {
        await tx.run(
          `INSERT INTO import_batches (
            id, account_id, exchange, format_id, file_name, file_sha256, source_tz,
            total_rows, imported_rows, duplicate_rows, error_rows, trades_created, created_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            batchId,
            opts.accountId,
            opts.plan.exchange,
            opts.plan.formatId,
            opts.fileName,
            opts.plan.fileSha256,
            opts.plan.sourceTz,
            opts.plan.summary.total,
            opts.plan.summary.importableRows,
            opts.plan.summary.duplicate,
            opts.plan.summary.error,
            0,
            now,
          ],
        );
        for (const trade of opts.plan.trades) {
          const input: TradeInput = {
            ...trade.input,
            accountId: opts.accountId,
            emotion: null,
            tagIds: [],
            notes: '',
          };
          const account = accountFromQuote(input.quoteAsset);
          const v = validateTradeInput(input, account);
          if (!v.ok) {
            throw new ImportCommitError(`Invalid trade: ${JSON.stringify(v.errors)}`);
          }
          const id = deps.ids.randomUUID();
          const row = tradeInputToRow(id, input, 'import', now);
          row.import_batch_id = batchId;
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
          for (const fp of trade.fingerprints) {
            await tx.run(
              'INSERT INTO import_fingerprints (account_id, fingerprint, batch_id) VALUES (?,?,?)',
              [opts.accountId, fp, batchId],
            );
          }
          tradesCreated++;
        }
        await tx.run('UPDATE import_batches SET trades_created = ? WHERE id = ?', [
          tradesCreated,
          batchId,
        ]);
      });
      return { batchId, tradesCreated };
    },
    async undo(batchId: string) {
      await db.transaction(async (tx) => {
        await tx.run('DELETE FROM trades WHERE import_batch_id = ?', [batchId]);
        await tx.run('DELETE FROM import_fingerprints WHERE batch_id = ?', [batchId]);
        await tx.run('UPDATE import_batches SET undone_at = ? WHERE id = ?', [
          deps.clock.now(),
          batchId,
        ]);
      });
    },
  };
}
