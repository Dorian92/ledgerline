import { create } from 'zustand';

export type AppMode = 'unset' | 'demo' | 'real';

interface SessionState {
  mode: AppMode;
  activeAccountId: string | null;
  setMode: (m: AppMode) => void;
  setActiveAccountId: (id: string | null) => void;
}

export const useSession = create<SessionState>((set) => ({
  mode: 'unset',
  activeAccountId: null,
  setMode: (mode) => set({ mode }),
  setActiveAccountId: (activeAccountId) => set({ activeAccountId }),
}));
