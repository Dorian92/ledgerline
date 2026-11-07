import { useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHistory, useUndoDeleteTrade } from '@/data/queries/useHistory';
import { useDeleteTrade } from '@/data/queries/useTrades';
import { useRepos } from '@/data/DbProvider';
import type { HistoryFilter } from '@/domain/metrics/history';
import { fromCanonical } from '@/domain/money/canonical';
import { formatMoney } from '@/domain/money/format';
import { FilterSheet } from '@/features/trades/FilterSheet';
import { useSession } from '@/state/session';
import { usePrivacy } from '@/state/privacy';
import { TradeRow } from '@/ui/TradeRow';
import { Text } from '@/ui/Text';
import { Pill } from '@/ui/Pill';
import { EmptyState, ErrorState, Fab, ScreenHeader } from '@/ui/primitives';
import { color, space } from '@/ui/tokens';

export default function TradesScreen() {
  const router = useRouter();
  const mode = useSession((s) => s.mode);
  const repos = useRepos();
  const hideAmounts = usePrivacy((s) => s.hideAmounts);
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<HistoryFilter>({});
  const activeFilter = useMemo(
    () => ({ ...filter, text: text.trim() || undefined }),
    [filter, text],
  );
  const { sections, isLoading, error, refetch, tradeCount } = useHistory(activeFilter);
  const del = useDeleteTrade();
  const undo = useUndoDeleteTrade();
  const [pendingUndo, setPendingUndo] = useState<{
    row: NonNullable<Awaited<ReturnType<typeof repos.trades.get>>>;
    tagIds: string[];
  } | null>(null);

  const stickyHeaderIndices = sections
    .map((s, i) => (s.kind === 'header' ? i : -1))
    .filter((i) => i >= 0);

  const hasActiveFilter =
    !!text.trim() ||
    !!filter.direction ||
    !!filter.outcome ||
    !!filter.source ||
    Object.keys(filter).length > 0;
  const noMatches = !isLoading && tradeCount > 0 && sections.length === 0 && hasActiveFilter;

  const onDelete = async (id: string) => {
    const row = await repos.trades.get(id);
    const tagIds = await repos.trades.getTagIds(id);
    await del.mutateAsync(id);
    setPendingUndo({ row: row as NonNullable<typeof row>, tagIds });
    setTimeout(() => setPendingUndo(null), 5000);
  };

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorState message="Could not load trades." onRetry={() => refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: space.lg }}>
        <ScreenHeader
          title="Trades"
          right={mode === 'demo' ? <Pill label="DEMO DATA" variant="demo" /> : undefined}
        />
        <TextInput
          placeholder="Search symbol or notes"
          placeholderTextColor={color.textMuted}
          value={text}
          onChangeText={setText}
          style={styles.search}
          accessibilityLabel="Search trades"
        />
        <View style={styles.chips}>
          <Chip
            label="All"
            active={!filter.outcome && !filter.direction}
            onPress={() => setFilter({})}
          />
          <Chip
            label="Losers"
            active={filter.outcome === 'loss'}
            onPress={() => setFilter({ outcome: 'loss' })}
          />
          <Chip label="Filters" active={filterOpen} onPress={() => setFilterOpen(true)} />
        </View>
      </View>
      <FilterSheet
        visible={filterOpen}
        initial={filter}
        onClose={() => setFilterOpen(false)}
        onApply={(f) => {
          setFilter(f);
          setFilterOpen(false);
        }}
      />
      {pendingUndo ? (
        <Pressable
          style={styles.snack}
          onPress={async () => {
            await undo.mutateAsync(pendingUndo);
            setPendingUndo(null);
          }}
          accessibilityRole="button"
        >
          <Text style={{ color: color.text }}>Trade deleted · Undo</Text>
        </Pressable>
      ) : null}
      {noMatches ? (
        <EmptyState
          title="No matching trades"
          body="Try another search term or clear filters."
          actionLabel="Clear search"
          onAction={() => {
            setText('');
            setFilter({});
          }}
        />
      ) : !isLoading && sections.length === 0 ? (
        <EmptyState title="No trades yet." body="Add a trade or import from Settings." />
      ) : (
        <FlashList
          data={sections}
          stickyHeaderIndices={stickyHeaderIndices}
          contentContainerStyle={{
            paddingHorizontal: space.lg,
            paddingBottom: insets.bottom + 120,
          }}
          renderItem={({ item }) => {
            if (item.kind === 'header') {
              const net = fromCanonical(item.net);
              return (
                <View style={styles.headerRow}>
                  <Text variant="section">{item.label}</Text>
                  <Text
                    variant="monoSmall"
                    style={{
                      color: hideAmounts
                        ? color.textMuted
                        : net.isNegative()
                          ? color.red
                          : net.isPositive()
                            ? color.green
                            : color.text,
                    }}
                  >
                    {formatMoney(net, 'USD', { sign: 'always', hidden: hideAmounts })}
                  </Text>
                </View>
              );
            }
            const t = item.trade;
            return (
              <TradeRow
                symbol={t.symbol}
                direction={t.direction}
                timeLabel={format(new Date(t.closed_at ?? t.opened_at), 'HH:mm')}
                netPnl={t.net_pnl ?? '0'}
                rMultiple={t.r_multiple}
                hidden={hideAmounts}
                onPress={() => router.push(`/trade/${t.id}`)}
                onLongPress={() => onDelete(t.id)}
              />
            );
          }}
        />
      )}
      <View style={[styles.fabWrap, { bottom: insets.bottom + 88 }]}>
        <Fab onPress={() => router.push('/trade/new')} />
      </View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && { borderColor: color.violet }]}
      accessibilityRole="button"
    >
      <Text variant="caption" style={{ textTransform: 'none' }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  search: {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 12,
    padding: space.md,
    color: color.text,
    marginBottom: space.sm,
    minHeight: 48,
  },
  chips: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 999,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    minHeight: 48,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.sm,
    backgroundColor: color.bg,
  },
  snack: {
    backgroundColor: color.card,
    marginHorizontal: space.lg,
    padding: space.md,
    borderRadius: 12,
    marginBottom: space.sm,
  },
  fabWrap: { position: 'absolute', right: space.lg },
});
