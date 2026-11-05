import { add, div, mul, sub, ROUND_HALF_EVEN, ZERO, type Dec } from '../money/dec';
import type { TradeDerived, TradeInput } from './types';

export const CALC_VERSION = 1;

export function grossFromPrices(
  direction: TradeInput['direction'],
  entry: Dec,
  exit: Dec,
  qty: Dec,
): Dec {
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
  const gross =
    input.pnlSource === 'exchange' && input.reportedGrossPnl
      ? input.reportedGrossPnl
      : grossFromPrices(input.direction, input.entryPrice, exit, input.quantity);
  const net = add(sub(gross, input.fees), input.funding);
  const maxQty = input.maxQuantity ?? input.quantity;
  let riskAmount: Dec | null = null;
  let rMultiple: Dec | null = null;
  let rUnavailableReason: TradeDerived['rUnavailableReason'] = null;
  if (input.stopPrice === null) {
    rUnavailableReason = 'no_stop';
  } else if (
    (input.direction === 'long' && input.stopPrice.gte(input.entryPrice)) ||
    (input.direction === 'short' && input.stopPrice.lte(input.entryPrice))
  ) {
    rUnavailableReason = 'stop_wrong_side';
  } else {
    const riskPerUnit = input.entryPrice.sub(input.stopPrice).abs();
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

export function classifyOutcome(net: Dec): 'win' | 'loss' | 'breakeven' {
  const rounded = net.toDecimalPlaces(2, ROUND_HALF_EVEN);
  if (rounded.isZero()) {
    return 'breakeven';
  }
  return rounded.isPositive() ? 'win' : 'loss';
}
