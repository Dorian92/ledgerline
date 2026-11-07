import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { formToInput, useUpdateTrade } from '@/data/queries/useTrades';
import { useRepos } from '@/data/DbProvider';
import { TradeForm } from '@/features/trade-form/TradeForm';
import type { TradeFormValues } from '@/features/trade-form/schema';
import { useSession } from '@/state/session';
import { NavScreen } from '@/ui/NavScreen';
import { Text } from '@/ui/Text';

export default function EditTradeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const repos = useRepos();
  const update = useUpdateTrade();
  const router = useRouter();
  const accountId = useSession((s) => s.activeAccountId);
  const { data: input, isLoading } = useQuery({
    queryKey: ['trade-input', id],
    queryFn: () => repos.trades.getInput(id!),
    enabled: !!id,
  });

  if (isLoading || !input) {
    return (
      <NavScreen title="Edit trade">
        <Text variant="secondary">Loading…</Text>
      </NavScreen>
    );
  }

  const onSubmit = async (values: TradeFormValues) => {
    if (!accountId) return;
    const mapped = formToInput({ ...values, accountId, quoteAsset: input.quoteAsset });
    if ('error' in mapped) return;
    await update.mutateAsync({ id: id!, input: mapped });
    router.back();
  };

  return (
    <NavScreen title="Edit trade" scroll>
      <TradeForm onSubmit={onSubmit} submitting={update.isPending} onCancel={() => router.back()} />
    </NavScreen>
  );
}
