import { ScrollView, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { useRepos } from '@/data/DbProvider';
import { hourOfDay, calendarMonth, computeSummary, periodRange } from '@/domain/metrics';
import { detectTilt } from '@/domain/insights/tilt';
import { EquityChart } from '@/ui/charts/EquityChart';
import { useSession } from '@/state/session';
import { ScreenHeader } from '@/ui/primitives';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';
import { dec } from '@/domain/money/dec';

export default function InsightsTab() {
  const repos = useRepos();
  const accountId = useSession((s) => s.activeAccountId);
  const { data } = useQuery({
    queryKey: ['insights', accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const rows = await repos.trades.listClosedForMetrics(accountId!);
      const tz = 'UTC';
      const summary = computeSummary(rows as never, periodRange('ALL', Date.now(), tz), {
        startingBalance: dec('10000'),
      });
      return {
        summary,
        hours: hourOfDay(rows as never, tz),
        cal: calendarMonth(rows as never, 2026, 10, tz),
        tilt: detectTilt(rows as never, tz),
      };
    },
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ScreenHeader title="Insights" />
      {data?.tilt.map((t) => (
        <View key={t.id} style={styles.banner}>
          <Text variant="section">{t.title}</Text>
          <Text variant="secondary">{t.detail}</Text>
        </View>
      ))}
      <Text variant="caption">EQUITY</Text>
      <EquityChart points={data?.summary.equity ?? []} height={120} />
      <Text variant="caption" style={{ marginTop: space.lg }}>
        HOUR OF DAY (opened)
      </Text>
      {data?.hours
        .filter((h) => h.count > 0)
        .slice(0, 6)
        .map((h) => (
          <Text key={h.hour} variant="monoSmall">
            {h.hour}:00 · {h.count} trades · net {h.net.toFixed(2)}
          </Text>
        ))}
      <Text variant="caption" style={{ marginTop: space.lg }}>
        CALENDAR · OCT 2026
      </Text>
      <Text variant="secondary">{data?.cal.total.toFixed(2)} net</Text>
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
});
