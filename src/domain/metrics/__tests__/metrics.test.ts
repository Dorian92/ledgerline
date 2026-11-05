import { dec, ZERO } from '../../money/dec';
import { computeSummary } from '../summary';
import type { MetricTrade } from '../types';
import { periodRange, inPeriod } from '../periods';
import { dailyPnl, hourOfDay, calendarMonth } from '../buckets';
import { localDayKey } from '@/domain/time/tz';

function trade(
  partial: Partial<MetricTrade> & Pick<MetricTrade, 'id' | 'closed_at' | 'net_pnl'>,
): MetricTrade {
  return {
    symbol: 'BTC',
    direction: 'long',
    opened_at: partial.closed_at - 3600000,
    r_multiple: null,
    quantity: '1',
    entry_price: '100',
    risk_amount: null,
    fees_complete: 1,
    funding_status: 'none',
    emotion: null,
    ...partial,
  };
}

describe('metrics §5-7', () => {
  const trades: MetricTrade[] = [
    trade({ id: '1', closed_at: 2000, net_pnl: '10', r_multiple: '1' }),
    trade({ id: '2', closed_at: 4000, net_pnl: '-5' }),
  ];

  it('period filter ALL', () => {
    const range = periodRange('ALL', 5000, 'UTC');
    expect(inPeriod(2000, range)).toBe(true);
  });

  it('7D window in Europe/Berlin', () => {
    const now = new Date('2026-11-05T14:00:00Z').getTime();
    const range = periodRange('7D', now, 'Europe/Berlin');
    const today = localDayKey(now, 'Europe/Berlin');
    expect(today).toBe('2026-11-05');
    expect(localDayKey(range.start!, 'Europe/Berlin')).toBe('2026-10-30');
  });

  it('30D spans DST end 2026-10-25 in Berlin', () => {
    const now = new Date('2026-11-05T12:00:00Z').getTime();
    const range = periodRange('30D', now, 'Europe/Berlin');
    const startKey = localDayKey(range.start!, 'Europe/Berlin');
    expect(startKey).toBe('2026-10-07');
    expect(range.start).toBeLessThan(now);
  });

  it('YTD starts Jan 1 local', () => {
    const now = new Date('2026-06-15T12:00:00Z').getTime();
    const range = periodRange('YTD', now, 'UTC');
    expect(localDayKey(range.start!, 'UTC')).toBe('2026-01-01');
  });

  it('summary net on two trades', () => {
    const range = periodRange('ALL', 5000, 'UTC');
    const s = computeSummary(trades, range, { startingBalance: dec('100') });
    expect(s.netPnl.toFixed()).toBe('5');
    expect(s.tradeCount).toBe(2);
  });

  it('six-trade summary hand expectations', () => {
    const six: MetricTrade[] = [
      trade({ id: 'a', closed_at: 1000, net_pnl: '10', r_multiple: '2' }),
      trade({ id: 'b', closed_at: 2000, net_pnl: '0' }),
      trade({ id: 'c', closed_at: 3000, net_pnl: '-3', r_multiple: '-1' }),
      trade({ id: 'd', closed_at: 4000, net_pnl: '5', r_multiple: '0.5' }),
      trade({ id: 'e', closed_at: 5000, net_pnl: '-2' }),
      trade({ id: 'f', closed_at: 6000, net_pnl: '1', r_multiple: '1' }),
    ];
    const s = computeSummary(six, periodRange('ALL', 7000, 'UTC'), { startingBalance: null });
    expect(s.netPnl.toFixed()).toBe('11');
    expect(s.wins).toBe(3);
    expect(s.losses).toBe(2);
    expect(s.breakevens).toBe(1);
    expect(s.winRate?.toFixed(2)).toBe('0.60');
    expect(s.rSampleSize).toBe(4);
    expect(s.avgR?.toFixed(2)).toBe('0.62');
  });

  it('equity drawdown sequence', () => {
    const seq = [500, -525, 225, -400, 1200].map((n, i) =>
      trade({ id: String(i), closed_at: (i + 1) * 1000, net_pnl: String(n) }),
    );
    const s = computeSummary(seq, periodRange('ALL', 1e6, 'UTC'), {
      startingBalance: dec('10000'),
    });
    expect(s.startEquity.toFixed()).toBe('10000');
    expect(s.endEquity.toFixed()).toBe('11000');
    expect(s.maxDrawdownAbs.toFixed()).toBe('700');
    expect(s.maxDrawdownPct?.toFixed(4)).toBe('0.0667');
  });

  it('period start equity includes pre-period trades', () => {
    const all = [
      trade({ id: 'pre', closed_at: 1000, net_pnl: '100' }),
      trade({ id: 'in', closed_at: 5000, net_pnl: '10' }),
    ];
    const range = { start: 4000, end: 6000 };
    const s = computeSummary(all, range, { startingBalance: dec('1000') });
    expect(s.startEquity.toFixed()).toBe('1100');
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

  it('trade at 23:30 UTC lands next day in Berlin', () => {
    const t = trade({
      id: 'late',
      closed_at: Date.parse('2026-01-01T23:30:00Z'),
      net_pnl: '1',
    });
    const daily = dailyPnl([t], 'Europe/Berlin');
    expect(daily.has('2026-01-02')).toBe(true);
  });

  it('hour-of-day uses openedAt', () => {
    const t = trade({
      id: 'h',
      opened_at: Date.parse('2026-01-01T21:50:00Z'),
      closed_at: Date.parse('2026-01-01T22:10:00Z'),
      net_pnl: '2',
    });
    const hours = hourOfDay([t], 'UTC');
    expect(hours[21]?.count).toBe(1);
  });

  it('calendar month October 2026 weekday', () => {
    const cal = calendarMonth([], 2026, 10, 'UTC');
    expect(cal.firstWeekday).toBe(3);
  });

  it('10k trades performance budget', () => {
    const big: MetricTrade[] = [];
    for (let i = 0; i < 10_000; i++) {
      big.push(
        trade({
          id: String(i).padStart(6, '0'),
          closed_at: 1_700_000_000_000 + i * 60_000,
          net_pnl: i % 3 === 0 ? '-1' : '2',
          r_multiple: i % 2 === 0 ? '1' : null,
        }),
      );
    }
    const t0 = Date.now();
    const range = periodRange('ALL', 1_800_000_000_000, 'UTC');
    computeSummary(big, range, { startingBalance: dec('10000') });
    dailyPnl(big, 'UTC');
    hourOfDay(big, 'UTC');
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(500);
  });
});
