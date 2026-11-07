import { parseUserDecimal } from '@/domain/money/parse';
import { dec } from '@/domain/money/dec';

import { buildPositionsFromFills } from '@/domain/trade/positions';
import type { BuiltTrade, FillInput } from '@/domain/trade/types';

import { detectAdapter } from './detect';
import { fingerprintRow, hashFile } from './fingerprint';
import { parseCsv } from './parse';
import { publicFillLedgerRowFromNormalized } from './hyperliquidPublicFillsAdapter';
import type { ImportAdapter, ImportFailure, ImportPlan, NormalizedRow, RowStatus } from './types';

export async function buildImportPlan(opts: {
  text: string;
  adapters: ImportAdapter[];
  quoteCurrency: 'USD' | 'USDT' | 'USDC';
  sourceTz: string;
  existingFingerprints: Set<string>;
  yieldToEventLoop?: () => Promise<void>;
}): Promise<ImportPlan | ImportFailure> {
  const parsed = parseCsv(opts.text);
  if ('error' in parsed) {
    return { error: parsed.error };
  }
  const detected = detectAdapter(parsed.header, opts.adapters);
  if ('error' in detected) {
    return detected;
  }
  const adapter = detected.adapter;
  const yieldFn = opts.yieldToEventLoop ?? (async () => {});
  const colIndex = Object.fromEntries(parsed.header.map((h, i) => [h, i]));
  const normalized: NormalizedRow[] = [];
  for (let i = 0; i < parsed.rows.length; i++) {
    if (i % 500 === 0) {
      await yieldFn();
    }
    const raw = parsed.rows[i]!;
    const cells: Record<string, string> = {};
    for (const h of parsed.header) {
      cells[h] = raw[colIndex[h]!] ?? '';
    }
    normalized.push(
      adapter.normalize(cells, { sourceIndex: i + 1, quoteCurrency: opts.quoteCurrency }),
    );
  }

  if (adapter.kind === 'fills') {
    return planFromFills(adapter, normalized, {
      text: opts.text,
      quoteCurrency: opts.quoteCurrency,
      sourceTz: opts.sourceTz,
      existingFingerprints: opts.existingFingerprints,
    });
  }

  if (adapter.kind === 'public-fill-ledger') {
    return planFromPublicFillLedger(adapter, normalized, {
      text: opts.text,
      sourceTz: opts.sourceTz,
      existingFingerprints: opts.existingFingerprints,
    });
  }

  const rows: ImportPlan['rows'] = [];
  const trades: ImportPlan['trades'] = [];
  const seen = new Set<string>();
  let valid = 0;
  let warning = 0;
  let duplicate = 0;
  let error = 0;

  for (const row of normalized) {
    if (row.kind === 'error') {
      error++;
      rows.push({
        index: row.sourceIndex,
        status: 'error',
        codes: [row.code],
        display: { time: '—', symbol: '—', side: '—', qty: '—', price: '—' },
      });
      continue;
    }
    if (row.kind !== 'closed') {
      error++;
      rows.push({
        index: row.sourceIndex,
        status: 'error',
        codes: ['missing_field'],
        display: { time: '—', symbol: '—', side: '—', qty: '—', price: '—' },
      });
      continue;
    }
    const identity = row.raw.join('\u001f');
    const fp = fingerprintRow(adapter.formatId, identity);
    let status: RowStatus = 'valid';
    if (seen.has(fp) || opts.existingFingerprints.has(fp)) {
      status = 'duplicate';
      duplicate++;
    } else {
      seen.add(fp);
      valid++;
    }
    rows.push({
      index: row.sourceIndex,
      status,
      codes: [],
      display: {
        time: new Date(row.closedAt).toISOString(),
        symbol: row.symbol,
        side: row.direction.toUpperCase(),
        qty: row.quantity.toString(),
        price: row.entry.toString(),
      },
    });
    if (status === 'valid') {
      trades.push({
        fingerprints: [fp],
        input: {
          symbol: row.symbol,
          baseAsset: row.baseAsset,
          quoteAsset: row.quoteAsset,
          instrument: 'perp',
          direction: row.direction,
          openedAt: row.openedAt,
          closedAt: row.closedAt,
          entryPrice: row.entry,
          exitPrice: row.exit,
          quantity: row.quantity,
          stopPrice: null,
          leverage: dec('1'),
          fees: row.fees ?? dec('0'),
          feesComplete: true,
          funding: dec('0'),
          fundingStatus: 'none',
          pnlSource: row.grossPnl ? 'exchange' : 'computed',
          reportedGrossPnl: row.grossPnl,
        },
      });
    }
  }

  const total = valid + warning + duplicate + error;
  if (total !== normalized.length) {
    throw new Error('summary invariant violated');
  }
  const importableRows = valid + warning;
  return {
    formatId: adapter.formatId,
    exchange: adapter.exchange,
    label: adapter.label,
    sourceTz: opts.sourceTz,
    fileSha256: hashFile(opts.text),
    importMode: 'trades',
    attribution: adapter.attribution,
    summary: {
      total,
      valid,
      warning,
      duplicate,
      error,
      importableRows,
      tradesToCreate: trades.length,
    },
    rows,
    trades,
    messages: [],
  };
}

