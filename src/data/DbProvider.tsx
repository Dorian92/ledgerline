import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getDemoDatabase, openRealDatabase } from '@/data/bootstrap';
import type { Repos } from './DbProvider.types';
import { useSession, type AppMode } from '@/state/session';
import { usePrivacy } from '@/state/privacy';

export type { Repos };

interface DbContextValue {
  repos: Repos | null;
  ready: boolean;
  error: Error | null;
  refreshMode: (mode: AppMode) => Promise<void>;
}

const DbContext = createContext<DbContextValue | null>(null);

async function reposForMode(mode: AppMode): Promise<Repos> {
  if (mode === 'demo') {
    return (await getDemoDatabase()).repos;
  }
  return (await openRealDatabase()).repos;
}

export function DbProvider({ children }: { children: ReactNode }) {
  const [repos, setRepos] = useState<Repos | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const setMode = useSession((s) => s.setMode);
  const setActiveAccountId = useSession((s) => s.setActiveAccountId);

  const refreshMode = useCallback(
    async (mode: AppMode) => {
      const r = await reposForMode(mode);
      setRepos(r);
      setMode(mode);
      await r.prefs.set('mode', mode);
      const accounts = await r.accounts.list();
      setActiveAccountId(accounts[0]?.id ?? null);
    },
    [setActiveAccountId, setMode],
  );

  useEffect(() => {
    (async () => {
      try {
        const { repos: realRepos } = await openRealDatabase();
        const mode = (await realRepos.prefs.get('mode')) ?? 'unset';
        setMode(mode);
        if (mode === 'demo') {
          setRepos((await getDemoDatabase()).repos);
        } else if (mode === 'real') {
          setRepos(realRepos);
          const stored = await realRepos.prefs.get('active_account_id');
          const hide = await realRepos.prefs.get('hide_amounts');
          const tz = await realRepos.prefs.get('display_tz');
          if (hide !== null) {
            usePrivacy.getState().setHideAmounts(hide);
          }
          if (tz) {
            usePrivacy.getState().setDisplayTz(tz);
          }
          const accounts = await realRepos.accounts.list();
          const active =
            stored && accounts.some((a) => a.id === stored) ? stored : (accounts[0]?.id ?? null);
          setActiveAccountId(active);
        } else {
          setRepos(realRepos);
        }
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        setReady(true);
      }
    })();
  }, [setActiveAccountId, setMode]);

  const value = useMemo(
    () => ({ repos, ready, error, refreshMode }),
    [repos, ready, error, refreshMode],
  );

  if (!ready) {
    return null;
  }
  if (error || !repos) {
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

export function useDb(): { refreshMode: (m: AppMode) => Promise<void> } {
  const ctx = useContext(DbContext);
  if (!ctx) {
    throw new Error('DbProvider not ready');
  }
  return { refreshMode: ctx.refreshMode };
}
