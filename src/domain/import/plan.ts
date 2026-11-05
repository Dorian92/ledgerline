import { parseUserDecimal } from '@/domain/money/parse';
import { dec } from '@/domain/money/dec';

import { detectAdapter } from './detect';
import { fingerprintRow, hashFile } from './fingerprint';
import { parseCsv } from './parse';
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

export function parseTimestamp(raw: string): number | null {
  const t = Date.parse(raw.trim());
  return Number.isNaN(t) ? null : t;
}

export function parseDecField(raw: string) {
  const p = parseUserDecimal(raw);
  return p.ok ? p.value : null;
}
