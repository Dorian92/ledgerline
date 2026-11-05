import * as SQLite from 'expo-sqlite';

import { migrate } from './migrate';
import type { Db, SqlParam } from './types';

class ExpoDb implements Db {
  constructor(private db: SQLite.SQLiteDatabase) {}

  async exec(sql: string): Promise<void> {
    await this.db.execAsync(sql);
  }

  async run(sql: string, params: SqlParam[] = []): Promise<{ changes: number }> {
    const result = await this.db.runAsync(sql, params);
    return { changes: result.changes };
  }

  async all<T>(sql: string, params: SqlParam[] = []): Promise<T[]> {
    return this.db.getAllAsync<T>(sql, params);
  }

  async get<T>(sql: string, params: SqlParam[] = []): Promise<T | null> {
    const row = await this.db.getFirstAsync<T>(sql, params);
    return row ?? null;
  }

  async transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
    let result!: T;
    await this.db.withExclusiveTransactionAsync(async () => {
      result = await fn(this);
    });
    return result;
  }

  async close(): Promise<void> {
    await this.db.closeAsync();
  }
}

export async function openExpoDb(fileName: string): Promise<Db> {
  const db = await SQLite.openDatabaseAsync(fileName);
  const wrapped = new ExpoDb(db);
  await migrate(wrapped);
  return wrapped;
}
