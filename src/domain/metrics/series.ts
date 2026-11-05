import type { Dec } from '@/domain/money/dec';

export function downsampleEquity(
  points: { t: number; e: Dec }[],
  maxPoints = 120,
): { t: number; e: Dec }[] {
  if (points.length <= maxPoints) {
    return points;
  }
  const out: { t: number; e: Dec }[] = [points[0]!];
  const step = Math.ceil((points.length - 2) / (maxPoints - 2));
  for (let i = 1; i < points.length - 1; i += step) {
    out.push(points[i]!);
  }
  out.push(points[points.length - 1]!);
  return out;
}
