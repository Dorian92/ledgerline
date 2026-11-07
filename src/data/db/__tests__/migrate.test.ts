import { createTestDb } from '@/test/sqliteTestDb';

describe('migrations', () => {
  it('applies schema through v3', async () => {
    const db = await createTestDb();
    const v = await db.get<{ user_version: number }>('PRAGMA user_version');
    expect(v?.user_version).toBe(3);
    const ledger = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='imported_public_fills'",
    );
    expect(ledger).toBeTruthy();
    await db.close();
  });
});
