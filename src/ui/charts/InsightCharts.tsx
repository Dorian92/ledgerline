import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import type { Summary } from '@/domain/metrics/summary';
import { Text } from '@/ui/Text';
import { color, space } from '@/ui/tokens';

export function DrawdownChart({ summary }: { summary: Summary }) {
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
  const w = 300;
  const h = 80;
  return (
    <View accessibilityLabel="Drawdown chart">
      <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
        {dd.map((v, i) => {
          const barH = min === 0 ? 0 : (v / min) * (h - 8);
          const x = (i / (dd.length - 1)) * (w - 4);
          return (
            <Rect
              key={i}
              x={x}
              y={h - barH}
              width={Math.max(2, w / dd.length - 1)}
              height={Math.abs(barH)}
              fill={color.red}
              opacity={0.7}
            />
          );
        })}
      </Svg>
      <Text variant="caption">Max DD {summary.maxDrawdownAbs.toFixed(2)}</Text>
    </View>
  );
}

export function RDistributionChart({ values }: { values: { r: string | null }[] }) {
  const buckets = [-2, -1, 0, 1, 2, 3].map((b) => ({ b, c: 0 }));
  for (const v of values) {
    if (!v.r) continue;
    const n = Number(v.r);
    const idx = Math.min(buckets.length - 1, Math.max(0, Math.floor(n + 2)));
    buckets[idx]!.c += 1;
  }
  const max = Math.max(1, ...buckets.map((x) => x.c));
  return (
    <View style={{ gap: space.xs }} accessibilityLabel="R distribution">
      {buckets.map(({ b, c }) => (
        <View key={b} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Text variant="monoSmall" style={{ width: 36 }}>
            {b}R
          </Text>
          <View
            style={{
              height: 8,
              width: `${(c / max) * 100}%`,
              backgroundColor: color.violet,
              minWidth: c ? 4 : 0,
            }}
          />
          <Text variant="monoSmall">{c}</Text>
        </View>
      ))}
    </View>
  );
}

export function CalendarHeatmap({
  days,
}: {
  days: { dayKey: string; intensity: 0 | 1 | 2 | 3 | 4; net: string | null }[];
}) {
  const colors = [color.border, color.greenSoft, color.green, '#16a34a', '#15803d'];
  return (
    <View style={styles.grid} accessibilityLabel="Calendar heatmap">
      {days.slice(0, 35).map((d) => (
        <View
          key={d.dayKey}
          style={[styles.cell, { backgroundColor: colors[d.intensity] }]}
          accessibilityLabel={`${d.dayKey} ${d.net ?? 'no trades'}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, maxWidth: 280 },
  cell: { width: 14, height: 14, borderRadius: 2 },
});
