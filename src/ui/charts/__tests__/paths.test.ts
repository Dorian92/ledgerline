import { buildEquityPath } from '../paths';
import { dec } from '@/domain/money/dec';

describe('buildEquityPath', () => {
  it('maps monotonic x for multiple points', () => {
    const pts = [
      { t: 1, e: dec('100') },
      { t: 2, e: dec('110') },
      { t: 3, e: dec('105') },
    ];
    const r = buildEquityPath(pts, 300, 100, { top: 0, right: 0, bottom: 0, left: 0 })!;
    expect(r.line.startsWith('M 0,')).toBe(true);
    expect(r.line).toContain('L 300,');
  });

  it('handles single point without divide by zero', () => {
    const r = buildEquityPath([{ t: 1, e: dec('50') }], 200, 80, {
      top: 4,
      right: 4,
      bottom: 4,
      left: 4,
    })!;
    expect(r.maxY).toBeGreaterThan(r.minY);
  });
});
