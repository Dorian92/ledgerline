import { format } from 'date-fns';
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

export function startOfLocalDayKey(dayKey: string, tz: string): number {
  return startOfLocalDay(new TZDate(`${dayKey}T00:00:00`, tz).getTime(), tz);
}

export function addLocalDays(dayKey: string, n: number): string {
  const d = new TZDate(`${dayKey}T12:00:00`, 'UTC');
  d.setDate(d.getDate() + n);
  return format(d, 'yyyy-MM-dd');
}

export function parseInZone(dateString: string, _pattern: string, tz: string): number {
  const z = new TZDate(dateString, tz);
  return z.getTime();
}
