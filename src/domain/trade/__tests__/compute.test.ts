import { dec } from '../../money/dec';
import { computeTrade, type TradeInput } from '../compute';

const baseInput = (): TradeInput => ({
  accountId: 'a1',
  symbol: 'BTC-PERP',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  instrument: 'perp',
  direction: 'long',
  openedAt: 0,
  closedAt: 1,
  entryPrice: dec('68412.5'),
  exitPrice: dec('69240.0'),
  quantity: dec('0.150'),
  stopPrice: dec('68020.0'),
  leverage: dec('2'),
  fees: dec('4.10'),
  feesComplete: true,
  funding: dec('0'),
  fundingStatus: 'none',
  pnlSource: 'computed',
  emotion: 'calm',
  tagIds: [],
  notes: '',
});

describe('§3.3 worked example', () => {
  it('computes gross, net, risk, R', () => {
    const d = computeTrade(baseInput());
    expect(d.grossPnl!.toFixed()).toBe('124.125');
    expect(d.netPnl!.toFixed()).toBe('120.025');
    expect(d.riskAmount!.toFixed()).toBe('58.875');
    expect(d.rMultiple!.toFixed(4)).toBe('2.0386');
  });
});

describe('R unavailable', () => {
  it('requires stop', () => {
    const input = { ...baseInput(), stopPrice: null };
    expect(computeTrade(input).rUnavailableReason).toBe('no_stop');
  });
});
