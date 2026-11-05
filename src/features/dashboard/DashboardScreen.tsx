import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { format } from 'date-fns';

import { useDashboard } from '@/data/queries/useDashboard';
import { formatPercent, formatR } from '@/domain/money/format';
import { EquityChart } from '@/ui/charts/EquityChart';
import { toDashboardViewModel } from '@/features/dashboard/viewModel';
import { CaveatSheet } from '@/features/dashboard/CaveatSheet';
import { useSession } from '@/state/session';
import { usePrivacy } from '@/state/privacy';
import { DemoSheet } from '@/features/demo/DemoSheet';
import { Money } from '@/ui/Money';
import { Text } from '@/ui/Text';
import { TradeRow } from '@/ui/TradeRow';
import { EmptyState, ErrorState, Fab, ScreenHeader, Segmented, StatTile } from '@/ui/primitives';
import { Pill } from '@/ui/Pill';
import { color, space } from '@/ui/tokens';
import type { PeriodKey } from '@/domain/metrics';

export default function DashboardScreen() {
  const [period, setPeriod] = useState<PeriodKey>('30D');
  const [demoOpen, setDemoOpen] = useState(false);
  const [caveatOpen, setCaveatOpen] = useState(false);
  const hideAmounts = usePrivacy((s) => s.hideAmounts);
  const setHideAmounts = usePrivacy((s) => s.setHideAmounts);
  const { data, isLoading, error, refetch } = useDashboard(period);
  const mode = useSession((s) => s.mode);
  const router = useRouter();

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorState message="Could not load dashboard." onRetry={() => refetch()} />
      </View>
    );
  }

  if (!isLoading && data && data.summary.tradeCount === 0 && mode === 'real') {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Dashboard" />
        <EmptyState
          title="No closed trades yet"
          body="Add a trade or import a CSV from Settings."
          actionLabel="Add a trade"
          onAction={() => router.push('/trade/new')}
        />
      </View>
    );
  }

  const s = data?.summary;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader
          eyebrow={data?.account?.name ?? 'Ledgerline'}
          title="Dashboard"
          right={
            mode === 'demo' ? (
              <Pressable onPress={() => setDemoOpen(true)} accessibilityRole="button">
                <Pill label="DEMO DATA" variant="demo" />
              </Pressable>
            ) : undefined
          }
        />
        <Segmented
          options={[
            { value: '7D', label: '7D' },
            { value: '30D', label: '30D' },
            { value: 'YTD', label: 'YTD' },
            { value: 'ALL', label: 'ALL' },
          ]}
          value={period}
          onChange={setPeriod}
        />
        {s ? (
          <>
            <Text variant="caption" style={{ marginTop: space.lg }}>
              NET PNL · {period}
            </Text>
            <Pressable
              onLongPress={() => setHideAmounts(!hideAmounts)}
              accessibilityRole="button"
              accessibilityHint="Long press to hide or show amounts"
            >
              <Money amount={s.netPnl} currency="USD" variant="hero" hidden={hideAmounts} />
            </Pressable>
            <Pressable onPress={() => setCaveatOpen(true)} accessibilityRole="button">
              <Text variant="secondary">
                {toDashboardViewModel(s, 'USD').subline} · About stats
              </Text>
            </Pressable>
            <View style={styles.tiles}>
              <StatTile label="WIN RATE" value={s.winRate ? formatPercent(s.winRate, 1) : '—'} />
              <StatTile label="AVG R" value={s.avgR ? formatR(s.avgR) : '—'} />
              <StatTile
                label="MAX DD"
                value={
                  s.maxDrawdownPct
                    ? formatPercent(s.maxDrawdownPct.negated(), 1)
                    : s.maxDrawdownAbs.toFixed(2)
                }
              />
            </View>
            <Text variant="caption" style={{ marginTop: space.xl }}>
              EQUITY CURVE
            </Text>
            <Text variant="secondary">{toDashboardViewModel(s, 'USD').equityRange}</Text>
            <EquityChart points={s.equity} />
            <Text variant="caption" style={{ marginTop: space.lg }}>
              RECENT
            </Text>
            {data?.recent?.map((t) => (
              <TradeRow
                key={t.id as string}
                symbol={t.symbol as string}
                direction={t.direction as 'long' | 'short'}
                timeLabel={format(new Date(t.closed_at as number), 'MMM d · HH:mm')}
                netPnl={t.net_pnl as string}
                rMultiple={(t.r_multiple as string) ?? null}
                onPress={() => router.push(`/trade/${t.id}`)}
              />
            ))}
          </>
        ) : isLoading ? (
          <Text variant="secondary">Loading dashboard…</Text>
        ) : null}
      </ScrollView>
      <DemoSheet visible={demoOpen} onClose={() => setDemoOpen(false)} />
      {s ? (
        <CaveatSheet visible={caveatOpen} onClose={() => setCaveatOpen(false)} summary={s} />
      ) : null}
      <View style={styles.fabWrap}>
        <Fab testID="fab-add" onPress={() => router.push('/trade/new')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  scroll: { padding: space.lg, paddingTop: 48, paddingBottom: 120 },
  tiles: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  fabWrap: { position: 'absolute', right: space.lg, bottom: 100 },
});
