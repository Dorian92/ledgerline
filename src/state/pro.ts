import React from 'react';
import { create } from 'zustand';

import type { Repos } from '@/data/DbProvider.types';
import { useSession } from '@/state/session';

interface ProState {
  entitled: boolean;
  mockPurchase: (repos?: Repos) => Promise<void>;
  reset: () => void;
  hydrate: (v: boolean) => void;
}

export const usePro = create<ProState>((set) => ({
  entitled: false,
  mockPurchase: async (repos) => {
    set({ entitled: true });
    if (repos) {
      await repos.prefs.set('entitlement_pro', true);
    }
  },
  reset: () => set({ entitled: false }),
  hydrate: (v) => set({ entitled: v }),
}));

export function useHasPro(): boolean {
  const entitled = usePro((s) => s.entitled);
  const mode = useSession((s) => s.mode);
  return entitled || mode === 'demo';
}

export function ProGate({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  const hasPro = useHasPro();
  return hasPro ? children : fallback;
}
