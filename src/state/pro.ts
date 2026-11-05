import React from 'react';
import { create } from 'zustand';

interface ProState {
  entitled: boolean;
  mockPurchase: () => void;
  reset: () => void;
}

export const usePro = create<ProState>((set) => ({
  entitled: false,
  mockPurchase: () => set({ entitled: true }),
  reset: () => set({ entitled: false }),
}));

export function ProGate({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  const entitled = usePro((s) => s.entitled);
  return entitled ? children : fallback;
}
