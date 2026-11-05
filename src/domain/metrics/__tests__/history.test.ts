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
});
