import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useRepos } from '@/data/DbProvider';
import { useDeleteTrade } from '@/data/queries/useTrades';
import { fromCanonical } from '@/domain/money/canonical';
import { formatR } from '@/domain/money/format';
import { useQuery } from '@tanstack/react-query';
import { Money } from '@/ui/Money';
import { ButtonUi } from '@/ui/Button';
import { ScreenHeader } from '@/ui/primitives';
import { Text } from '@/ui/Text';
import { Pill } from '@/ui/Pill';
import { color, space } from '@/ui/tokens';

export default function TradeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const repos = useRepos();
  const router = useRouter();
  const del = useDeleteTrade();
  const { data: row } = useQuery({
    queryKey: ['trade', id],
    queryFn: () => repos.trades.get(id!) as Promise<Record<string, unknown> | null>,
    enabled: !!id,
  });

  if (!row) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Trade" />
        <Text variant="secondary">Loading…</Text>
      </View>
    );
  }

  const net = row.net_pnl ? fromCanonical(row.net_pnl as string) : null;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={row.symbol as string}
        right={
          <Pill
            label={(row.direction as string).toUpperCase()}
            variant={row.direction === 'long' ? 'long' : 'short'}
          />
        }
      />
      {net ? <Money amount={net} currency="USD" variant="hero" /> : null}
      {row.r_multiple ? (
        <Text variant="mono">{formatR(fromCanonical(row.r_multiple as string))}</Text>
      ) : (
        <Text variant="secondary">{String(row.r_unavailable_reason ?? 'R unavailable')}</Text>
      )}
      <ButtonUi
        title="Delete trade"
        variant="secondary"
        onPress={async () => {
          await del.mutateAsync(id!);
          router.back();
        }}
        style={{ marginTop: space.xl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
    padding: space.lg,
    paddingTop: 48,
    gap: space.md,
  },
});
