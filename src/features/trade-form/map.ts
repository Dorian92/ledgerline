import { toCanonical } from '@/domain/money/canonical';
import type { TradeInput } from '@/domain/trade/types';
import type { MonetaryFieldKey } from '@/features/privacy/moneyMask';

import type { TradeFormValues } from './schema';

/** Full-precision strings for form state (no display rounding). */
export function tradeInputToFormValues(input: TradeInput): TradeFormValues {
  return {
    symbol: input.symbol,
    direction: input.direction,
    entry: toCanonical(input.entryPrice),
    exit: input.exitPrice ? toCanonical(input.exitPrice) : '',
    quantity: toCanonical(input.quantity),
    stop: input.stopPrice ? toCanonical(input.stopPrice) : '',
    fees: toCanonical(input.fees),
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

/** When a monetary field was not edited, keep persisted canonical string (avoids display rounding). */
export function resolveFormValuesForSave(
  base: TradeInput,
  values: TradeFormValues,
  dirty: Partial<Record<MonetaryFieldKey, boolean>>,
): TradeFormValues {
  const canonical = tradeInputToFormValues(base);
  return {
    ...values,
    entry: dirty.entry ? values.entry : canonical.entry,
    exit: dirty.exit ? values.exit : canonical.exit,
    quantity: dirty.quantity ? values.quantity : canonical.quantity,
    stop: dirty.stop ? values.stop : canonical.stop,
    fees: dirty.fees ? values.fees : canonical.fees,
  };
}
