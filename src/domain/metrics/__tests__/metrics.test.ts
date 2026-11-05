import { dec, ZERO } from '../../money/dec';
import { computeSummary } from '../summary';
import type { MetricTrade } from '../types';
import { periodRange, inPeriod } from '../periods';
import { dailyPnl } from '../buckets';

describe('metrics §5-7', () => {
  const trades: MetricTrade[] = [
    {
      id: '1',
      symbol: 'BTC',
      direction: 'long',
      opened_at: 1000,
      closed_at: 2000,
      net_pnl: '10',
      r_multiple: '1',
      quantity: '1',
      entry_price: '100',
      risk_amount: '10',
      fees_complete: 1,
      funding_status: 'none',
      emotion: null,
    },
    {
      id: '2',
      symbol: 'ETH',
      direction: 'short',
      opened_at: 3000,
      closed_at: 4000,
      net_pnl: '-5',
      r_multiple: null,
      quantity: '1',
      entry_price: '100',
      risk_amount: null,
      fees_complete: 1,
      funding_status: 'none',
      emotion: null,
    },
  ];

  it('period filter', () => {
    const range = periodRange('ALL', 5000, 'UTC');
    expect(inPeriod(2000, range)).toBe(true);
  });

  it('summary net', () => {
    const range = periodRange('ALL', 5000, 'UTC');
    const s = computeSummary(trades, range, { startingBalance: dec('100') });
    expect(s.netPnl.toFixed()).toBe('5');
    expect(s.tradeCount).toBe(2);
  });

  it('daily sum equals period net', () => {
    const range = periodRange('ALL', 1e15, 'UTC');
    const s = computeSummary(trades, range, { startingBalance: null });
    const daily = dailyPnl(trades, 'UTC');
    let sum = ZERO;
    for (const v of daily.values()) {
      sum = sum.add(v.net);
    }
    expect(sum.toFixed()).toBe(s.netPnl.toFixed());
  });
});
