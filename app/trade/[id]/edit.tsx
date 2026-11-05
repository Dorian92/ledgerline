import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { formToInput, useUpdateTrade } from '@/data/queries/useTrades';
import { useRepos } from '@/data/DbProvider';
import { TradeForm } from '@/features/trade-form/TradeForm';
import type { TradeFormValues } from '@/features/trade-form/schema';
import { useSession } from '@/state/session';
import { ScreenHeader } from '@/ui/primitives';
import { Text } from '@/ui/Text';
import { color } from '@/ui/tokens';

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
      <View style={styles.container}>
        <ScreenHeader title="Edit trade" />
        <Text variant="secondary">Loading…</Text>
      </View>
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
    <View style={styles.container}>
      <ScreenHeader title="Edit trade" />
      <TradeForm onSubmit={onSubmit} submitting={update.isPending} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg, paddingTop: 48 },
});
