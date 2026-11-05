import * as fc from 'fast-check';

import { dec } from '../../money/dec';
import type { TradeInput } from '../types';
import { classifyOutcome, computeTrade, grossFromPrices } from '../compute';

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
  emotion: null,
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

describe('short example §3', () => {
  it('computes short PnL', () => {
    const input: TradeInput = {
      ...baseInput(),
      direction: 'short',
      entryPrice: dec('3512.8'),
      exitPrice: dec('3541.2'),
      quantity: dec('2.4'),
      fees: dec('3.1'),
      stopPrice: dec('3560'),
    };
    const d = computeTrade(input);
    expect(d.grossPnl!.toFixed(2)).toBe('-68.16');
    expect(d.netPnl!.toFixed(2)).toBe('-71.26');
  });
});

describe('R unavailable', () => {
  it('requires stop', () => {
    expect(computeTrade({ ...baseInput(), stopPrice: null }).rUnavailableReason).toBe('no_stop');
  });
  it('stop wrong side long', () => {
    expect(computeTrade({ ...baseInput(), stopPrice: dec('70000') }).rUnavailableReason).toBe(
      'stop_wrong_side',
    );
  });
});

describe('funding and fees', () => {
  it('funding sign', () => {
    const base = baseInput();
    const netBase = computeTrade(base).netPnl!;
    const withFunding = computeTrade({ ...base, funding: dec('-1.5') }).netPnl!;
    const withRebate = computeTrade({ ...base, fees: dec('-0.4') }).netPnl!;
    expect(withFunding.lt(netBase)).toBe(true);
    expect(withRebate.gt(netBase)).toBe(true);
  });
});

describe('classifyOutcome §3.4', () => {
  it('breakeven band', () => {
    expect(classifyOutcome(dec('0.004'))).toBe('breakeven');
    expect(classifyOutcome(dec('0.005'))).toBe('breakeven');
    expect(classifyOutcome(dec('0.006'))).toBe('win');
    expect(classifyOutcome(dec('-0.006'))).toBe('loss');
  });
});

describe('property gross symmetry', () => {
  it('long vs short', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.double({ min: 1, max: 1e6, noNaN: true }),
          fc.double({ min: 1, max: 1e6, noNaN: true }),
          fc.double({ min: 0.001, max: 100, noNaN: true }),
        ),
        ([e, x, q]) => {
          const entry = dec(String(Math.round(e * 100) / 100));
          const exit = dec(String(Math.round(x * 100) / 100));
          const qty = dec(String(Math.round(q * 1000) / 1000));
          const gl = grossFromPrices('long', entry, exit, qty);
          const gs = grossFromPrices('short', entry, exit, qty);
          expect(gl.add(gs).isZero()).toBe(true);
        },
      ),
    );
  });
});
