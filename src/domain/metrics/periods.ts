import { localDayKey, addLocalDays, startOfLocalDayKey, type DayKey } from '@/domain/time/tz';

export type PeriodKey = '7D' | '30D' | 'YTD' | 'ALL';

export interface PeriodRange {
  start: number | null;
  end: number;
}

export function periodRange(key: PeriodKey, now: number, tz: string): PeriodRange {
  const end = now;
  const today = localDayKey(now, tz);
  if (key === 'ALL') {
    return { start: null, end };
  }
  if (key === '7D') {
    const startDay = addLocalDays(today, -6);
    return { start: startOfLocalDayKey(startDay, tz), end };
  }
  if (key === '30D') {
    const startDay = addLocalDays(today, -29);
    return { start: startOfLocalDayKey(startDay, tz), end };
  }
  const year = today.slice(0, 4);
  return {
    start: startOfLocalDayKey(`${year}-01-01`, tz),
    end,
  };
}

export function inPeriod(closedAt: number, range: PeriodRange): boolean {
  if (range.start !== null && closedAt < range.start) {
    return false;
  }
  return closedAt <= range.end;
}

export { type DayKey };
