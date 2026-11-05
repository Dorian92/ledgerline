import type { Repos } from '@/data/DbProvider.types';

export async function exportBackupJson(repos: Repos): Promise<string> {
  const accounts = await repos.accounts.list();
  const payload = { version: 1, exportedAt: Date.now(), accounts };
  return JSON.stringify(payload, null, 2);
}

export async function deleteAllJournalTrades(repos: Repos) {
  const accounts = await repos.accounts.list();
  for (const a of accounts) {
    await repos.trades.listForHistory(a.id);
  }
}
