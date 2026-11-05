import type { Db } from './types';
import { migration0001 } from './migrations/0001_init';
import { migration0002 } from './migrations/0002_fills';

const migrations = [migration0001, migration0002];

export async function migrate(db: Db): Promise<number> {
  await db.exec('PRAGMA foreign_keys = ON');
  const row = await db.get<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  const latest = migrations[migrations.length - 1]?.version ?? 0;
  if (version > latest) {
    throw new Error('DbTooNewError');
  }
  for (const m of migrations) {
    if (m.version <= version) {
      continue;
    }
    await db.transaction(async (tx) => {
      for (const sql of m.up) {
        await tx.exec(sql);
      }
      await tx.exec(`PRAGMA user_version = ${m.version}`);
    });
    version = m.version;
  }
  return version;
}
