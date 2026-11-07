import type { TradeInput } from '@/domain/trade/types';
import { formatPriceForDisplay } from '@/domain/money/format';

import type { TradeFormValues } from './schema';

export function tradeInputToFormValues(input: TradeInput): TradeFormValues {
  return {
    symbol: input.symbol,
    direction: input.direction,
    entry: formatPriceForDisplay(input.entryPrice),
    exit: input.exitPrice ? formatPriceForDisplay(input.exitPrice) : '',
    quantity: formatPriceForDisplay(input.quantity),
    stop: input.stopPrice ? formatPriceForDisplay(input.stopPrice) : '',
    fees: formatPriceForDisplay(input.fees),
    emotion: input.emotion ?? 'calm',
    tagIds: input.tagIds ?? [],
    notes: input.notes ?? '',
  };
}

/** Merge form fields onto an existing trade without clobbering identity/timestamps. */
export function mergeFormIntoTradeInput(
  base: TradeInput,
  values: TradeFormValues,
  parsed: TradeInput,
): TradeInput {
  return {
    ...parsed,
    accountId: base.accountId,
    baseAsset: base.baseAsset,
    quoteAsset: base.quoteAsset,
    instrument: base.instrument,
    openedAt: base.openedAt,
    closedAt: values.exit?.trim() ? (base.closedAt ?? parsed.closedAt) : null,
    leverage: base.leverage ?? parsed.leverage,
    maxQuantity: base.maxQuantity,
    tagIds: values.tagIds ?? [],
    notes: values.notes?.trim() ?? '',
    emotion: values.emotion ?? base.emotion,
  };
}
