import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDashboard } from '@/data/queries/useDashboard';
import { formatR } from '@/domain/money/format';
import { EquityChart } from '@/ui/charts/EquityChart';
import { toDashboardViewModel } from '@/features/dashboard/viewModel';
import { CaveatSheet } from '@/features/dashboard/CaveatSheet';
import { useSession } from '@/state/session';
import { usePrivacy } from '@/state/privacy';
import { DemoSheet } from '@/features/demo/DemoSheet';
import { Money } from '@/ui/Money';
import { Text } from '@/ui/Text';
import { TradeRow } from '@/ui/TradeRow';
import { Card } from '@/ui/Card';
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
  const accountId = useSession((s) => s.activeAccountId);
  const { data, isLoading, error, refetch } = useDashboard(period);
  const mode = useSession((s) => s.mode);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const vm = data?.summary
    ? toDashboardViewModel(data.summary, 'USD', { hidden: hideAmounts })
    : null;

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorState message="Could not load dashboard." onRetry={() => refetch()} />
      </View>
    );
  }

  if (mode === 'real' && !accountId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + space.lg }]}>
        <ScreenHeader title="Dashboard" />
        <EmptyState
          title="No journal yet"
          body="Create an account to track real trades, or keep exploring demo data."
          actionLabel="Create journal"
          onAction={() => router.push('/(onboarding)/create-account')}
        />
        <Pressable
          onPress={() => router.replace('/(onboarding)/welcome')}
          style={{ minHeight: 48, justifyContent: 'center' }}
          accessibilityRole="button"
        >
          <Text style={{ color: color.violet }}>Explore demo</Text>
        </Pressable>
      </View>
    );
  }

  if (!isLoading && data && data.summary.tradeCount === 0 && mode === 'real') {
    return (
      <View style={[styles.container, { paddingTop: insets.top + space.lg }]}>
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
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + 168 },
        ]}
      >
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
        {s ? (
          <>
            <Text variant="caption">NET PNL · {period}</Text>
            <Pressable
              onLongPress={() => setHideAmounts(!hideAmounts)}
              accessibilityRole="button"
              accessibilityHint="Long press to hide or show amounts"
            >
              <Money amount={s.netPnl} currency="USD" variant="hero" hidden={hideAmounts} />
            </Pressable>
            <View style={styles.periodRow}>
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
            </View>
            <Pressable onPress={() => setCaveatOpen(true)} accessibilityRole="button">
              <Text variant="secondary">{vm?.subline} · About stats</Text>
            </Pressable>
            <View style={styles.tiles}>
              <StatTile label="WIN RATE" value={vm?.winRate ?? '—'} />
              <StatTile label="AVG R" value={s.avgR ? formatR(s.avgR) : '—'} />
              <StatTile label="MAX DD" value={vm?.maxDd ?? '—'} />
            </View>
            <Card style={{ marginTop: space.lg }}>
              <Text variant="caption">EQUITY CURVE</Text>
              <Text variant="secondary">{vm?.equityRange}</Text>
              <EquityChart points={s.equity} hidden={hideAmounts} />
            </Card>
            <Card style={{ marginTop: space.lg }}>
              <View style={styles.recentHeader}>
                <Text variant="caption">RECENT</Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/trades')}
                  accessibilityRole="button"
                  style={{ minHeight: 48, justifyContent: 'center' }}
                >
                  <Text variant="secondary" style={{ color: color.violet }}>
                    See all
                  </Text>
                </Pressable>
              </View>
              {data?.recent?.map((t) => (
                <TradeRow
                  key={t.id as string}
                  symbol={t.symbol as string}
                  direction={t.direction as 'long' | 'short'}
                  timeLabel={format(new Date(t.closed_at as number), 'MMM d · HH:mm')}
                  netPnl={t.net_pnl as string}
                  rMultiple={(t.r_multiple as string) ?? null}
                  hidden={hideAmounts}
                  reserveFabSpace
                  onPress={() => router.push(`/trade/${t.id}`)}
                />
              ))}
            </Card>
          </>
        ) : isLoading ? (
          <Text variant="secondary">Loading dashboard…</Text>
        ) : null}
      </ScrollView>
      <DemoSheet visible={demoOpen} onClose={() => setDemoOpen(false)} />
      {s ? (
        <CaveatSheet visible={caveatOpen} onClose={() => setCaveatOpen(false)} summary={s} />
      ) : null}
      <View style={[styles.fabWrap, { bottom: insets.bottom + 88 }]}>
        <Fab testID="fab-add" onPress={() => router.push('/trade/new')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  scroll: { paddingHorizontal: space.lg },
  periodRow: { marginTop: space.md },
  tiles: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  fabWrap: { position: 'absolute', right: space.lg },
});
