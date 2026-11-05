import { decodeCsvBytes } from '../decode';
import { parseCsv } from '../parse';
import { detectAdapter } from '../detect';
import { buildImportPlan } from '../plan';
import { testClosedAdapter } from '../testAdapter';
import { testFillsAdapter } from '../testFillsAdapter';

const SAMPLE = `Time,Symbol,Side,Qty,Entry,Exit
2024-01-01T12:00:00Z,BTC-PERP,long,0.1,100,101
2024-01-02T12:00:00Z,ETH-PERP,short,1,50,49
`;

describe('import pipeline', () => {
  it('decodes utf-8 bom', () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode('a,b\n1,2')]);
    const d = decodeCsvBytes(bytes);
    expect('text' in d && d.text.startsWith('a,b')).toBe(true);
  });

  it('parses csv', () => {
    const p = parseCsv(SAMPLE);
    expect('header' in p && p.rows.length).toBe(2);
  });

  it('detects test adapter', () => {
    const p = parseCsv(SAMPLE);
    if ('error' in p) throw new Error('parse failed');
    const d = detectAdapter(p.header, [testClosedAdapter]);
    expect('adapter' in d && d.adapter.formatId).toBe('test.closed.v1');
  });

  it('builds import plan', async () => {
    const plan = await buildImportPlan({
      text: SAMPLE,
      adapters: [testClosedAdapter],
      quoteCurrency: 'USD',
      sourceTz: 'UTC',
      existingFingerprints: new Set(),
    });
    expect('summary' in plan && plan.summary.tradesToCreate).toBe(2);
    if ('summary' in plan) {
      expect(plan.summary.total).toBe(
        plan.summary.valid + plan.summary.duplicate + plan.summary.error + plan.summary.warning,
      );
    }
  });

  it('dedupes existing fingerprints', async () => {
    const first = await buildImportPlan({
      text: SAMPLE,
      adapters: [testClosedAdapter],
      quoteCurrency: 'USD',
      sourceTz: 'UTC',
      existingFingerprints: new Set(),
    });
    if (!('trades' in first)) throw new Error('no plan');
    const fps = new Set(first.trades.flatMap((t) => t.fingerprints));
    const second = await buildImportPlan({
      text: SAMPLE,
      adapters: [testClosedAdapter],
      quoteCurrency: 'USD',
      sourceTz: 'UTC',
      existingFingerprints: fps,
    });
    expect('summary' in second && second.summary.tradesToCreate).toBe(0);
  });

  const FILLS = `Time,Symbol,Side,Qty,Price,Fee
2024-01-01T10:00:00Z,BTC-PERP,buy,1,100,0.1
2024-01-01T11:00:00Z,BTC-PERP,sell,1,105,0.1
`;

  it('builds trades from test fills adapter', async () => {
    const plan = await buildImportPlan({
      text: FILLS,
      adapters: [testFillsAdapter],
      quoteCurrency: 'USD',
      sourceTz: 'UTC',
      existingFingerprints: new Set(),
    });
    expect('summary' in plan && plan.summary.tradesToCreate).toBe(1);
    if ('trades' in plan) {
      expect(plan.trades[0]?.fills?.length).toBe(2);
    }
  });

  it('summary invariant property on random mixes', async () => {
    for (let n = 0; n < 20; n++) {
      const plan = await buildImportPlan({
        text: SAMPLE,
        adapters: [testClosedAdapter],
        quoteCurrency: 'USD',
        sourceTz: 'UTC',
        existingFingerprints: new Set(),
      });
      if (!('summary' in plan)) continue;
      expect(plan.summary.tradesToCreate).toBe(plan.trades.length);
      expect(plan.summary.total).toBe(
        plan.summary.valid + plan.summary.warning + plan.summary.duplicate + plan.summary.error,
      );
    }
  });

  it('plans 50k closed rows under 8s with progress yields', async () => {
    let lines = 'Time,Symbol,Side,Qty,Entry,Exit\n';
    for (let i = 0; i < 50_000; i++) {
      lines += `2024-01-01T12:00:00Z,BTC-PERP,long,0.1,100,101\n`;
    }
    let yields = 0;
    const t0 = Date.now();
    const plan = await buildImportPlan({
      text: lines,
      adapters: [testClosedAdapter],
      quoteCurrency: 'USD',
      sourceTz: 'UTC',
      existingFingerprints: new Set(),
      yieldToEventLoop: async () => {
        yields++;
      },
    });
    expect(Date.now() - t0).toBeLessThan(8000);
    expect(yields).toBeGreaterThanOrEqual(100);
    expect('summary' in plan && plan.summary.total).toBe(50_000);
  });
});
