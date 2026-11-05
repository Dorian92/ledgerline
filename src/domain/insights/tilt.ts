import { fromCanonical } from '@/domain/money/canonical';
import type { MetricTrade } from '@/domain/metrics/types';

export interface TiltSignal {
  id: string;
  title: string;
  detail: string;
  severity: 'info' | 'warn';
}

export function detectTilt(trades: MetricTrade[], tz: string): TiltSignal[] {
  const closed = [...trades]
    .filter((t) => t.closed_at)
    .sort((a, b) => a.closed_at - b.closed_at || a.id.localeCompare(b.id));
  const signals: TiltSignal[] = [];
  let revenge = 0;
  for (let i = 1; i < closed.length; i++) {
    const prev = closed[i - 1]!;
    const cur = closed[i]!;
    if (fromCanonical(prev.net_pnl).isNegative() && cur.opened_at - prev.closed_at < 5 * 60_000) {
      revenge += 1;
    }
  }
  if (revenge >= 3) {
    signals.push({
      id: 'revenge',
      title: 'Quick re-entries after losses',
      detail: `${revenge} trades opened within 5 minutes of a loss.`,
      severity: 'warn',
    });
  }
  const byHour = new Map<number, { w: number; l: number }>();
  for (const t of closed) {
    const h = new Date(t.opened_at).getUTCHours();
    const slot = byHour.get(h) ?? { w: 0, l: 0 };
    const net = fromCanonical(t.net_pnl);
    if (net.isPositive()) slot.w += 1;
    else if (net.isNegative()) slot.l += 1;
    byHour.set(h, slot);
  }
  let lateLosses = 0;
  let lateTotal = 0;
  for (const [h, s] of byHour) {
    if (h >= 22 || h <= 2) {
      lateTotal += s.w + s.l;
      lateLosses += s.l;
    }
  }
  if (lateTotal >= 5 && lateLosses / lateTotal > 0.6) {
    signals.push({
      id: 'late',
      title: 'Weaker results late at night',
      detail: 'Loss rate after 22:00 is elevated in your journal.',
      severity: 'info',
    });
  }
  void tz;
  const fomo = closed.filter((t) => t.emotion === 'fomo').length;
  if (fomo >= 5) {
    signals.push({
      id: 'fomo',
      title: 'FOMO-tagged trades',
      detail: `${fomo} trades tagged FOMO — review sizing on those entries.`,
      severity: 'info',
    });
  }
  return signals;
}
