import { dec } from '../../money/dec';
import { buildPositionsFromFills, type FillInput } from '../positions';

function fill(partial: Partial<FillInput> & Pick<FillInput, 'sourceIndex' | 'side' | 'price' | 'quantity'>): FillInput {
  return {
    key: { symbol: 'BTC-PERP', positionSide: 'long' },
    feeQuote: dec('0'),
    executedAt: partial.sourceIndex,
    ...partial,
  };
}

describe('positions §4', () => {
  it('simple open close two fills', () => {
    const fills = [
      fill({ sourceIndex: 1, side: 'buy', price: dec('100'), quantity: dec('1'), executedAt: 1 }),
      fill({ sourceIndex: 2, side: 'sell', price: dec('110'), quantity: dec('1'), executedAt: 2 }),
    ];
    const r = buildPositionsFromFills(fills, { mode: 'hedge' });
    expect(r.errors).toHaveLength(0);
    expect(r.closed).toHaveLength(1);
    expect(r.closed[0]!.quantity.toFixed()).toBe('1');
    expect(r.closed[0]!.entryPrice.toFixed()).toBe('100');
    expect(r.closed[0]!.exitPrice.toFixed()).toBe('110');
  });

  it('partial close still open', () => {
    const fills = [
      fill({ sourceIndex: 1, side: 'buy', price: dec('100'), quantity: dec('2'), executedAt: 1 }),
      fill({ sourceIndex: 2, side: 'sell', price: dec('105'), quantity: dec('1'), executedAt: 2 }),
    ];
    const r = buildPositionsFromFills(fills, { mode: 'hedge' });
    expect(r.stillOpen).toHaveLength(1);
    expect(r.closed).toHaveLength(0);
  });

  it('orphan reduce hedge long', () => {
    const fills = [
      fill({ sourceIndex: 1, side: 'sell', price: dec('100'), quantity: dec('1'), executedAt: 1 }),
    ];
    const r = buildPositionsFromFills(fills, { mode: 'hedge' });
    expect(r.errors[0]!.code).toBe('opened_before_export');
  });

  it('flip one-way', () => {
    const fills: FillInput[] = [
      {
        sourceIndex: 1,
        key: { symbol: 'BTC-PERP', positionSide: 'both' },
        side: 'buy',
        price: dec('100'),
        quantity: dec('1'),
        feeQuote: dec('3'),
        executedAt: 1,
      },
      {
        sourceIndex: 2,
        key: { symbol: 'BTC-PERP', positionSide: 'both' },
        side: 'sell',
        price: dec('90'),
        quantity: dec('1.5'),
        feeQuote: dec('3'),
        executedAt: 2,
      },
    ];
    const r = buildPositionsFromFills(fills, { mode: 'one-way' });
    expect(r.closed.length).toBeGreaterThanOrEqual(1);
  });
});
