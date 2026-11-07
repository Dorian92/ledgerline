import type { Summary } from '@/domain/metrics/summary';
import { formatMoney, formatRatioAsPercent } from '@/domain/money/format';
import type { QuoteCurrency } from '@/domain/money/types';

export function toDashboardViewModel(
  summary: Summary,
  currency: QuoteCurrency,
  opts: { hidden?: boolean } = {},
) {
  const hidden = opts.hidden ?? false;
  return {
    heroPnl: formatMoney(summary.netPnl, currency, { sign: 'always', hidden }),
    subline:
      summary.returnPct !== null
        ? `${formatRatioAsPercent(summary.returnPct, 2)} · ${summary.tradeCount} trades`
        : `${summary.tradeCount} trades`,
    winRate: summary.winRate ? formatRatioAsPercent(summary.winRate, 1) : '—',
    avgR: summary.avgR ? `${summary.avgR.isPositive() ? '+' : ''}${summary.avgR.toFixed(2)}R` : '—',
    maxDd: summary.maxDrawdownPct
      ? formatRatioAsPercent(summary.maxDrawdownPct.negated(), 1)
      : formatMoney(summary.maxDrawdownAbs, currency, { hidden }),
    equityRange: hidden
      ? '•••• → ••••'
      : `${formatMoney(summary.startEquity, currency, { compact: true })} → ${formatMoney(summary.endEquity, currency, { compact: true })}`,
  };
}
