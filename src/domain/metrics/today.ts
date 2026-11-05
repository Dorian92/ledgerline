import { format } from 'date-fns';

import { ROUND_HALF_EVEN } from '@/domain/money/dec';
import { formatMoney } from '@/domain/money/format';

import { localDayKey, startOfLocalDayKey } from '@/domain/time/tz';

import { computeSummary } from './summary';
import type { MetricTrade } from './types';

export interface TodaySnapshotInput {
  trades: MetricTrade[];
  now: number;
  tz: string;
  mode: 'demo' | 'real' | 'unset';
  hideAmounts: boolean;
  appLockEnabled: boolean;
  pro: boolean;
  quoteCurrency: 'USD' | 'USDT' | 'USDC';
}

export interface WidgetSnapshot {
  dateLabel: string;
  netPnlText: string;
  netPnlColor: 'green' | 'red' | 'muted';
  statsLine: string;
  showDemoTag: boolean;
  proLocked: boolean;
  hideAmounts: boolean;
  unsetMode: boolean;
}

export function buildTodaySnapshot(input: TodaySnapshotInput): WidgetSnapshot {
  const today = localDayKey(input.now, input.tz);
  const dateLabel = format(new Date(input.now), 'EEE, MMM d');
  const range = {
    start: startOfLocalDayKey(today, input.tz),
    end: input.now,
  };

  if (input.mode === 'unset') {
    return {
      dateLabel,
      netPnlText: 'Set up Ledgerline',
      netPnlColor: 'muted',
      statsLine: 'Open the app to start',
      showDemoTag: false,
      proLocked: false,
      hideAmounts: false,
      unsetMode: true,
    };
  }

  const demoPreview = input.mode === 'demo';
  const proOk = input.pro || demoPreview;
  if (!proOk && input.mode === 'real') {
    return {
      dateLabel,
      netPnlText: "Today's summary is a Pro feature",
      netPnlColor: 'muted',
      statsLine: 'Tap + to log a trade (free)',
      showDemoTag: false,
      proLocked: true,
      hideAmounts: false,
      unsetMode: false,
    };
  }

  const summary = computeSummary(input.trades, range, { startingBalance: null });
  const hidden = input.hideAmounts || input.appLockEnabled;
  const netFormatted = hidden
    ? '••••'
    : formatMoney(summary.netPnl, input.quoteCurrency, { sign: 'always' });
  const netColor = hidden
    ? 'muted'
    : summary.netPnl.isPositive()
      ? 'green'
      : summary.netPnl.isNegative()
        ? 'red'
        : 'muted';

  const rPart =
    summary.avgR !== null
      ? ` · ${summary.avgR.toDecimalPlaces(2, ROUND_HALF_EVEN).isPositive() ? '+' : ''}${summary.avgR.toDecimalPlaces(2, ROUND_HALF_EVEN).toString()}R avg`
      : '';
  const statsLine = hidden
    ? `${summary.tradeCount} trades`
    : `${summary.tradeCount} trades · ${summary.wins}W ${summary.losses}L${rPart}`;

  return {
    dateLabel,
    netPnlText: netFormatted,
    netPnlColor: netColor,
    statsLine,
    showDemoTag: demoPreview,
    proLocked: false,
    hideAmounts: hidden,
    unsetMode: false,
  };
}
