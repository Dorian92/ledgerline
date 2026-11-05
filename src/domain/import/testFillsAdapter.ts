import { dec } from '@/domain/money/dec';
import { parseDecField, parseTimestamp } from './plan';
import type { ImportAdapter } from './types';

/** Synthetic fill export for pipeline tests (formatId test.fills.v1). */
export const testFillsAdapter: ImportAdapter = {
  formatId: 'test.fills.v1',
  exchange: 'test',
  kind: 'fills',
  label: 'Test fills',
  headerSignature: { required: ['Time', 'Symbol', 'Side', 'Qty', 'Price'] },
  timestampPolicy: { kind: 'fixed', tz: 'UTC' },
  normalize(cells, ctx) {
    const raw = Object.values(cells);
    const ts = parseTimestamp(cells.Time ?? '');
    const qty = parseDecField(cells.Qty ?? '');
    const price = parseDecField(cells.Price ?? '');
    if (!ts || !qty || !price) {
      return {
        kind: 'error',
        sourceIndex: ctx.sourceIndex,
        code: 'missing_field',
        message: 'Missing or invalid field',
        raw,
      };
    }
    const sideRaw = (cells.Side ?? '').toLowerCase();
    if (sideRaw !== 'buy' && sideRaw !== 'sell') {
      return {
        kind: 'error',
        sourceIndex: ctx.sourceIndex,
        code: 'bad_number',
        message: 'Side must be buy or sell',
        raw,
      };
    }
    const sym = (cells.Symbol ?? '').toUpperCase();
    const feeParsed = parseDecField(cells.Fee ?? '0');
    const feeQuote = feeParsed ?? dec('0');
    return {
      kind: 'fill',
      sourceIndex: ctx.sourceIndex,
      symbol: sym,
      baseAsset: sym.split('-')[0] ?? sym,
      quoteAsset: ctx.quoteCurrency,
      side: sideRaw,
      price,
      quantity: qty,
      feeQuote,
      executedAt: ts,
      raw,
    };
  },
};
