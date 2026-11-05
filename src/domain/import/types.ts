import type { QuoteCurrency } from '@/domain/money/types';
import type { Dec } from '@/domain/money/dec';
import type { FillInput, TradeInput } from '@/domain/trade/types';

export type RowStatus = 'valid' | 'warning' | 'duplicate' | 'error';

export type RowErrorCode =
  'missing_field' | 'bad_number' | 'bad_timestamp' | 'quote_mismatch' | 'unknown_format';

export interface ImportAdapter {
  formatId: string;
  exchange: 'binance' | 'bybit' | 'okx' | 'test';
  kind: 'fills' | 'closed-positions';
  label: string;
  headerSignature: { required: string[]; optional?: string[] };
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
      executedAt: number;
      raw: string[];
    }
  | { kind: 'error'; sourceIndex: number; code: RowErrorCode; message: string; raw: string[] };

export interface ImportPlan {
  formatId: string;
  exchange: string;
  label: string;
  sourceTz: string;
  fileSha256: string;
  summary: {
    total: number;
    valid: number;
    warning: number;
    duplicate: number;
    error: number;
    importableRows: number;
    tradesToCreate: number;
  };
  rows: { index: number; status: RowStatus; codes: string[]; display: PreviewCells }[];
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
