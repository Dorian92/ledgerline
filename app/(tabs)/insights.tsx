import { ScrollView, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';

import { useRepos } from '@/data/DbProvider';
import { calendarMonth, computeSummary, hourOfDay, periodRange } from '@/domain/metrics';
import { dec } from '@/domain/money/dec';
import { detectTilt } from '@/domain/insights/tilt';
import { ProGate, usePro } from '@/state/pro';
import { EquityChart } from '@/ui/charts/EquityChart';
import { CalendarHeatmap, DrawdownChart, RDistributionChart } from '@/ui/charts/InsightCharts';
import { useSession } from '@/state/session';
import { resolveDisplayTz, usePrivacy } from '@/state/privacy';
import { ButtonUi } from '@/ui/Button';
import { ScreenHeader } from '@/ui/primitives';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

function InsightsBody() {
  const repos = useRepos();
  const displayPref = usePrivacy((s) => s.displayTz);
  const hideAmounts = usePrivacy((s) => s.hideAmounts);
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
      const nowDate = new Date();
      const cal = calendarMonth(rows as never, nowDate.getFullYear(), nowDate.getMonth() + 1, tz);
      return {
        summary,
        hours: hourOfDay(rows as never, tz),
        cal,
        tilt: detectTilt(rows as never, tz),
        rows,
      };
    },
  });

  const monthLabel = data ? format(new Date(), 'MMMM yyyy') : '';

  return (
    <>
      {data?.tilt.map((t) => (
        <View key={t.id} style={styles.banner}>
          <Text variant="section">{t.title}</Text>
          <Text variant="secondary">{t.detail}</Text>
        </View>
      ))}
      <Text variant="caption">EQUITY</Text>
      <EquityChart points={data?.summary.equity ?? []} height={120} hidden={hideAmounts} />
      <Text variant="caption" style={{ marginTop: space.lg }}>
        DRAWDOWN
      </Text>
      {data?.summary ? <DrawdownChart summary={data.summary} hidden={hideAmounts} /> : null}
      <Text variant="caption" style={{ marginTop: space.lg }}>
        R DISTRIBUTION
      </Text>
      <RDistributionChart
        hidden={hideAmounts}
        values={
          (data?.rows as { r_multiple: string | null }[] | undefined)?.map((r) => ({
            r: r.r_multiple ?? null,
          })) ?? []
        }
      />
      <Text variant="caption" style={{ marginTop: space.lg }}>
        CALENDAR
      </Text>
      <CalendarHeatmap
        days={(data?.cal.days ?? []).map((d) => ({
          ...d,
          sign: d.sign ?? undefined,
        }))}
        monthLabel={monthLabel}
        firstWeekday={data?.cal.firstWeekday}
        hidden={hideAmounts}
      />
    </>
  );
}

export default function InsightsTab() {
  const mockPurchase = usePro((s) => s.mockPurchase);
  const repos = useRepos();
  const insets = useSafeAreaInsets();
  const hideAmounts = usePrivacy((s) => s.hideAmounts);
  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + 100 },
      ]}
    >
      <ScreenHeader title="Insights" />
      <ProGate
        fallback={
          <View style={styles.paywall}>
            <Text variant="secondary">Insights charts are part of Ledgerline Pro.</Text>
            {__DEV__ ? (
              <ButtonUi title="Unlock Pro (dev mock)" onPress={() => mockPurchase(repos)} />
            ) : (
              <Text variant="secondary">Play Billing is not enabled in this build.</Text>
            )}
          </View>
        }
      >
        <InsightsBody />
        {hideAmounts ? (
          <Text variant="caption" style={{ marginTop: space.md }}>
            Amounts hidden — charts show shape only.
          </Text>
        ) : null}
      </ProGate>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: space.lg,
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
