import { parseDecField, parseTimestamp } from './plan';
import type { ImportAdapter } from './types';

export const testClosedAdapter: ImportAdapter = {
  formatId: 'test.closed.v1',
  exchange: 'test',
  kind: 'closed-positions',
  label: 'Test closed positions',
  headerSignature: { required: ['Time', 'Symbol', 'Side', 'Qty', 'Entry', 'Exit'] },
  timestampPolicy: { kind: 'fixed', tz: 'UTC' },
  normalize(cells, ctx) {
    const raw = Object.values(cells);
    const ts = parseTimestamp(cells.Time ?? '');
    const qty = parseDecField(cells.Qty ?? '');
    const entry = parseDecField(cells.Entry ?? '');
    const exit = parseDecField(cells.Exit ?? '');
    if (!ts || !qty || !entry || !exit) {
      return {
        kind: 'error',
        sourceIndex: ctx.sourceIndex,
        code: 'missing_field',
        message: 'Missing or invalid field',
        raw,
      };
    }
    const side = (cells.Side ?? '').toLowerCase();
    if (side !== 'long' && side !== 'short') {
      return {
        kind: 'error',
        sourceIndex: ctx.sourceIndex,
        code: 'bad_number',
        message: 'Side must be long or short',
        raw,
      };
    }
    const sym = (cells.Symbol ?? '').toUpperCase();
    return {
      kind: 'closed',
      sourceIndex: ctx.sourceIndex,
      symbol: sym,
      baseAsset: sym.split('-')[0] ?? sym,
      quoteAsset: ctx.quoteCurrency,
      direction: side,
      entry,
      exit,
      quantity: qty,
      openedAt: ts - 3600000,
      closedAt: ts,
      raw,
    };
  },
};
