import type { Dec } from '@/domain/money/dec';

export interface ChartPoint {
  t: number;
  e: Dec;
}

export function buildEquityPath(
  points: ChartPoint[],
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number },
): { line: string; area: string; minY: number; maxY: number } | null {
  if (points.length === 0) {
    return null;
  }
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const values = points.map((p) => Number(p.e.toString()));
  let minY = Math.min(...values);
  let maxY = Math.max(...values);
  if (minY === maxY) {
    minY -= 1;
    maxY += 1;
  }
  const mapX = (i: number) =>
    padding.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const mapY = (v: number) => padding.top + innerH - ((v - minY) / (maxY - minY)) * innerH;
  const coords = points.map((p, i) => `${mapX(i)},${mapY(Number(p.e.toString()))}`);
  const line = `M ${coords.join(' L ')}`;
  const area = `${line} L ${mapX(points.length - 1)},${padding.top + innerH} L ${mapX(0)},${padding.top + innerH} Z`;
  return { line, area, minY, maxY };
}
