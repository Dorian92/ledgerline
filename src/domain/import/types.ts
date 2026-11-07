import type { QuoteCurrency } from '@/domain/money/types';
import type { Dec } from '@/domain/money/dec';
import type { FillInput, TradeInput } from '@/domain/trade/types';

export type RowStatus = 'valid' | 'warning' | 'duplicate' | 'error';

export type RowErrorCode =
  'missing_field' | 'bad_number' | 'bad_timestamp' | 'quote_mismatch' | 'unknown_format';

export type ImportExchange = 'binance' | 'bybit' | 'okx' | 'test' | 'public';

export interface ImportAttribution {
  kind: 'third_party_public';
  sourceDescription: string;
  /** Public address or handle from the export filename/metadata (optional). */
  walletAddress?: string;
}

export interface ImportAdapter {
  formatId: string;
  exchange: ImportExchange;
  kind: 'fills' | 'closed-positions' | 'public-fill-ledger';
  label: string;
  headerSignature: { required: string[]; optional?: string[] };
  /** Columns joined for dedup when `exchangeFillId` is absent on a fill row. */
  fingerprintColumns?: string[];
  attribution?: ImportAttribution;
  timestampPolicy: { kind: 'fixed'; tz: 'UTC' } | { kind: 'ask'; defaultTz: 'UTC' };
  normalize: (
    cells: Record<string, string>,
    ctx: { sourceIndex: number; quoteCurrency: QuoteCurrency },
  ) => NormalizedRow;
}

export type NormalizedRow =
  | {
      kind: 'closed';
      sourceIndex: number;
      symbol: string;
      baseAsset: string;
      quoteAsset: QuoteCurrency;
      direction: 'long' | 'short';
      entry: Dec;
      exit: Dec;
      quantity: Dec;
      grossPnl?: Dec;
      fees?: Dec;
      openedAt: number;
      closedAt: number;
      raw: string[];
    }
  | {
      kind: 'fill';
      sourceIndex: number;
      symbol: string;
      baseAsset: string;
      quoteAsset: QuoteCurrency;
      side: 'buy' | 'sell';
      price: Dec;
      quantity: Dec;
      feeQuote: Dec;
      feeAsset?: string;
      closedPnlQuote?: Dec;
      exchangeFillId?: string;
      executedAt: number;
      raw: string[];
    }
  | {
      kind: 'public-fill';
      sourceIndex: number;
      exchangeFillId: string;
      symbol: string;
      side: 'buy' | 'sell';
      directionLabel: string;
      price: Dec;
      quantity: Dec;
      fee: Dec;
      feeToken: string;
      builderFee?: Dec;
      closedPnl?: Dec;
      startPosition?: Dec;
      executedAt: number;
      crossed: boolean;
      raw: string[];
    }
  | { kind: 'error'; sourceIndex: number; code: RowErrorCode; message: string; raw: string[] };

export interface PublicFillLedgerRow {
  exchangeFillId: string;
  symbol: string;
  side: 'buy' | 'sell';
  directionLabel: string;
  price: string;
  quantity: string;
  fee: string;
  feeToken: string;
  builderFee: string | null;
  closedPnl: string | null;
  startPosition: string | null;
  executedAt: number;
  crossed: boolean;
  sourceIndex: number;
  fingerprints: string[];
}

export type ImportPlanMode = 'trades' | 'public-fill-ledger';

export interface ImportPlan {
  formatId: string;
  exchange: string;
  label: string;
  sourceTz: string;
  fileSha256: string;
  attribution?: ImportAttribution;
  importMode: ImportPlanMode;
  summary: {
    total: number;
    valid: number;
    warning: number;
    duplicate: number;
    error: number;
    importableRows: number;
    tradesToCreate: number;
    ledgerFillsToCreate?: number;
  };
  rows: { index: number; status: RowStatus; codes: string[]; display: PreviewCells }[];
  publicFillLedger?: PublicFillLedgerRow[];
  trades: {
    input: Omit<TradeInput, 'accountId' | 'tagIds' | 'notes' | 'emotion'>;
    fills?: FillInput[];
    fingerprints: string[];
  }[];
  messages: { level: 'warning' | 'error'; text: string; rowIndexes: number[] }[];
}

export interface PreviewCells {
  time: string;
  symbol: string;
  side: string;
  qty: string;
  price: string;
}

export type ImportFailure =
  | { error: 'too_many_rows' | 'too_large' | 'unknown_format' | 'unsupported_encoding' }
  | { error: 'unknown_format'; closest?: { formatId: string; missing: string[] } };
