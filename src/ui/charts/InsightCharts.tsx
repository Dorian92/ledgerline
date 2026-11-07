import { View, StyleSheet } from 'react-native';

import type { Summary } from '@/domain/metrics/summary';
import { fromCanonical } from '@/domain/money/canonical';
import { formatMoney, formatRatioAsPercent } from '@/domain/money/format';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export function DrawdownChart({ summary, hidden }: { summary: Summary; hidden?: boolean }) {
  const pts = summary.equity;
  if (pts.length < 2) {
    return <Text variant="secondary">Not enough data for drawdown.</Text>;
  }
  let peak = pts[0]!.e;
  const dd: number[] = [];
  for (const p of pts) {
    if (p.e.gt(peak)) peak = p.e;
    dd.push(Number(p.e.sub(peak).toString()));
  }
  const min = Math.min(...dd);
  const h = 80;
  const maxDdLabel = hidden
    ? 'Max DD hidden'
    : summary.maxDrawdownPct
      ? `Max DD ${formatRatioAsPercent(summary.maxDrawdownPct.negated(), 1)}`
      : `Max DD ${formatMoney(summary.maxDrawdownAbs, 'USD')}`;
  return (
    <View accessibilityLabel={hidden ? 'Drawdown chart hidden' : 'Drawdown chart'}>
      <View
        style={{
          height: h,
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 1,
          overflow: 'hidden',
        }}
      >
        {dd.map((v, i) => {
          const barH = min === 0 ? 0 : (v / min) * (h - 8);
          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: Math.max(2, Math.abs(barH)),
                backgroundColor: color.red,
                opacity: 0.7,
              }}
            />
          );
        })}
      </View>
      <Text variant="caption">{maxDdLabel}</Text>
    </View>
  );
}

export function RDistributionChart({
  values,
  hidden,
}: {
  values: { r: string | null }[];
  hidden?: boolean;
}) {
  const buckets = [-2, -1, 0, 1, 2, 3].map((b) => ({ b, c: 0 }));
  for (const v of values) {
    if (!v.r) continue;
    const n = Number(v.r);
    const idx = Math.min(buckets.length - 1, Math.max(0, Math.floor(n + 2)));
    buckets[idx]!.c += 1;
  }
  const max = Math.max(1, ...buckets.map((x) => x.c));
  return (
    <View
      style={{ gap: space.xs }}
      accessibilityLabel={hidden ? 'R distribution hidden' : 'R distribution'}
    >
      {buckets.map(({ b, c }) => (
        <View key={b} style={styles.histRow}>
          <Text variant="monoSmall" style={styles.histLabel}>
            {b}R
          </Text>
          <View style={styles.histTrack}>
            <View
              style={{
                height: 8,
                width: `${(c / max) * 100}%`,
                backgroundColor: color.violet,
                maxWidth: '100%',
              }}
            />
          </View>
          <Text variant="monoSmall" style={styles.histCount}>
            {hidden ? '•' : c}
          </Text>
        </View>
      ))}
    </View>
  );
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function CalendarHeatmap({
  days,
  monthLabel,
  firstWeekday,
  hidden,
}: {
  days: {
    dayKey: string;
    intensity: 0 | 1 | 2 | 3 | 4;
    net: string | null;
    sign?: 'win' | 'loss' | 'flat';
  }[];
  monthLabel?: string;
  firstWeekday?: number;
  hidden?: boolean;
}) {
  const pad = firstWeekday ?? 0;
  type Cell = (typeof days)[number];
  const cells: (Cell | null)[] = [...Array<null>(pad).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);

  const cellColor = (d: (typeof days)[0]) => {
    if (d.net === null) return color.border;
    const net = fromCanonical(d.net);
    if (net.isNegative()) {
      const shades = ['#3f1d1d', '#7f1d1d', '#b91c1c', '#dc2626', '#ef4444'];
      return shades[d.intensity] ?? shades[0]!;
    }
    const greens = [color.border, color.greenSoft, color.green, '#16a34a', '#15803d'];
    return greens[d.intensity] ?? greens[0]!;
  };

  return (
    <View accessibilityLabel={hidden ? 'Calendar hidden' : 'Calendar heatmap'}>
      {monthLabel ? (
        <Text variant="section" style={{ marginBottom: space.sm }}>
          {monthLabel}
        </Text>
      ) : null}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} variant="caption" style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((d, i) =>
          d ? (
            <View
              key={d.dayKey}
              style={[styles.cell, { backgroundColor: cellColor(d) }]}
              accessibilityLabel={
                hidden
                  ? 'Day hidden'
                  : `${d.dayKey} ${d.net ? fromCanonical(d.net).toString() : 'no trades'}`
              }
            >
              <Text variant="caption" style={styles.cellDay}>
                {d.dayKey.slice(-2)}
              </Text>
            </View>
          ) : (
            <View key={`pad-${i}`} style={styles.cellPad} />
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  histRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  histLabel: { width: 36 },
  histTrack: {
    flex: 1,
    height: 8,
    backgroundColor: color.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  histCount: { width: 24, textAlign: 'right' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  weekdayRow: { flexDirection: 'row', marginBottom: space.xs },
  weekday: { width: `${100 / 7}%`, textAlign: 'center' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    borderRadius: 4,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 44,
  },
  cellPad: { width: `${100 / 7}%`, aspectRatio: 1, maxWidth: 44 },
  cellDay: { fontSize: 10, color: color.text },
});
