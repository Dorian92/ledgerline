import type { FillInput } from '@/domain/trade/types';
import { toCanonical } from '@/domain/money/canonical';

export function fillInputToRow(id: string, tradeId: string, fill: FillInput, quoteAsset: string) {
  return {
    id,
    trade_id: tradeId,
    side: fill.side,
    price: toCanonical(fill.price),
    quantity: toCanonical(fill.quantity),
    fee: toCanonical(fill.feeQuote),
    fee_asset: quoteAsset,
    reported_realized_pnl: fill.reportedRealizedPnl ? toCanonical(fill.reportedRealizedPnl) : null,
    executed_at: fill.executedAt,
    exchange_trade_id: null as string | null,
  };
}
