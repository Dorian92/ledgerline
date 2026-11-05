import { z } from 'zod';

import type { Db } from '@/data/db/types';
import type { Clock } from '@/data/clock';
import type { IdGenerator } from '@/data/ids';
import type { QuoteCurrency } from '@/domain/money/types';

export function createAccountsRepo(db: Db, deps: { ids: IdGenerator; clock: Clock }) {
  return {
    async create(input: {
      name: string;
      quoteCurrency: QuoteCurrency;
      startingBalance?: string | null;
      exchange?: string | null;
    }) {
      const id = deps.ids.randomUUID();
      const now = deps.clock.now();
      await db.run(
        `INSERT INTO accounts (id, name, exchange, quote_currency, starting_balance, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.name,
          input.exchange ?? null,
          input.quoteCurrency,
          input.startingBalance ?? null,
          now,
          now,
        ],
      );
      return id;
    },
    async get(id: string) {
      return db.get<{
        id: string;
        name: string;
        quote_currency: QuoteCurrency;
        starting_balance: string | null;
      }>('SELECT id, name, quote_currency, starting_balance FROM accounts WHERE id = ?', [id]);
    },
    async list() {
      return db.all<{ id: string; name: string; quote_currency: QuoteCurrency }>(
        'SELECT id, name, quote_currency FROM accounts WHERE archived_at IS NULL ORDER BY created_at',
      );
    },
    async delete(id: string) {
      await db.run('DELETE FROM accounts WHERE id = ?', [id]);
    },
  };
}

const prefSchemas = {
  mode: z.enum(['unset', 'demo', 'real']),
  active_account_id: z.string().nullable(),
  display_tz: z.enum(['device', 'UTC']),
} as const;

export type PrefKey = keyof typeof prefSchemas;

export function createPrefsRepo(db: Db, deps: { clock: Clock }) {
  return {
    async get<K extends PrefKey>(key: K): Promise<z.infer<(typeof prefSchemas)[K]> | null> {
      const row = await db.get<{ value: string }>('SELECT value FROM app_prefs WHERE key = ?', [
        key,
      ]);
      if (!row) {
        return null;
      }
      return prefSchemas[key].parse(JSON.parse(row.value)) as z.infer<(typeof prefSchemas)[K]>;
    },
    async set<K extends PrefKey>(key: K, value: z.infer<(typeof prefSchemas)[K]>) {
      prefSchemas[key].parse(value);
      const now = deps.clock.now();
      await db.run(
        `INSERT INTO app_prefs (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        [key, JSON.stringify(value), now],
      );
    },
  };
}

export function createTagsRepo(db: Db, deps: { ids: IdGenerator; clock: Clock }) {
  return {
    async list() {
      return db.all<{ id: string; name: string }>(
        'SELECT id, name FROM tags WHERE archived_at IS NULL ORDER BY name',
      );
    },
    async create(name: string) {
      const id = deps.ids.randomUUID();
      const now = deps.clock.now();
      try {
        await db.run('INSERT INTO tags (id, name, created_at) VALUES (?, ?, ?)', [id, name, now]);
      } catch {
        throw new Error('TagExistsError');
      }
      return id;
    },
  };
}
