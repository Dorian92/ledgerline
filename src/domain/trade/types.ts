import type { Dec } from '../money/dec';
import type { QuoteCurrency } from '../money/types';

export const CALC_VERSION = 1;

export type Direction = 'long' | 'short';
export type Emotion = 'calm' | 'fomo' | 'revenge' | 'fear';
export type Instrument = 'perp' | 'spot';
export type FundingStatus = 'included' | 'none' | 'unknown';
export type PnlSource = 'computed' | 'exchange';
export type PositionSide = 'long' | 'short' | 'both';

export interface SymbolInfo {
  display: string;
  base: string;
  quote: QuoteCurrency;
  instrument: Instrument;
}

export interface TradeInput {
  accountId: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: QuoteCurrency;
  instrument: Instrument;
  direction: Direction;
  openedAt: number;
  closedAt: number | null;
  entryPrice: Dec;
  exitPrice: Dec | null;
  quantity: Dec;
  maxQuantity?: Dec;
  stopPrice: Dec | null;
  leverage: Dec | null;
  fees: Dec;
  feesComplete: boolean;
  funding: Dec;
  fundingStatus: FundingStatus;
  pnlSource: PnlSource;
  reportedGrossPnl?: Dec;
  emotion: Emotion | null;
  tagIds: string[];
  notes: string;
}

export type RUnavailableReason = 'no_stop' | 'stop_wrong_side' | 'zero_risk' | 'open';

export interface TradeDerived {
  grossPnl: Dec | null;
  netPnl: Dec | null;
  riskAmount: Dec | null;
  rMultiple: Dec | null;
  rUnavailableReason: RUnavailableReason | null;
  calcVersion: number;
}

export interface AccountQuote {
  quoteCurrency: QuoteCurrency;
}

export type ValidationField =
  | 'symbol'
  | 'quote'
  | 'entry'
  | 'exit'
  | 'quantity'
  | 'stop'
  | 'closedAt'
  | 'fees'
  | 'notes';

export interface ValidationResult {
  ok: boolean;
  errors: Partial<Record<ValidationField, string>>;
}

export interface FillKey {
  symbol: string;
  positionSide: PositionSide;
}

export interface FillInput {
  sourceIndex: number;
  key: FillKey;
  side: 'buy' | 'sell';
  price: Dec;
  quantity: Dec;
  feeQuote: Dec;
  feeOther?: { asset: string; amount: Dec };
  executedAt: number;
  reportedRealizedPnl?: Dec;
}

export interface BuiltTrade {
  symbol: string;
  baseAsset: string;
  quoteAsset: QuoteCurrency;
  instrument: Instrument;
  direction: Direction;
  openedAt: number;
  closedAt: number;
  entryPrice: Dec;
  exitPrice: Dec;
  quantity: Dec;
  maxQuantity: Dec;
  fees: Dec;
  feesComplete: boolean;
  pnlSource: PnlSource;
  reportedGrossPnl?: Dec;
  sourceIndexes: number[];
}

export type PositionErrorCode =
  | 'opened_before_export'
  | 'inconsistent_hedge_flip'
  | 'residual_quantity';

export interface PositionBuildResult {
  closed: BuiltTrade[];
  stillOpen: Array<{ key: FillKey; sourceIndexes: number[] }>;
  errors: Array<{ sourceIndex: number; code: PositionErrorCode }>;
}
