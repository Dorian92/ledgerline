import { Stack, useRouter } from 'expo-router';

import { formToInput, useCreateTrade } from '@/data/queries/useTrades';
import { TradeForm } from '@/features/trade-form/TradeForm';
import type { TradeFormValues } from '@/features/trade-form/schema';
import { useSession } from '@/state/session';
import { ScreenHeader } from '@/ui/primitives';
import { View, StyleSheet } from 'react-native';
import { Pill } from '@/ui/Pill';
import { color } from '@/ui/tokens';
export default function NewTradeScreen() {
  const router = useRouter();
  const create = useCreateTrade();
  const mode = useSession((s) => s.mode);
  const accountId = useSession((s) => s.activeAccountId);

  const onSubmit = async (values: TradeFormValues) => {
    if (!accountId) return;
    const input = formToInput({ ...values, accountId, quoteAsset: 'USD' });
    if ('error' in input) return;
    await create.mutateAsync(input);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ presentation: 'modal' }} />
      <ScreenHeader
        title="Quick add"
        right={mode === 'demo' ? <Pill label="DEMO DATA" variant="demo" /> : undefined}
      />
      <TradeForm onSubmit={onSubmit} submitting={create.isPending} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg, paddingTop: 48 },
});
