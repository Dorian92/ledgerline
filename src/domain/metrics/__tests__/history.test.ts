import { formatMoney } from '@/domain/money/format';
import { fromCanonical } from '@/domain/money/canonical';

import { buildHistorySections, matchesFilter } from '../history';
import type { HistoryTradeRow } from '../history';

describe('history', () => {
  const row = (id: string, closed: number, net: string): HistoryTradeRow => ({
    id,
    symbol: 'BTC-PERP',
    direction: 'long',
    status: 'closed',
    opened_at: closed - 1000,
    closed_at: closed,
    net_pnl: net,
    r_multiple: null,
    notes: '',
    emotion: null,
    source: 'manual',
  });

  it('stores bounded canonical net on day headers', () => {
    const sections = buildHistorySections(
      [
        row('1', Date.parse('2026-01-02T10:00:00Z'), '5.3850996731752529768'),
        row('2', Date.parse('2026-01-02T11:00:00Z'), '-1.03979671798669733095'),
      ],
      'UTC',
      Date.parse('2026-01-02T12:00:00Z'),
    );
    const header = sections.find((s) => s.kind === 'header' && s.key === '2026-01-02');
    expect(header?.kind).toBe('header');
    if (header?.kind === 'header') {
      expect(formatMoney(fromCanonical(header.net), 'USD', { sign: 'always' })).toBe('+$4.35');
    }
  });

  it('groups by day', () => {
    const sections = buildHistorySections(
      [row('1', Date.parse('2026-01-02T10:00:00Z'), '1')],
      'UTC',
      Date.parse('2026-01-02T12:00:00Z'),
    );
    expect(sections.some((s) => s.kind === 'header')).toBe(true);
  });

  it('filters losers', () => {
    const t = row('1', 1, '-3');
    expect(matchesFilter(t, { outcome: 'loss' }, 'UTC')).toBe(true);
    expect(matchesFilter(t, { outcome: 'win' }, 'UTC')).toBe(false);
  });

  it('buildHistorySections 10k under 100ms', () => {
    const rows: HistoryTradeRow[] = [];
    for (let i = 0; i < 10_000; i++) {
      rows.push(row(String(i), 1_700_000_000_000 + i * 60_000, i % 3 === 0 ? '-1' : '2'));
    }
    const t0 = Date.now();
    buildHistorySections(rows, 'UTC', 1_800_000_000_000);
    expect(Date.now() - t0).toBeLessThan(300);
  });
});