function planFromPublicFillLedger(
  adapter: ImportAdapter,
  normalized: NormalizedRow[],
  opts: {
    text: string;
    sourceTz: string;
    existingFingerprints: Set<string>;
  },
): ImportPlan {
  const rows: ImportPlan['rows'] = [];
  const ledger: NonNullable<ImportPlan['publicFillLedger']> = [];
  const seen = new Set<string>();
  let valid = 0;
  let duplicate = 0;
  let error = 0;

  for (const row of normalized) {
    if (row.kind === 'error') {
      error++;
      rows.push({
        index: row.sourceIndex,
        status: 'error',
        codes: [row.code],
        display: { time: '—', symbol: '—', side: '—', qty: '—', price: '—' },
      });
      continue;
    }
    if (row.kind !== 'public-fill') {
      error++;
      continue;
    }
    const identity = row.exchangeFillId;
    const fp = fingerprintRow(adapter.formatId, identity);
    let status: RowStatus = 'valid';
    if (seen.has(fp) || opts.existingFingerprints.has(fp)) {
      status = 'duplicate';
      duplicate++;
    } else {
      seen.add(fp);
      valid++;
    }
    rows.push({
      index: row.sourceIndex,
      status,
      codes: [],
      display: {
        time: new Date(row.executedAt).toISOString(),
        symbol: row.symbol,
        side: `${row.directionLabel}`,
        qty: row.quantity.toString(),
        price: row.price.toString(),
      },
    });
    if (status === 'valid') {
      ledger.push(publicFillLedgerRowFromNormalized(row, fp));
    }
  }

  const total = valid + duplicate + error;
  if (total !== normalized.length) {
    throw new Error('summary invariant violated');
  }

  return {
    formatId: adapter.formatId,
    exchange: adapter.exchange,
    label: adapter.label,
    sourceTz: opts.sourceTz,
    fileSha256: hashFile(opts.text),
    importMode: 'public-fill-ledger',
    attribution: adapter.attribution,
    summary: {
      total,
      valid,
      warning: 0,
      duplicate,
      error,
      importableRows: valid,
      tradesToCreate: 0,
      ledgerFillsToCreate: ledger.length,
    },
    rows,
    trades: [],
    publicFillLedger: ledger,
    messages: [
      {
        level: 'warning',
        text: 'Fill ledger only: no round-trip trades, stops, R, or funding. Exchange closedPnl is gross per fill; fees are separate.',
        rowIndexes: [],
      },
    ],
  };
}

export function parseTimestamp(raw: string): number | null {
  const t = Date.parse(raw.trim());
  return Number.isNaN(t) ? null : t;
}

export function parseDecField(raw: string) {
  const p = parseUserDecimal(raw);
  return p.ok ? p.value : null;
}

