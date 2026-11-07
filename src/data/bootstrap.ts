import type { Db } from '@/data/db/types';
import { openExpoDb } from '@/data/db/expoDb';
import { systemClock } from '@/data/clock';
import { expoIds } from '@/data/ids.expo';
import { createAccountsRepo, createPrefsRepo, createTagsRepo } from '@/data/repositories/index';
import { createImportsRepo } from '@/data/repositories/imports';
import { createPublicFillsRepo } from '@/data/repositories/publicFills';
import { createTradesRepo } from '@/data/repositories/trades';
import { generateDemoTrades } from '@/domain/demo/generate';
import type { Repos } from '@/data/DbProvider.types';

let demoDb: Db | null = null;

function makeRepos(db: Db, mode: 'real' | 'demo'): Repos {
  const deps = { ids: expoIds, clock: systemClock };
  return {
    db,
    accounts: createAccountsRepo(db, deps),
    trades: createTradesRepo(db, deps),
    tags: createTagsRepo(db, deps),
    prefs: createPrefsRepo(db, deps),
    imports: createImportsRepo(db, { ...deps, mode }),
    publicFills: createPublicFillsRepo(db),
  };
}

export async function openRealDatabase(): Promise<{ db: Db; repos: Repos }> {
  const db = await openExpoDb('ledgerline.db');
  const repos = makeRepos(db, 'real');
  await repos.trades.recomputeOutdated();
  const mode = await repos.prefs.get('mode');
  if (!mode) {
    await repos.prefs.set('mode', 'unset');
  }
  return { db, repos };
}

export async function getDemoDatabase(): Promise<{ db: Db; repos: Repos }> {
  if (!demoDb) {
    demoDb = await openExpoDb('ledgerline-demo.db');
    const repos = makeRepos(demoDb, 'demo');
    const accounts = await repos.accounts.list();
    if (accounts.length === 0) {
      const id = await repos.accounts.create({
        name: 'Demo account',
        quoteCurrency: 'USD',
        startingBalance: '10000',
      });
      const trades = generateDemoTrades({
        seed: 42,
        now: systemClock.now(),
        accountId: id,
      });
      for (const t of trades) {
        await repos.trades.create(t, 'demo');
      }
    }
    return { db: demoDb, repos: makeRepos(demoDb, 'demo') };
  }
  return { db: demoDb, repos: makeRepos(demoDb, 'demo') };
}

export async function resetDemoDatabase(): Promise<void> {
  const { db, repos } = await getDemoDatabase();
  const accounts = await repos.accounts.list();
  const accountId = accounts[0]?.id;
  if (!accountId) {
    return;
  }
  await db.run('DELETE FROM trades WHERE account_id = ?', [accountId]);
  const trades = generateDemoTrades({
    seed: 42,
    now: systemClock.now(),
    accountId,
  });
  for (const t of trades) {
    await repos.trades.create(t, 'demo');
  }
}
