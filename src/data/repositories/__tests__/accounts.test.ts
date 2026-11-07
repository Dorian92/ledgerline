import { createAccountsRepo } from '../index';
import { createTestDb } from '@/test/sqliteTestDb';
import { testIds } from '@/data/ids.testutil';
import { systemClock } from '@/data/clock';

describe('accounts repo', () => {
  it('persists selected quote currency without starting balance', async () => {
    const db = await createTestDb();
    const accounts = createAccountsRepo(db, { ids: testIds(), clock: systemClock });
    const id = await accounts.create({
      name: 'Public HL · stuxfred',
      quoteCurrency: 'USDC',
    });
    const row = await accounts.get(id);
    expect(row?.quote_currency).toBe('USDC');
    expect(row?.starting_balance).toBeNull();
    await db.close();
  });

  it('stores USD and USDT when selected', async () => {
    const db = await createTestDb();
    const accounts = createAccountsRepo(db, { ids: testIds(), clock: systemClock });
    const usd = await accounts.create({ name: 'Cash', quoteCurrency: 'USD' });
    const usdt = await accounts.create({ name: 'Tether', quoteCurrency: 'USDT' });
    expect((await accounts.get(usd))?.quote_currency).toBe('USD');
    expect((await accounts.get(usdt))?.quote_currency).toBe('USDT');
    await db.close();
  });
});
