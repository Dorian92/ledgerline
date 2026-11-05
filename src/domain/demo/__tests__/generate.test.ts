import { generateDemoTrades } from '../generate';

describe('generateDemoTrades', () => {
  it('is deterministic for the same seed', () => {
    const a = generateDemoTrades({ seed: 99, now: 1_700_000_000_000, accountId: 'acc' });
    const b = generateDemoTrades({ seed: 99, now: 1_700_000_000_000, accountId: 'acc' });
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(50);
  });

  it('differs when seed changes', () => {
    const a = generateDemoTrades({ seed: 1, now: 1_700_000_000_000, accountId: 'acc' });
    const b = generateDemoTrades({ seed: 2, now: 1_700_000_000_000, accountId: 'acc' });
    expect(a[0]?.entryPrice.toString()).not.toBe(b[0]?.entryPrice.toString());
  });
});
