import type { AppMode } from '@/state/session';

export const qk = {
  root: (mode: AppMode, accountId: string | null) => [mode, accountId] as const,
  dashboard: (mode: AppMode, accountId: string | null, period: string) =>
    [...qk.root(mode, accountId), 'dashboard', period] as const,
  trades: (mode: AppMode, accountId: string | null) =>
    [...qk.root(mode, accountId), 'trades'] as const,
  trade: (mode: AppMode, accountId: string | null, id: string) =>
    [...qk.trades(mode, accountId), id] as const,
};
