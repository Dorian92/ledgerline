import type { createImportsRepo } from '@/data/repositories/imports';
import type {
  createAccountsRepo,
  createPrefsRepo,
  createTagsRepo,
} from '@/data/repositories/index';
import type { createTradesRepo } from '@/data/repositories/trades';

export type Repos = {
  db: import('@/data/db/types').Db;
  accounts: ReturnType<typeof createAccountsRepo>;
  trades: ReturnType<typeof createTradesRepo>;
  tags: ReturnType<typeof createTagsRepo>;
  prefs: ReturnType<typeof createPrefsRepo>;
  imports: ReturnType<typeof createImportsRepo>;
};
