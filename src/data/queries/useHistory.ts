import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useRepos } from '@/data/DbProvider';
import { qk } from '@/data/queries/keys';
import { buildHistorySections, matchesFilter, type HistoryFilter } from '@/domain/metrics/history';
import { useSession } from '@/state/session';

export function useHistory(filter: HistoryFilter) {
  const repos = useRepos();
  const accountId = useSession((s) => s.activeAccountId);
  const mode = useSession((s) => s.mode);
  const tz = 'UTC';

  const query = useQuery({
    queryKey: [...qk.trades(mode, accountId), 'history', filter],
    enabled: !!accountId,
    queryFn: () => repos.trades.listForHistory(accountId!),
  });

  const sections = useMemo(() => {
    if (!query.data) return [];
    const filtered = query.data.filter((t) =>
      matchesFilter(
        {
          ...t,
          direction: t.direction as 'long' | 'short',
          status: t.status as 'open' | 'closed',
          emotion: t.emotion as never,
        },
        filter,
        tz,
      ),
    );
    const hasFilter = Object.keys(filter).length > 0;
    return buildHistorySections(
      filtered.map((t) => ({
        ...t,
        direction: t.direction as 'long' | 'short',
        status: t.status as 'open' | 'closed',
        emotion: t.emotion as never,
      })),
      tz,
      Date.now(),
      hasFilter,
    );
  }, [query.data, filter, tz]);

  return { ...query, sections, tz };
}

export function useUndoDeleteTrade() {
  const repos = useRepos();
  const qc = useQueryClient();
  const accountId = useSession((s) => s.activeAccountId);
  const mode = useSession((s) => s.mode);
  return useMutation({
    mutationFn: async (payload: {
      row: NonNullable<Awaited<ReturnType<typeof repos.trades.get>>>;
      tagIds: string[];
    }) => {
      await repos.trades.restore(payload.row as never, payload.tagIds, 'manual');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.root(mode, accountId) });
    },
  });
}
