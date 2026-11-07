import { Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

import { useRepos } from '@/data/DbProvider';
import { useDeleteTrade } from '@/data/queries/useTrades';
import { fromCanonical } from '@/domain/money/canonical';
import { formatMoney, formatPriceForDisplay, formatR } from '@/domain/money/format';
import { usePrivacy } from '@/state/privacy';
import { Money } from '@/ui/Money';
import { ButtonUi } from '@/ui/Button';
import { NavScreen } from '@/ui/NavScreen';
import { Text } from '@/ui/Text';
import { Pill } from '@/ui/Pill';
import { Card } from '@/ui/Card';
import { space } from '@/ui/tokens';

export default function TradeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const repos = useRepos();
  const router = useRouter();
  const del = useDeleteTrade();
  const hideAmounts = usePrivacy((s) => s.hideAmounts);
  const { data: row } = useQuery({
    queryKey: ['trade', id],
    queryFn: () => repos.trades.get(id!) as Promise<Record<string, unknown> | null>,
    enabled: !!id,
  });

  if (!row) {
    return (
      <NavScreen title="Trade">
        <Text variant="secondary">Loading…</Text>
      </NavScreen>
    );
  }

  const net = row.net_pnl ? fromCanonical(row.net_pnl as string) : null;

  const confirmDelete = () => {
    Alert.alert('Delete trade?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await del.mutateAsync(id!);
          router.back();
        },
      },
    ]);
  };

  const Row = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.row}>
      <Text variant="caption">{label}</Text>
      <Text variant="mono">{hideAmounts && value.includes('$') ? '••••' : value}</Text>
    </View>
  );

  return (
    <NavScreen
      title={row.symbol as string}
      right={
        <Pill
          label={(row.direction as string).toUpperCase()}
          variant={row.direction === 'long' ? 'long' : 'short'}
        />
      }
      scroll
    >
      {net ? <Money amount={net} currency="USD" variant="hero" hidden={hideAmounts} /> : null}
      {row.r_multiple ? (
        <Text variant="mono">{formatR(fromCanonical(row.r_multiple as string))}</Text>
      ) : (
        <Text variant="secondary">{String(row.r_unavailable_reason ?? 'R unavailable')}</Text>
      )}
      <Card style={{ marginTop: space.lg, gap: space.sm }}>
        <Row
          label="ENTRY"
          value={formatPriceForDisplay(fromCanonical(row.entry_price as string))}
        />
        <Row
          label="EXIT"
          value={
            row.exit_price ? formatPriceForDisplay(fromCanonical(row.exit_price as string)) : '—'
          }
        />
        <Row label="SIZE" value={formatPriceForDisplay(fromCanonical(row.quantity as string))} />
        <Row
          label="FEES"
          value={formatMoney(fromCanonical(row.fees as string), 'USD', { hidden: hideAmounts })}
        />
        <Row
          label="OPENED"
          value={format(new Date(row.opened_at as number), 'MMM d, yyyy HH:mm')}
        />
        <Row
          label="CLOSED"
          value={
            row.closed_at ? format(new Date(row.closed_at as number), 'MMM d, yyyy HH:mm') : 'Open'
          }
        />
        {row.emotion ? <Row label="EMOTION" value={String(row.emotion)} /> : null}
        {row.notes ? <Row label="NOTES" value={String(row.notes)} /> : null}
      </Card>
      <ButtonUi
        title="Edit trade"
        onPress={() => router.push(`/trade/${id}/edit`)}
        style={{ marginTop: space.lg }}
      />
      <ButtonUi
        title="Delete trade"
        variant="destructive"
        onPress={confirmDelete}
        style={{ marginTop: space.md }}
      />
    </NavScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40,
  },
});
