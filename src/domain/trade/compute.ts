import { add, div, mul, sub, ROUND_HALF_EVEN, type Dec } from '../money/dec';
import type { QuoteCurrency } from '../money/types';

export const CALC_VERSION = 1;

export type Direction = 'long' | 'short';
export type Emotion = 'calm' | 'fomo' | 'revenge' | 'fear';
export type Instrument = 'perp' | 'spot';
export type FundingStatus = 'included' | 'none' | 'unknown';
export type PnlSource = 'computed' | 'exchange';

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

export function classifyOutcome(net: Dec): 'win' | 'loss' | 'breakeven' {
  const rounded = net.toDecimalPlaces(2, ROUND_HALF_EVEN);
  if (rounded.isZero()) {
    return 'breakeven';
  }
  return rounded.isPositive() ? 'win' : 'loss';
}

function grossFromPrices(direction: Direction, entry: Dec, exit: Dec, qty: Dec): Dec {
  if (direction === 'long') {
    return mul(sub(exit, entry), qty);
  }
  return mul(sub(entry, exit), qty);
}

export function computeTrade(input: TradeInput): TradeDerived {
  const isClosed = input.closedAt !== null && input.exitPrice !== null;
  if (!isClosed) {
    return {
      grossPnl: null,
      netPnl: null,
      riskAmount: null,
      rMultiple: null,
      rUnavailableReason: 'open',
      calcVersion: CALC_VERSION,
    };
  }
  const exit = input.exitPrice!;
  let gross =
    input.pnlSource === 'exchange' && input.reportedGrossPnl
      ? input.reportedGrossPnl
      : grossFromPrices(input.direction, input.entryPrice, exit, input.quantity);
  const net = add(sub(gross, input.fees), input.funding);
  const maxQty = input.maxQuantity ?? input.quantity;
  let riskAmount: Dec | null = null;
  let rMultiple: Dec | null = null;
  let rUnavailableReason: RUnavailableReason | null = null;
  if (input.stopPrice === null) {
    rUnavailableReason = 'no_stop';
  } else if (
    (input.direction === 'long' && input.stopPrice.gte(input.entryPrice)) ||
    (input.direction === 'short' && input.stopPrice.lte(input.entryPrice))
  ) {
    rUnavailableReason = 'stop_wrong_side';
  } else {
    const riskPerUnit = abs(sub(input.entryPrice, input.stopPrice));
    riskAmount = mul(riskPerUnit, maxQty);
    if (riskAmount.isZero()) {
      rUnavailableReason = 'zero_risk';
    } else {
      rMultiple = div(net, riskAmount);
    }
  }
  return {
    grossPnl: gross,
    netPnl: net,
    riskAmount,
    rMultiple,
    rUnavailableReason,
    calcVersion: CALC_VERSION,
  };
}

function abs(d: Dec): Dec {
  return d.abs();
}
