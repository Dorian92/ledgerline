import type { Emotion } from '@/domain/trade/types';
import { classifyOutcome } from '@/domain/trade/compute';
import { add, ZERO } from '@/domain/money/dec';
import { fromCanonical } from '@/domain/money/canonical';
import { localDayKey } from '@/domain/time/tz';
import type { DayKey } from '@/domain/time/tz';

export interface HistoryFilter {
  text?: string;
  symbols?: string[];
  direction?: 'long' | 'short';
  outcome?: 'win' | 'loss' | 'breakeven';
  emotions?: Emotion[];
  tagIds?: string[];
  from?: DayKey;
  to?: DayKey;
  source?: 'manual' | 'import' | 'demo';
}

export interface HistoryTradeRow {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  status: 'open' | 'closed';
  opened_at: number;
  closed_at: number | null;
  net_pnl: string | null;
  r_multiple: string | null;
  notes: string;
  emotion: Emotion | null;
  source: string;
  tagIds?: string[];
}

export function matchesFilter(trade: HistoryTradeRow, filter: HistoryFilter, tz: string): boolean {
  if (filter.direction && trade.direction !== filter.direction) return false;
  if (filter.source && trade.source !== filter.source) return false;
  if (filter.symbols?.length && !filter.symbols.includes(trade.symbol)) return false;
  if (filter.emotions?.length && (!trade.emotion || !filter.emotions.includes(trade.emotion))) {
    return false;
  }
  if (filter.tagIds?.length) {
    const tags = trade.tagIds ?? [];
    if (!filter.tagIds.some((id) => tags.includes(id))) return false;
  }
  if (filter.text) {
    const q = filter.text.toLowerCase();
    if (!trade.symbol.toLowerCase().includes(q) && !trade.notes.toLowerCase().includes(q)) {
      return false;
    }
  }
  if (filter.outcome && trade.net_pnl) {
    const o = classifyOutcome(fromCanonical(trade.net_pnl));
    if (o !== filter.outcome) return false;
  }
  const day = trade.closed_at ? localDayKey(trade.closed_at, tz) : localDayKey(trade.opened_at, tz);
  if (filter.from && day < filter.from) return false;
  if (filter.to && day > filter.to) return false;
  return true;
}

export type HistorySection =
  | { kind: 'header'; key: string; label: string; net: string; count: number; filtered?: boolean }
  | { kind: 'trade'; trade: HistoryTradeRow };

export function buildHistorySections(
  trades: HistoryTradeRow[],
  tz: string,
  now: number,
  filtered = false,
): HistorySection[] {
  const open = trades.filter((t) => t.status === 'open');
  const closed = trades.filter((t) => t.status === 'closed' && t.closed_at);
  closed.sort((a, b) => b.closed_at! - a.closed_at! || b.id.localeCompare(a.id));
  const sections: HistorySection[] = [];
  if (open.length) {
    sections.push({ kind: 'header', key: 'open', label: 'Open', net: '0', count: open.length });
    for (const t of open) sections.push({ kind: 'trade', trade: t });
  }
  const byDay = new Map<string, HistoryTradeRow[]>();
  for (const t of closed) {
    const dk = localDayKey(t.closed_at!, tz);
    const arr = byDay.get(dk) ?? [];
    arr.push(t);
    byDay.set(dk, arr);
  }
  const today = localDayKey(now, tz);
  for (const [day, rows] of [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]))) {
    let net = ZERO;
    for (const r of rows) {
      if (r.net_pnl) net = add(net, fromCanonical(r.net_pnl));
    }
    const label = day === today ? `Today · ${day}` : day;
    sections.push({
      kind: 'header',
      key: day,
      label,
      net: net.toString(),
      count: rows.length,
      filtered,
    });
    for (const t of rows) sections.push({ kind: 'trade', trade: t });
  }
  return sections;
}
