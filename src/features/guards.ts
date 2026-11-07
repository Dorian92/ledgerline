import { useSession } from '@/state/session';

export function useRealModeOnly(): { allowed: boolean; reason: string | null } {
  const mode = useSession((s) => s.mode);
  const accountId = useSession((s) => s.activeAccountId);
  if (mode === 'demo') {
    return {
      allowed: false,
      reason: 'Imports and backups go into your journal, not demo data.',
    };
  }
  if (mode === 'unset') {
    return { allowed: false, reason: 'Finish onboarding to use this feature.' };
  }
  if (!accountId) {
    return { allowed: false, reason: 'Create a journal account before using this feature.' };
  }
  return { allowed: true, reason: null };
}
