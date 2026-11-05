import { createTestDb } from '@/test/sqliteTestDb';

describe('migrations', () => {
  it('applies schema v1', async () => {
    const db = await createTestDb();
    const v = await db.get<{ user_version: number }>('PRAGMA user_version');
    expect(v?.user_version).toBe(1);
    await db.close();
  });
});
