import { add, div, ZERO, type Dec } from '@/domain/money/dec';
import { fromCanonical, toCanonical } from '@/domain/money/canonical';
import { classifyOutcome } from '@/domain/trade/compute';
import { localDayKey, localHour, type DayKey } from '@/domain/time/tz';

import type { MetricTrade } from './types';

export function dailyPnl(
  trades: MetricTrade[],
  tz: string,
): Map<DayKey, { net: Dec; count: number; wins: number; losses: number }> {
  const map = new Map<DayKey, { net: Dec; count: number; wins: number; losses: number }>();
  for (const t of trades) {
    const day = localDayKey(t.closed_at, tz);
    const net = fromCanonical(t.net_pnl);
    const cur = map.get(day) ?? { net: ZERO, count: 0, wins: 0, losses: 0 };
    cur.net = add(cur.net, net);
    cur.count += 1;
    const o = classifyOutcome(net);
    if (o === 'win') {
      cur.wins += 1;
    } else if (o === 'loss') {
      cur.losses += 1;
    }
    map.set(day, cur);
  }
  return map;
}

export function hourOfDay(trades: MetricTrade[], tz: string) {
  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour: hour as
      | 0
      | 1
      | 2
      | 3
      | 4
      | 5
      | 6
      | 7
      | 8
      | 9
      | 10
      | 11
      | 12
      | 13
      | 14
      | 15
      | 16
      | 17
      | 18
      | 19
      | 20
      | 21
      | 22
      | 23,
    count: 0,
    wins: 0,
    losses: 0,
    net: ZERO,
    winRate: null as Dec | null,
  }));
  for (const t of trades) {
    const h = localHour(t.opened_at, tz);
    const slot = hours[h]!;
    const net = fromCanonical(t.net_pnl);
    slot.count += 1;
    slot.net = add(slot.net, net);
    const o = classifyOutcome(net);
    if (o === 'win') {
      slot.wins += 1;
    } else if (o === 'loss') {
      slot.losses += 1;
    }
  }
  for (const slot of hours) {
    const d = slot.wins + slot.losses;
    slot.winRate = d > 0 ? div(fromCanonical(String(slot.wins)), fromCanonical(String(d))) : null;
  }
  return hours;
}

export function calendarMonth(trades: MetricTrade[], year: number, month: number, tz: string) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const daily = dailyPnl(trades, tz);
  let maxAbs = ZERO;
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayKey =
      `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}` as DayKey;
    const row = daily.get(dayKey);
    const net = row?.net ?? null;
    if (net && net.abs().gt(maxAbs)) {
      maxAbs = net.abs();
    }
    const sign =
      net === null
        ? null
        : net.isZero()
          ? ('flat' as const)
          : net.isPositive()
            ? ('win' as const)
            : ('loss' as const);
    days.push({
      dayKey,
      net: net === null ? null : toCanonical(net),
      count: row?.count ?? 0,
      intensity: 0 as 0 | 1 | 2 | 3 | 4,
      sign,
    });
  }
  for (const cell of days) {
    if (cell.net && !maxAbs.isZero()) {
      const ratio = fromCanonical(cell.net).abs().div(maxAbs).toNumber();
      cell.intensity = (ratio > 0.75 ? 4 : ratio > 0.5 ? 3 : ratio > 0.25 ? 2 : 1) as
        0 | 1 | 2 | 3 | 4;
    }
  }
  const first = new Date(year, month - 1, 1);
  const firstWeekday = (first.getDay() + 6) % 7;
  let total = ZERO;
  for (const row of daily.values()) {
    total = add(total, row.net);
  }
  return { days, total, firstWeekday };
}
