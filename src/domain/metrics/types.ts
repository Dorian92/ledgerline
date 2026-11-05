import type { PeriodKey } from './periods';

export type { PeriodKey };

export interface MetricTrade {
  id: string;
  symbol: string;
  direction: string;
  opened_at: number;
  closed_at: number;
  net_pnl: string;
  r_multiple: string | null;
  quantity: string;
  entry_price: string;
  risk_amount: string | null;
  fees_complete: number;
  funding_status: string;
  emotion: string | null;
}
