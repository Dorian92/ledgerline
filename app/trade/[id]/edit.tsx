import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { formToInput, useUpdateTrade } from '@/data/queries/useTrades';
import { useRepos } from '@/data/DbProvider';
import { mergeFormIntoTradeInput, tradeInputToFormValues } from '@/features/trade-form/map';
import { TradeForm } from '@/features/trade-form/TradeForm';
import type { TradeFormValues } from '@/features/trade-form/schema';
import { useSession } from '@/state/session';
import { ButtonUi } from '@/ui/Button';
import { NavScreen } from '@/ui/NavScreen';
import { Text } from '@/ui/Text';

export default function EditTradeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const repos = useRepos();
  const update = useUpdateTrade();
  const router = useRouter();
  const accountId = useSession((s) => s.activeAccountId);
  const {
    data: input,
    isLoading,
    isFetched,
  } = useQuery({
    queryKey: ['trade-input', id],
    queryFn: () => repos.trades.getInput(id!),
    enabled: !!id,
  });

  if (!id) {
    return (
      <NavScreen title="Edit trade">
        <Text variant="secondary">Missing trade id.</Text>
        <ButtonUi title="Back" variant="secondary" onPress={() => router.back()} />
      </NavScreen>
    );
  }

  if (isLoading) {
    return (
      <NavScreen title="Edit trade">
        <Text variant="secondary">Loading…</Text>
      </NavScreen>
    );
  }

  if (isFetched && !input) {
    return (
      <NavScreen title="Edit trade">
        <Text variant="secondary">Trade not found. It may have been deleted.</Text>
        <ButtonUi title="Back" variant="secondary" onPress={() => router.back()} />
      </NavScreen>
    );
  }

  if (!input) {
    return null;
  }

  const initial = tradeInputToFormValues(input);

  const onSubmit = async (values: TradeFormValues) => {
    if (!accountId) return;
    const mapped = formToInput({ ...values, accountId, quoteAsset: input.quoteAsset });
    if ('error' in mapped) return;
    const next = mergeFormIntoTradeInput(input, values, mapped);
    await update.mutateAsync({ id, input: next });
    router.back();
  };

  return (
    <NavScreen title="Edit trade" scroll>
      <TradeForm
        formKey={id}
        initialValues={initial}
        onSubmit={onSubmit}
        submitting={update.isPending}
        onCancel={() => router.back()}
      />
    </NavScreen>
  );
}
