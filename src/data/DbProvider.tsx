import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { systemClock } from '@/data/clock';
import type { Db } from '@/data/db/types';
import { openExpoDb } from '@/data/db/expoDb';
import { expoIds } from '@/data/ids.expo';
import {
  createAccountsRepo,
  createPrefsRepo,
  createTagsRepo,
} from '@/data/repositories/index';
import { createTradesRepo } from '@/data/repositories/trades';

export interface Repos {
  accounts: ReturnType<typeof createAccountsRepo>;
  trades: ReturnType<typeof createTradesRepo>;
  tags: ReturnType<typeof createTagsRepo>;
  prefs: ReturnType<typeof createPrefsRepo>;
}

interface DbContextValue {
  db: Db;
  repos: Repos;
  ready: boolean;
  error: Error | null;
}

const DbContext = createContext<DbContextValue | null>(null);

export function DbProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<DbContextValue | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await openExpoDb('ledgerline.db');
        const deps = { ids: expoIds, clock: systemClock };
        const repos: Repos = {
          accounts: createAccountsRepo(db, deps),
          trades: createTradesRepo(db, deps),
          tags: createTagsRepo(db, deps),
          prefs: createPrefsRepo(db, deps),
        };
        await repos.trades.recomputeOutdated();
        if (!cancelled) {
          setValue({ db, repos, ready: true, error: null });
        }
      } catch (e) {
        if (!cancelled) {
          setValue({
            db: null as unknown as Db,
            repos: null as unknown as Repos,
            ready: false,
            error: e instanceof Error ? e : new Error(String(e)),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!value) {
    return null;
  }
  if (value.error) {
    return null;
  }
  return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
}

export function useRepos(): Repos {
  const ctx = useContext(DbContext);
  if (!ctx?.repos) {
    throw new Error('DbProvider not ready');
  }
  return ctx.repos;
}

export function useDbReady(): boolean {
  return useContext(DbContext)?.ready ?? false;
}
