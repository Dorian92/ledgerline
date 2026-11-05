import { createTestDb } from '@/test/sqliteTestDb';
import { testIds } from '@/data/ids';
import { systemClock } from '@/data/clock';
import { createAccountsRepo } from '@/data/repositories/index';
import { createTradesRepo } from '@/data/repositories/trades';
import { dec } from '@/domain/money/dec';
import type { TradeInput } from '@/domain/trade/types';

describe('trades repo calc-on-write', () => {
  it('stores derived fields from §3.3', async () => {
    const db = await createTestDb();
    const deps = { ids: testIds(), clock: systemClock };
    const accounts = createAccountsRepo(db, deps);
    const trades = createTradesRepo(db, deps);
    const accountId = await accounts.create({ name: 'Main', quoteCurrency: 'USDT' });
    const input: TradeInput = {
      accountId,
      symbol: 'BTC-PERP',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      instrument: 'perp',
      direction: 'long',
      openedAt: 1,
      closedAt: 2,
      entryPrice: dec('68412.5'),
      exitPrice: dec('69240.0'),
      quantity: dec('0.150'),
      stopPrice: dec('68020.0'),
      leverage: null,
      fees: dec('4.10'),
      feesComplete: true,
      funding: dec('0'),
      fundingStatus: 'none',
      pnlSource: 'computed',
      emotion: null,
      tagIds: [],
      notes: '',
    };
    const id = await trades.create(input);
    const row = await db.get<{ net_pnl: string; r_multiple: string }>(
      'SELECT net_pnl, r_multiple FROM trades WHERE id = ?',
      [id],
    );
    expect(row?.net_pnl).toBe('120.025');
    expect(row?.r_multiple?.startsWith('2.0386')).toBe(true);
    await db.close();
  });
});