function builtToTradeInput(b: BuiltTrade): ImportPlan['trades'][0]['input'] {
  return {
    symbol: b.symbol,
    baseAsset: b.baseAsset,
    quoteAsset: b.quoteAsset,
    instrument: b.instrument,
    direction: b.direction,
    openedAt: b.openedAt,
    closedAt: b.closedAt,
    entryPrice: b.entryPrice,
    exitPrice: b.exitPrice,
    quantity: b.quantity,
    stopPrice: null,
    leverage: dec('1'),
    fees: b.fees,
    feesComplete: b.feesComplete,
    funding: dec('0'),
    fundingStatus: 'none',
    pnlSource: b.pnlSource,
    reportedGrossPnl: b.reportedGrossPnl,
  };
}

function planFromFills(
  adapter: ImportAdapter,
  normalized: NormalizedRow[],
  opts: {
    text: string;
    quoteCurrency: 'USD' | 'USDT' | 'USDC';
    sourceTz: string;
    existingFingerprints: Set<string>;
  },
): ImportPlan {
  const rows: ImportPlan['rows'] = [];
  const trades: ImportPlan['trades'] = [];
  const seen = new Set<string>();
  const rowFp = new Map<number, string>();
  const fillInputs: FillInput[] = [];
  let valid = 0;
  let warning = 0;
  let duplicate = 0;
  let error = 0;

  for (const row of normalized) {
    if (row.kind === 'error') {
      error++;
      rows.push({
        index: row.sourceIndex,
        status: 'error',
        codes: [row.code],
        display: { time: '—', symbol: '—', side: '—', qty: '—', price: '—' },
      });
      continue;
    }
    if (row.kind !== 'fill') {
      error++;
      continue;
    }
    const identity = row.raw.join('\u001f');
    const fp = fingerprintRow(adapter.formatId, identity);
    rowFp.set(row.sourceIndex, fp);
    let status: RowStatus = 'valid';
    if (seen.has(fp) || opts.existingFingerprints.has(fp)) {
      status = 'duplicate';
      duplicate++;
    } else {
      seen.add(fp);
      valid++;
    }
    rows.push({
      index: row.sourceIndex,
      status,
      codes: [],
      display: {
        time: new Date(row.executedAt).toISOString(),
        symbol: row.symbol,
        side: row.side.toUpperCase(),
        qty: row.quantity.toString(),
        price: row.price.toString(),
      },
    });
    if (status === 'valid') {
      fillInputs.push({
        sourceIndex: row.sourceIndex,
        key: { symbol: row.symbol, positionSide: 'both' },
        side: row.side,
        price: row.price,
        quantity: row.quantity,
        feeQuote: row.feeQuote,
        executedAt: row.executedAt,
      });
    }
  }

  const built = buildPositionsFromFills(fillInputs, { mode: 'one-way' });
  for (const open of built.stillOpen) {
    for (const idx of open.sourceIndexes) {
      const r = rows.find((x) => x.index === idx);
      if (r && r.status === 'valid') {
        r.status = 'warning';
        r.codes.push('still_open');
        valid--;
        warning++;
      }
    }
  }

  for (const t of built.closed) {
    const fps = t.sourceIndexes.map((i) => rowFp.get(i)!).filter(Boolean);
    const tradeFills = fillInputs.filter((f) => t.sourceIndexes.includes(f.sourceIndex));
    trades.push({
      input: builtToTradeInput(t),
      fills: tradeFills,
      fingerprints: fps,
    });
  }

  const total = valid + warning + duplicate + error;
  if (total !== normalized.length) {
    throw new Error('summary invariant violated');
  }
  return {
    formatId: adapter.formatId,
    exchange: adapter.exchange,
    label: adapter.label,
    sourceTz: opts.sourceTz,
    fileSha256: hashFile(opts.text),
    importMode: 'trades',
    attribution: adapter.attribution,
    summary: {
      total,
      valid,
      warning,
      duplicate,
      error,
      importableRows: valid + warning,
      tradesToCreate: trades.length,
    },
    rows,
    trades,
    messages: [],
  };
}
