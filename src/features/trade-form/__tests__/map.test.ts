import { toCanonical } from '@/domain/money/canonical';
import { dec } from '@/domain/money/dec';
import type { TradeInput } from '@/domain/trade/types';

import { mergeFormIntoTradeInput, resolveFormValuesForSave, tradeInputToFormValues } from '../map';

const baseTrade = (): TradeInput => ({
  accountId: 'acc',
  symbol: 'SOL-PERP',
  baseAsset: 'SOL',
  quoteAsset: 'USD',
  instrument: 'perp',
  direction: 'short',
  openedAt: 1_700_000_000_000,
  closedAt: 1_700_000_360_000,
  entryPrice: dec('103.02'),
  exitPrice: dec('102.73'),
  quantity: dec('0.232'),
  maxQuantity: dec('0.232'),
  stopPrice: dec('104'),
  leverage: dec('2'),
  fees: dec('0.17'),
  feesComplete: true,
  funding: dec('0'),
  fundingStatus: 'none',
  pnlSource: 'computed',
  emotion: 'calm',
  tagIds: [],
  notes: '',
});

describe('tradeInputToFormValues', () => {
  it('preserves symbol, side, and bounded numeric strings', () => {
    const values = tradeInputToFormValues(baseTrade());
    expect(values.symbol).toBe('SOL-PERP');
    expect(values.direction).toBe('short');
    expect(values.entry).toBe('103.02');
    expect(values.exit).toBe('102.73');
    expect(values.quantity).toBe('0.232');
  });

  it('does not use quick-add defaults', () => {
    const values = tradeInputToFormValues(baseTrade());
    expect(values.symbol).not.toBe('BTC-PERP');
    expect(values.direction).not.toBe('long');
  });

  it('keeps full canonical precision in form strings', () => {
    const input: TradeInput = {
      ...baseTrade(),
      entryPrice: dec('103.02002858370543'),
      exitPrice: dec('102.73333459487185356'),
    };
    const values = tradeInputToFormValues(input);
    expect(values.entry).toBe('103.02002858370543');
    expect(values.exit).toBe('102.73333459487185356');
  });
});

describe('resolveFormValuesForSave', () => {
  it('reuses canonical strings when monetary fields were not edited', () => {
    const base: TradeInput = {
      ...baseTrade(),
      entryPrice: dec('103.02002858370543'),
      fees: dec('0.1700000001'),
    };
    const canonical = tradeInputToFormValues(base);
    const touched = {
      ...canonical,
      entry: '103.02',
      fees: '0.17',
    };
    const resolved = resolveFormValuesForSave(base, touched, {});
    expect(resolved.entry).toBe(canonical.entry);
    expect(resolved.fees).toBe(canonical.fees);
  });

  it('keeps user edits when field is dirty', () => {
    const base = baseTrade();
    const canonical = tradeInputToFormValues(base);
    const resolved = resolveFormValuesForSave(
      base,
      { ...canonical, entry: '200' },
      { entry: true },
    );
    expect(resolved.entry).toBe('200');
  });
});

describe('mergeFormIntoTradeInput preserves prices', () => {
  it('round-trips entry price when save uses resolved canonical strings', () => {
    const base: TradeInput = {
      ...baseTrade(),
      entryPrice: dec('103.02002858370543'),
    };
    const values = tradeInputToFormValues(base);
    const resolved = resolveFormValuesForSave(base, values, {});
    expect(resolved.entry).toBe(toCanonical(base.entryPrice));
  });
});

describe('mergeFormIntoTradeInput', () => {
  it('keeps trade identity timestamps when saving edits', () => {
    const base = baseTrade();
    const parsed = { ...base, openedAt: 9, closedAt: 99, symbol: 'BTC-PERP' };
    const merged = mergeFormIntoTradeInput(base, tradeInputToFormValues(base), parsed);
    expect(merged.openedAt).toBe(base.openedAt);
    expect(merged.closedAt).toBe(base.closedAt);
    expect(merged.accountId).toBe('acc');
  });
});
