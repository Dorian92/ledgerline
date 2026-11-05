import { detectTilt } from '../tilt';
import type { MetricTrade } from '@/domain/metrics/types';

describe('detectTilt', () => {
  it('flags revenge pattern', () => {
    const trades: MetricTrade[] = [];
    let t = 0;
    for (let i = 0; i < 4; i++) {
      const closed = (t += 10_000);
      const opened = closed - 1000;
      trades.push({
        id: String(i),
        symbol: 'BTC',
        direction: 'long',
        opened_at: opened,
        closed_at: closed,
        net_pnl: '-1',
        r_multiple: null,
        quantity: '1',
        entry_price: '1',
        risk_amount: null,
        fees_complete: 1,
        funding_status: 'none',
        emotion: null,
      });
      t = closed + 60_000;
      trades.push({
        id: `${i}b`,
        symbol: 'BTC',
        direction: 'long',
        opened_at: t,
        closed_at: t + 1000,
        net_pnl: '1',
        r_multiple: null,
        quantity: '1',
        entry_price: '1',
        risk_amount: null,
        fees_complete: 1,
        funding_status: 'none',
        emotion: null,
      });
    }
    const s = detectTilt(trades, 'UTC');
    expect(s.some((x) => x.id === 'revenge')).toBe(true);
  });
});
