import { Stack, useRouter } from 'expo-router';

import { formToInput, useCreateTrade } from '@/data/queries/useTrades';
import { TradeForm } from '@/features/trade-form/TradeForm';
import type { TradeFormValues } from '@/features/trade-form/schema';
import { useSession } from '@/state/session';
import { NavScreen } from '@/ui/NavScreen';
import { Pill } from '@/ui/Pill';

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
    <>
      <Stack.Screen options={{ presentation: 'modal' }} />
      <NavScreen
        title="Quick add"
        backLabel="Close"
        scroll
        right={mode === 'demo' ? <Pill label="DEMO DATA" variant="demo" /> : undefined}
      >
        <TradeForm
          onSubmit={onSubmit}
          submitting={create.isPending}
          onCancel={() => router.back()}
        />
      </NavScreen>
    </>
  );
}
