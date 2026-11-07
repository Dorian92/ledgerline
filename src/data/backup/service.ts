import type { Repos } from '@/data/DbProvider.types';
import { parseBackup, serializeBackup, type BackupV1 } from '@/domain/backup/schema';
import { exportTradesCsv } from '@/domain/backup/csvExport';

export async function snapshotBackup(repos: Repos): Promise<BackupV1> {
  const accounts = await repos.accounts.list();
  const trades: BackupV1['trades'] = [];
  for (const a of accounts) {
    const rows = await repos.trades.listForAccount(a.id);
    trades.push(...(rows as BackupV1['trades']));
  }
  return {
    format: 'ledgerline-backup',
    formatVersion: 1,
    exportedAt: Date.now(),
    accounts: accounts.map((a) => ({
      id: a.id,
      name: a.name,
      quote_currency: a.quote_currency,
      starting_balance: (a as { starting_balance?: string | null }).starting_balance ?? null,
    })),
    trades,
  };
}

export async function restoreBackup(repos: Repos, backup: BackupV1) {
  const db = repos.db;
  await db.transaction(async (tx) => {
    await tx.run('DELETE FROM trade_tags');
    await tx.run('DELETE FROM trades');
    await tx.run('DELETE FROM accounts');
    for (const a of backup.accounts) {
      const now = Date.now();
      await tx.run(
        `INSERT INTO accounts (id, name, quote_currency, starting_balance, created_at, updated_at)
         VALUES (?,?,?,?,?,?)`,
        [a.id, a.name, a.quote_currency, a.starting_balance, now, now],
      );
    }
    for (const t of backup.trades) {
      const row = t as Record<string, unknown>;
      const cols = Object.keys(row);
      await tx.run(
        `INSERT INTO trades (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
        cols.map((c) => row[c] as string | number | null),
      );
    }
  });
}

export async function deleteAllJournalData(repos: Repos) {
  const db = repos.db;
  await db.run('DELETE FROM trade_tags');
  await db.run('DELETE FROM trades');
  await db.run('DELETE FROM import_fingerprints');
  await db.run('DELETE FROM imported_public_fills');
  await db.run('DELETE FROM import_batches');
  await db.run('DELETE FROM accounts');
  await repos.prefs.set('mode', 'unset');
}

export { parseBackup, serializeBackup, exportTradesCsv };
