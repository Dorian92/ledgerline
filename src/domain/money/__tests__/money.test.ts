import * as fc from 'fast-check';

import { fromCanonical, toCanonical } from '../canonical';
import { dec } from '../dec';
import { formatMoney, formatPriceForDisplay, formatR, formatRatioAsPercent } from '../format';
import { parseUserDecimal } from '../parse';

describe('canonical', () => {
  it('round-trips canonical strings', () => {
    fc.assert(
      fc.property(fc.constantFrom('0', '1', '1.5', '-3.2', '0.00000001'), (s) => {
        expect(toCanonical(fromCanonical(s))).toBe(s);
      }),
    );
  });

  it('normalizes -0 and 1.50', () => {
    expect(toCanonical(dec('-0'))).toBe('0');
    expect(toCanonical(dec('1.50'))).toBe('1.5');
  });
});

describe('parseUserDecimal', () => {
  it('rejects grouping and accepts comma decimal', () => {
    expect(parseUserDecimal('68,412.5').ok).toBe(false);
    expect(parseUserDecimal('0,15')).toEqual({ ok: true, value: dec('0.15') });
  });
});

describe('formatMoney §8', () => {
  it('formats USD with sign', () => {
    expect(formatMoney(dec('2526.4'), 'USD')).toMatch(/\+?\$2,526\.40/);
  });

  it('formatR null', () => {
    expect(formatR(null)).toBe('—');
  });
});

describe('formatPriceForDisplay', () => {
  it('caps excessive fractional digits', () => {
    expect(formatPriceForDisplay(dec('103.02002858370543'))).toBe('103.02002858');
  });
});

describe('formatRatioAsPercent', () => {
  it('scales unitless ratios and suppresses negative zero', () => {
    expect(formatRatioAsPercent(dec('-0.0018'), 2)).toBe('\u22120.18%');
    expect(formatRatioAsPercent(dec('0.584'), 1)).toBe('+58.4%');
    expect(formatRatioAsPercent(dec('0'), 1)).toBe('0.0%');
  });
});

describe('§3.3 worked example display', () => {
  it('formats net and R', () => {
    expect(formatMoney(dec('120.025'), 'USDT')).toContain('+120.02');
    expect(formatR(dec('2.0386'))).toContain('+2.04');
  });
});
