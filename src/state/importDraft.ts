import { create } from 'zustand';

import type { ImportPlan } from '@/domain/import/types';

interface ImportDraft {
  fileName: string;
  text: string;
  plan: ImportPlan | null;
  setDraft: (d: { fileName: string; text: string; plan: ImportPlan | null }) => void;
  clear: () => void;
}

export const useImportDraft = create<ImportDraft>((set) => ({
  fileName: '',
  text: '',
  plan: null,
  setDraft: (d) => set(d),
  clear: () => set({ fileName: '', text: '', plan: null }),
}));
