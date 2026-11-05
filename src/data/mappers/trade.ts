import { fromCanonical, toCanonical } from '@/domain/money/canonical';
import { CALC_VERSION, computeTrade } from '@/domain/trade';
import type { TradeInput } from '@/domain/trade/types';

export interface TradeRow {
  id: string;
  account_id: string;
  symbol: string;
  base_asset: string;
  quote_asset: string;
  instrument: string;
  direction: string;
  status: string;
  opened_at: number;
  closed_at: number | null;
  entry_price: string;
  exit_price: string | null;
  quantity: string;
  max_quantity: string;
  stop_price: string | null;
  leverage: string | null;
  fees: string;
  fees_complete: number;
  funding: string;
  funding_status: string;
  pnl_source: string;
  gross_pnl: string | null;
  net_pnl: string | null;
  risk_amount: string | null;
  r_multiple: string | null;
  r_unavailable_reason: string | null;
  emotion: string | null;
  notes: string;
  source: string;
  import_batch_id: string | null;
  calc_version: number;
  created_at: number;
  updated_at: number;
}

export function tradeInputToRow(
  id: string,
  input: TradeInput,
  source: 'manual' | 'import' | 'demo',
  now: number,
): Omit<TradeRow, 'created_at' | 'updated_at'> & { created_at: number; updated_at: number } {
  const derived = computeTrade(input);
  const closed = input.closedAt !== null && input.exitPrice !== null;
  return {
    id,
    account_id: input.accountId,
    symbol: input.symbol,
    base_asset: input.baseAsset,
    quote_asset: input.quoteAsset,
    instrument: input.instrument,
    direction: input.direction,
    status: closed ? 'closed' : 'open',
    opened_at: input.openedAt,
    closed_at: input.closedAt,
    entry_price: toCanonical(input.entryPrice),
    exit_price: input.exitPrice ? toCanonical(input.exitPrice) : null,
    quantity: toCanonical(input.quantity),
    max_quantity: toCanonical(input.maxQuantity ?? input.quantity),
    stop_price: input.stopPrice ? toCanonical(input.stopPrice) : null,
    leverage: input.leverage ? toCanonical(input.leverage) : null,
    fees: toCanonical(input.fees),
    fees_complete: input.feesComplete ? 1 : 0,
    funding: toCanonical(input.funding),
    funding_status: input.fundingStatus,
    pnl_source: input.pnlSource,
    gross_pnl: derived.grossPnl ? toCanonical(derived.grossPnl) : null,
    net_pnl: derived.netPnl ? toCanonical(derived.netPnl) : null,
    risk_amount: derived.riskAmount ? toCanonical(derived.riskAmount) : null,
    r_multiple: derived.rMultiple ? toCanonical(derived.rMultiple) : null,
    r_unavailable_reason: derived.rUnavailableReason,
    emotion: input.emotion,
    notes: input.notes,
    source,
    import_batch_id: null,
    calc_version: CALC_VERSION,
    created_at: now,
    updated_at: now,
  };
}

export function rowToTradeInput(row: TradeRow, tagIds: string[]): TradeInput {
  return {
    accountId: row.account_id,
    symbol: row.symbol,
    baseAsset: row.base_asset,
    quoteAsset: row.quote_asset as QuoteCurrency,
    instrument: row.instrument as TradeInput['instrument'],
    direction: row.direction as TradeInput['direction'],
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    entryPrice: fromCanonical(row.entry_price),
    exitPrice: row.exit_price ? fromCanonical(row.exit_price) : null,
    quantity: fromCanonical(row.quantity),
    maxQuantity: fromCanonical(row.max_quantity),
    stopPrice: row.stop_price ? fromCanonical(row.stop_price) : null,
    leverage: row.leverage ? fromCanonical(row.leverage) : null,
    fees: fromCanonical(row.fees),
    feesComplete: row.fees_complete === 1,
    funding: fromCanonical(row.funding),
    fundingStatus: row.funding_status as TradeInput['fundingStatus'],
    pnlSource: row.pnl_source as TradeInput['pnlSource'],
    emotion: row.emotion as TradeInput['emotion'],
    tagIds,
    notes: row.notes,
  };
}
