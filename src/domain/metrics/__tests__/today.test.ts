import { buildTodaySnapshot } from '../today';
import type { MetricTrade } from '../types';

const trade = (net: string, closed: number, r: string | null = null): MetricTrade =>
  ({
    id: String(closed),
    closed_at: closed,
    net_pnl: net,
    r_multiple: r,
    funding_status: 'none',
    fees_complete: 1,
  }) as MetricTrade;

describe('buildTodaySnapshot', () => {
  const now = Date.parse('2026-11-05T15:00:00Z');
  const tz = 'UTC';

  it('counts today wins and losses', () => {
    const snap = buildTodaySnapshot({
      trades: [
        trade('10', now - 3600000),
        trade('-5', now - 1800000),
        trade('3', now - 600000, '1.5'),
      ],
      now,
      tz,
      mode: 'real',
      hideAmounts: false,
      appLockEnabled: false,
      pro: true,
      quoteCurrency: 'USD',
    });
    expect(snap.statsLine).toContain('3 trades');
    expect(snap.statsLine).toContain('2W');
    expect(snap.statsLine).toContain('1L');
    expect(snap.netPnlText).toContain('8');
  });

  it('hides amounts when privacy on', () => {
    const snap = buildTodaySnapshot({
      trades: [trade('10', now)],
      now,
      tz,
      mode: 'real',
      hideAmounts: true,
      appLockEnabled: false,
      pro: true,
      quoteCurrency: 'USD',
    });
    expect(snap.netPnlText).toBe('••••');
  });

  it('shows demo tag in demo mode', () => {
    const snap = buildTodaySnapshot({
      trades: [trade('1', now)],
      now,
      tz,
      mode: 'demo',
      hideAmounts: false,
      appLockEnabled: false,
      pro: false,
      quoteCurrency: 'USD',
    });
    expect(snap.showDemoTag).toBe(true);
  });

  it('locks widget for non-pro real mode', () => {
    const snap = buildTodaySnapshot({
      trades: [trade('1', now)],
      now,
      tz,
      mode: 'real',
      hideAmounts: false,
      appLockEnabled: false,
      pro: false,
      quoteCurrency: 'USD',
    });
    expect(snap.proLocked).toBe(true);
  });
});
