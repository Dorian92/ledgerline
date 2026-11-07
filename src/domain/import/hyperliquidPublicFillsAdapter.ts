import { toCanonical } from '@/domain/money/canonical';
import { dec } from '@/domain/money/dec';
import { parseDecField } from './plan';
import type { ImportAdapter, ImportAttribution } from './types';

const WALLET = '0x69906b0ed626ca01a4b7c001e5711e5714ccf207';

export const HYPERLIQUID_PUBLIC_ATTRIBUTION: ImportAttribution = {
  kind: 'third_party_public',
  walletAddress: WALLET,
  sourceDescription:
    'Hyperliquid public userFills (POST https://api.hyperliquid.xyz/info). Leaderboard label stuxfred. Not your wallet.',
};

function parseMs(raw: string): number | null {
  const n = Number(raw.trim());
  if (!Number.isFinite(n)) {
    const t = Date.parse(raw.trim());
    return Number.isNaN(t) ? null : t;
  }
  return n;
}

function toPerpSymbol(coin: string): string {
  const base = coin.trim().toUpperCase();
  return base.includes('-') ? base : `${base}-PERP`;
}

/** Verified against fixtures/csv/real-anonymized/hyperliquid/public.hyperliquid.fills.v1__stuxfred-candidate.csv */
export const hyperliquidPublicFillsAdapter: ImportAdapter = {
  formatId: 'public.hyperliquid.fills.v1',
  exchange: 'public',
  kind: 'public-fill-ledger',
  label: 'Hyperliquid public fills (third-party)',
  attribution: HYPERLIQUID_PUBLIC_ATTRIBUTION,
  headerSignature: {
    required: ['tid', 'time_ms', 'coin', 'side', 'dir', 'px', 'sz', 'fee', 'feeToken', 'closedPnl'],
    optional: ['time_utc', 'oid', 'hash', 'startPosition', 'builderFee', 'crossed'],
  },
  fingerprintColumns: ['tid'],
  timestampPolicy: { kind: 'fixed', tz: 'UTC' },
  normalize(cells, ctx) {
    const raw = Object.values(cells);
    const tid = (cells.tid ?? '').trim();
    const ts = parseMs(cells.time_ms ?? cells.time_utc ?? '');
    const px = parseDecField(cells.px ?? '');
    const sz = parseDecField(cells.sz ?? '');
    const fee = parseDecField(cells.fee ?? '0');
    if (!tid || ts === null || !px || !sz || !fee) {
      return {
        kind: 'error',
        sourceIndex: ctx.sourceIndex,
        code: 'missing_field',
        message: 'tid, time_ms, px, sz, fee required',
        raw,
      };
    }
    const feeToken = (cells.feeToken ?? '').trim().toUpperCase();
    if (feeToken && feeToken !== ctx.quoteCurrency) {
      return {
        kind: 'error',
        sourceIndex: ctx.sourceIndex,
        code: 'quote_mismatch',
        message: `Fee token ${feeToken} does not match account quote ${ctx.quoteCurrency}`,
        raw,
      };
    }
    const sideRaw = (cells.side ?? '').toLowerCase();
    if (sideRaw !== 'buy' && sideRaw !== 'sell') {
      return {
        kind: 'error',
        sourceIndex: ctx.sourceIndex,
        code: 'bad_number',
        message: 'side must be buy or sell',
        raw,
      };
    }
    const closedRaw = (cells.closedPnl ?? '').trim();
    const closedPnl = closedRaw ? parseDecField(closedRaw) : dec('0');
    const builderFeeRaw = (cells.builderFee ?? '').trim();
    const builderFee = builderFeeRaw ? parseDecField(builderFeeRaw) : null;
    const startPos = (cells.startPosition ?? '').trim()
      ? parseDecField(cells.startPosition!)
      : null;
    return {
      kind: 'public-fill',
      sourceIndex: ctx.sourceIndex,
      exchangeFillId: tid,
      symbol: toPerpSymbol(cells.coin ?? ''),
      side: sideRaw,
      directionLabel: (cells.dir ?? '').trim() || '—',
      price: px,
      quantity: sz,
      fee,
      feeToken: feeToken || ctx.quoteCurrency,
      builderFee: builderFee ?? undefined,
      closedPnl: closedPnl ?? dec('0'),
      startPosition: startPos ?? undefined,
      executedAt: ts,
      crossed: (cells.crossed ?? '').toLowerCase() === 'true',
      raw,
    };
  },
};

export function publicFillLedgerRowFromNormalized(
  row: Extract<import('./types').NormalizedRow, { kind: 'public-fill' }>,
  fp: string,
) {
  return {
    exchangeFillId: row.exchangeFillId,
    symbol: row.symbol,
    side: row.side,
    directionLabel: row.directionLabel,
    price: toCanonical(row.price),
    quantity: toCanonical(row.quantity),
    fee: toCanonical(row.fee),
    feeToken: row.feeToken,
    builderFee: row.builderFee ? toCanonical(row.builderFee) : null,
    closedPnl: row.closedPnl ? toCanonical(row.closedPnl) : null,
    startPosition: row.startPosition ? toCanonical(row.startPosition) : null,
    executedAt: row.executedAt,
    crossed: row.crossed,
    sourceIndex: row.sourceIndex,
    fingerprints: [fp],
  };
}
