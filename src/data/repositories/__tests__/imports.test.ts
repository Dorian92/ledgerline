import { createImportsRepo, DemoModeError, ImportCommitError } from '../imports';
import { createTestDb } from '@/test/sqliteTestDb';
import { testIds } from '@/data/ids.testutil';
import { systemClock } from '@/data/clock';
import { buildImportPlan } from '@/domain/import/plan';
import { testClosedAdapter } from '@/domain/import/testAdapter';

const CSV = `Time,Symbol,Side,Qty,Entry,Exit
2024-01-01T12:00:00Z,BTC-PERP,long,0.1,100,101
`;

describe('imports repo', () => {
  it('commits trades from a plan', async () => {
    const db = await createTestDb();
    const now = systemClock.now();
    await db.run(
      `INSERT INTO accounts (id, name, quote_currency, created_at, updated_at) VALUES (?,?,?,?,?)`,
      ['acc1', 'Main', 'USD', now, now],
    );
    const imports = createImportsRepo(db, { ids: testIds(), clock: systemClock, mode: 'real' });
    const accountId = 'acc1';
    const plan = await buildImportPlan({
      text: CSV,
      adapters: [testClosedAdapter],
      quoteCurrency: 'USD',
      sourceTz: 'UTC',
      existingFingerprints: new Set(),
    });
    if (!('trades' in plan)) throw new Error('plan failed');
    const { tradesCreated } = await imports.commit({
      accountId,
      plan,
      fileName: 't.csv',
    });
    expect(tradesCreated).toBe(1);
  });

  it('undo removes batch trades', async () => {
    const db = await createTestDb();
    const now = systemClock.now();
    await db.run(
      `INSERT INTO accounts (id, name, quote_currency, created_at, updated_at) VALUES (?,?,?,?,?)`,
      ['acc1', 'Main', 'USD', now, now],
    );
    const imports = createImportsRepo(db, { ids: testIds(), clock: systemClock, mode: 'real' });
    const plan = await buildImportPlan({
      text: CSV,
      adapters: [testClosedAdapter],
      quoteCurrency: 'USD',
      sourceTz: 'UTC',
      existingFingerprints: new Set(),
    });
    if (!('trades' in plan)) throw new Error('plan failed');
    const { batchId } = await imports.commit({ accountId: 'acc1', plan, fileName: 't.csv' });
    await imports.undo(batchId);
    const count = await db.get<{ c: number }>('SELECT COUNT(*) as c FROM trades');
    expect(count?.c).toBe(0);
  });

  it('rolls back failed commit atomically', async () => {
    const db = await createTestDb();
    const now = systemClock.now();
    await db.run(
      `INSERT INTO accounts (id, name, quote_currency, created_at, updated_at) VALUES (?,?,?,?,?)`,
      ['acc1', 'Main', 'USD', now, now],
    );
    const imports = createImportsRepo(db, { ids: testIds(), clock: systemClock, mode: 'real' });
    const good = await buildImportPlan({
      text: CSV,
      adapters: [testClosedAdapter],
      quoteCurrency: 'USD',
      sourceTz: 'UTC',
      existingFingerprints: new Set(),
    });
    if (!('trades' in good)) throw new Error('no plan');
    const badPlan = {
      ...good,
      trades: [
        ...good.trades,
        {
          ...good.trades[0]!,
          fingerprints: ['invalid-trade-fp'],
          input: {
            ...good.trades[0]!.input,
            openedAt: 2000,
            closedAt: 1000,
          },
        },
      ],
    };
    await expect(
      imports.commit({ accountId: 'acc1', plan: badPlan, fileName: 'bad.csv' }),
    ).rejects.toBeInstanceOf(ImportCommitError);
    const count = await db.get<{ c: number }>('SELECT COUNT(*) as c FROM trades');
    expect(count?.c).toBe(0);
  });

  it('blocks demo mode', async () => {
    const db = await createTestDb();
    const imports = createImportsRepo(db, { ids: testIds(), clock: systemClock, mode: 'demo' });
    await expect(
      imports.commit({
        accountId: 'x',
        plan: {
          formatId: 't',
          exchange: 'test',
          label: 't',
          sourceTz: 'UTC',
          fileSha256: 'abc',
          summary: {
            total: 0,
            valid: 0,
            warning: 0,
            duplicate: 0,
            error: 0,
            importableRows: 0,
            tradesToCreate: 0,
          },
          rows: [],
          trades: [],
          messages: [],
        },
        fileName: 'f',
      }),
    ).rejects.toBeInstanceOf(DemoModeError);
  });
});
