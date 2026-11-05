import Database from 'better-sqlite3';

import { migrate } from '@/data/db/migrate';
import type { Db, SqlParam } from '@/data/db/types';

class BetterSqliteDb implements Db {
  private txDepth = 0;

  constructor(private db: Database.Database) {}

  async exec(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async run(sql: string, params: SqlParam[] = []): Promise<{ changes: number }> {
    const info = this.db.prepare(sql).run(...params);
    return { changes: info.changes };
  }

  async all<T>(sql: string, params: SqlParam[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(...params) as T[];
  }

  async get<T>(sql: string, params: SqlParam[] = []): Promise<T | null> {
    const row = this.db.prepare(sql).get(...params) as T | undefined;
    return row ?? null;
  }

  async transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
    if (this.txDepth > 0) {
      return fn(this);
    }
    this.txDepth += 1;
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = await fn(this);
      this.db.exec('COMMIT');
      return result;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    } finally {
      this.txDepth -= 1;
    }
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

export async function createTestDb(): Promise<Db> {
  const raw = new Database(':memory:');
  const db = new BetterSqliteDb(raw);
  await migrate(db);
  return db;
}
