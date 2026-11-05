import { create } from 'zustand';

interface PrivacyState {
  hideAmounts: boolean;
  setHideAmounts: (v: boolean) => void;
  displayTz: 'device' | 'UTC';
  setDisplayTz: (v: 'device' | 'UTC') => void;
}

export const usePrivacy = create<PrivacyState>((set) => ({
  hideAmounts: false,
  setHideAmounts: (hideAmounts) => set({ hideAmounts }),
  displayTz: 'device',
  setDisplayTz: (displayTz) => set({ displayTz }),
}));

export function resolveDisplayTz(pref: 'device' | 'UTC'): string {
  if (pref === 'UTC') return 'UTC';
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
