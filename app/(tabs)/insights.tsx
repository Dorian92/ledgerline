import { ScrollView, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { useRepos } from '@/data/DbProvider';
import { calendarMonth, computeSummary, hourOfDay, periodRange } from '@/domain/metrics';
import { dec } from '@/domain/money/dec';
import { detectTilt } from '@/domain/insights/tilt';
import { ProGate, usePro } from '@/state/pro';
import { EquityChart } from '@/ui/charts/EquityChart';
import { CalendarHeatmap, DrawdownChart, RDistributionChart } from '@/ui/charts/InsightCharts';
import { useSession } from '@/state/session';
import { ButtonUi } from '@/ui/Button';
import { ScreenHeader } from '@/ui/primitives';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';
import { resolveDisplayTz, usePrivacy } from '@/state/privacy';

function InsightsBody() {
  const repos = useRepos();
  const displayPref = usePrivacy((s) => s.displayTz);
  const accountId = useSession((s) => s.activeAccountId);
  const { data } = useQuery({
    queryKey: ['insights', accountId, displayPref],
    enabled: !!accountId,
    queryFn: async () => {
      const rows = await repos.trades.listClosedForMetrics(accountId!);
      const account = await repos.accounts.get(accountId!);
      const now = Date.now();
      const tz = resolveDisplayTz(displayPref);
      const summary = computeSummary(rows as never, periodRange('ALL', now, tz), {
        startingBalance: account?.starting_balance ? dec(account.starting_balance) : null,
      });
      const cal = calendarMonth(
        rows as never,
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        tz,
      );
      return {
        summary,
        hours: hourOfDay(rows as never, tz),
        cal,
        tilt: detectTilt(rows as never, tz),
        rows,
      };
    },
  });

  const calDays = data?.cal.days.map((d) => ({
    dayKey: d.dayKey,
    intensity: d.intensity,
    net: d.net?.toString() ?? null,
  }));

  return (
    <>
      {data?.tilt.map((t) => (
        <View key={t.id} style={styles.banner}>
          <Text variant="section">{t.title}</Text>
          <Text variant="secondary">{t.detail}</Text>
        </View>
      ))}
      <Text variant="caption">EQUITY</Text>
      <EquityChart points={data?.summary.equity ?? []} height={120} />
      <Text variant="caption" style={{ marginTop: space.lg }}>
        DRAWDOWN
      </Text>
      {data?.summary ? <DrawdownChart summary={data.summary} /> : null}
      <Text variant="caption" style={{ marginTop: space.lg }}>
        R DISTRIBUTION
      </Text>
      <RDistributionChart
        values={
          (data?.rows as { r_multiple: string | null }[] | undefined)?.map((r) => ({
            r: r.r_multiple ?? null,
          })) ?? []
        }
      />
      <Text variant="caption" style={{ marginTop: space.lg }}>
        CALENDAR
      </Text>
      <CalendarHeatmap days={calDays ?? []} />
    </>
  );
}

export default function InsightsTab() {
  const mockPurchase = usePro((s) => s.mockPurchase);
  const repos = useRepos();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ScreenHeader title="Insights" />
      <ProGate
        fallback={
          <View style={styles.paywall}>
            <Text variant="secondary">Insights charts are part of Ledgerline Pro.</Text>
            <ButtonUi title="Mock purchase" onPress={() => mockPurchase(repos)} />
          </View>
        }
      >
        <InsightsBody />
      </ProGate>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: space.lg,
    paddingTop: 48,
    paddingBottom: 120,
    backgroundColor: color.bg,
    gap: space.sm,
  },
  banner: {
    backgroundColor: color.card,
    padding: space.md,
    borderRadius: 12,
    marginBottom: space.sm,
  },
  paywall: { gap: space.md, paddingVertical: space.xl },
});
