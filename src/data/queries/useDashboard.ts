import { useQuery } from '@tanstack/react-query';

import { useRepos } from '@/data/DbProvider';
import { qk } from '@/data/queries/keys';
import { computeSummary, periodRange, type PeriodKey } from '@/domain/metrics';
import { dec } from '@/domain/money/dec';
import { resolveDisplayTz, usePrivacy } from '@/state/privacy';
import { useSession } from '@/state/session';

export function useDashboard(period: PeriodKey) {
  const repos = useRepos();
  const accountId = useSession((s) => s.activeAccountId);
  const mode = useSession((s) => s.mode);
  const displayPref = usePrivacy((s) => s.displayTz);

  return useQuery({
    queryKey: [...qk.dashboard(mode, accountId, period), displayPref],
    enabled: !!accountId,
    queryFn: async () => {
      const account = await repos.accounts.get(accountId!);
      const rows = await repos.trades.listClosedForMetrics(accountId!);
      const now = Date.now();
      const tz = resolveDisplayTz(displayPref);
      const range = periodRange(period, now, tz);
      const summary = computeSummary(rows as never, range, {
        startingBalance: account?.starting_balance ? dec(account.starting_balance) : null,
      });
      const recent = rows.slice(-3).reverse() as {
        id: string;
        symbol: string;
        direction: string;
        closed_at: number;
        net_pnl: string;
        r_multiple: string | null;
      }[];
      return { summary, recent, account };
    },
  });
}
