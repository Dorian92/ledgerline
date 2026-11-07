import Svg, { Defs, LinearGradient, Stop, Path, Line } from 'react-native-svg';

import { downsampleEquity } from '@/domain/metrics';
import type { Dec } from '@/domain/money/dec';
import { color } from '@/ui/tokens';

import { buildEquityPath } from './paths';

const W = 320;
const H = 140;
const PAD = { top: 12, right: 8, bottom: 20, left: 8 };

export function EquityChart({
  points,
  height = H,
  hidden,
}: {
  points: { t: number; e: Dec }[];
  height?: number;
  hidden?: boolean;
}) {
  const sampled = downsampleEquity(points, 120);
  const built = buildEquityPath(sampled, W, height, PAD);
  const end = sampled[sampled.length - 1]?.e;
  const start = sampled[0]?.e;
  const up = end && start ? end.gte(start) : true;
  const stroke = up ? color.green : color.red;

  if (!built || sampled.length < 2) {
    return (
      <Svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`}>
        <Line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={height / 2}
          y2={height / 2}
          stroke={color.border}
          strokeDasharray="4 4"
        />
      </Svg>
    );
  }

  return (
    <Svg
      width="100%"
      height={height}
      viewBox={`0 0 ${W} ${height}`}
      accessibilityLabel={hidden ? 'Equity curve hidden' : 'Equity curve'}
    >
      <Defs>
        <LinearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={stroke} stopOpacity="0.35" />
          <Stop offset="1" stopColor={stroke} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <Line
          key={f}
          x1={PAD.left}
          x2={W - PAD.right}
          y1={PAD.top + (height - PAD.top - PAD.bottom) * f}
          y2={PAD.top + (height - PAD.top - PAD.bottom) * f}
          stroke={color.border}
          strokeDasharray="3 5"
          opacity={0.5}
        />
      ))}
      <Path d={built.area} fill="url(#eqFill)" />
      <Path d={built.line} stroke={stroke} strokeWidth={2} fill="none" />
    </Svg>
  );
}
