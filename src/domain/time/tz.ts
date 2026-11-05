import { format, parseISO } from 'date-fns';
import { TZDate } from '@date-fns/tz';

export type DayKey = `${number}-${string}-${string}`;

export function localDayKey(epochMs: number, tz: string): DayKey {
  const d = new TZDate(epochMs, tz);
  return format(d, 'yyyy-MM-dd') as DayKey;
}

export function localHour(epochMs: number, tz: string): number {
  const d = new TZDate(epochMs, tz);
  return d.getHours();
}

export function startOfLocalDay(epochMs: number, tz: string): number {
  const d = new TZDate(epochMs, tz);
  const start = new TZDate(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0, tz);
  return start.getTime();
}

export function parseInZone(dateString: string, pattern: string, tz: string): number {
  const parsed = parseISO(dateString);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${dateString}`);
  }
  const z = new TZDate(parsed.getTime(), tz);
  return z.getTime();
}
