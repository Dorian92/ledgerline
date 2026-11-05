import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { format } from 'date-fns';

import { useTradesList } from '@/data/queries/useTrades';
import { EmptyState, ErrorState, Fab, ScreenHeader } from '@/ui/primitives';
import { TradeRow } from '@/ui/TradeRow';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

type TradeListRow = {
  id: string;
  symbol: string;
  direction: string;
  opened_at: number;
  closed_at: number | null;
  net_pnl: string | null;
  r_multiple: string | null;
};

export default function TradesTab() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useTradesList();
  const rows = (data ?? []) as TradeListRow[];

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorState message="Could not load trades." onRetry={() => refetch()} />
      </View>
    );
  }

  if (!isLoading && rows.length === 0) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Trades" />
        <EmptyState
          title="No trades yet."
          body="Add a trade or import a CSV from Settings."
          actionLabel="Add trade"
          onAction={() => router.push('/trade/new')}
        />
        <View style={styles.fabWrap}>
          <Fab onPress={() => router.push('/trade/new')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Trades" />
      <FlashList
        data={rows}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 120 }}
        ListHeaderComponent={<Text variant="caption">{rows.length} trades</Text>}
        renderItem={({ item }: { item: TradeListRow }) => (
          <TradeRow
            symbol={item.symbol as string}
            direction={item.direction as 'long' | 'short'}
            timeLabel={format(
              new Date((item.closed_at ?? item.opened_at) as number),
              'MMM d · HH:mm',
            )}
            netPnl={(item.net_pnl as string) ?? '0'}
            rMultiple={(item.r_multiple as string) ?? null}
            onPress={() => router.push(`/trade/${item.id}`)}
          />
        )}
      />
      <View style={styles.fabWrap}>
        <Fab onPress={() => router.push('/trade/new')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg, paddingTop: 48 },
  fabWrap: { position: 'absolute', right: space.lg, bottom: 100 },
});
