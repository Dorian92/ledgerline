import { generateDemoTrades } from '../generate';

describe('generateDemoTrades', () => {
  it('is deterministic for the same seed', () => {
    const a = generateDemoTrades({ seed: 99, now: 1_700_000_000_000, accountId: 'acc' });
    const b = generateDemoTrades({ seed: 99, now: 1_700_000_000_000, accountId: 'acc' });
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(50);
  });

  it('uses sign-correct exits for long and short', () => {
    const rows = generateDemoTrades({ seed: 7, now: 1_700_000_000_000, accountId: 'acc' });
    let favorable = 0;
    let adverse = 0;
    for (const t of rows) {
      if (!t.exitPrice) continue;
      const moveUp = t.exitPrice.gt(t.entryPrice);
      const favorableMove = t.direction === 'long' ? moveUp : !moveUp;
      if (favorableMove) favorable += 1;
      else adverse += 1;
    }
    expect(favorable).toBeGreaterThan(20);
    expect(adverse).toBeGreaterThan(20);
  });

  it('differs when seed changes', () => {
    const a = generateDemoTrades({ seed: 1, now: 1_700_000_000_000, accountId: 'acc' });
    const b = generateDemoTrades({ seed: 2, now: 1_700_000_000_000, accountId: 'acc' });
    expect(a[0]?.entryPrice.toString()).not.toBe(b[0]?.entryPrice.toString());
  });
});
