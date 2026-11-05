import type { Summary } from '@/domain/metrics/summary';
import { formatMoney, formatPercent } from '@/domain/money/format';
import type { QuoteCurrency } from '@/domain/money/types';

export function toDashboardViewModel(summary: Summary, currency: QuoteCurrency) {
  return {
    heroPnl: formatMoney(summary.netPnl, currency, { sign: 'always' }),
    subline:
      summary.returnPct !== null
        ? `${formatPercent(summary.returnPct, 2)} · ${summary.tradeCount} trades`
        : `${summary.tradeCount} trades`,
    winRate: summary.winRate ? formatPercent(summary.winRate, 1) : '—',
    avgR: summary.avgR ? `${summary.avgR.isPositive() ? '+' : ''}${summary.avgR.toFixed(2)}R` : '—',
    maxDd: summary.maxDrawdownPct
      ? formatPercent(summary.maxDrawdownPct.negated(), 1)
      : summary.maxDrawdownAbs.toFixed(2),
    equityRange: `${formatMoney(summary.startEquity, currency, { compact: true })} → ${formatMoney(summary.endEquity, currency, { compact: true })}`,
  };
}
