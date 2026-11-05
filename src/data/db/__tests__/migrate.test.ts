import { createTestDb } from '@/test/sqliteTestDb';

describe('migrations', () => {
  it('applies schema through v2', async () => {
    const db = await createTestDb();
    const v = await db.get<{ user_version: number }>('PRAGMA user_version');
    expect(v?.user_version).toBe(2);
    const fills = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='fills'",
    );
    expect(fills).toBeTruthy();
    await db.close();
  });
});
