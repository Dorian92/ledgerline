export type QuoteCurrency = 'USDT' | 'USDC' | 'USD';

export function isQuoteCurrency(s: string): s is QuoteCurrency {
  return s === 'USDT' || s === 'USDC' || s === 'USD';
}
