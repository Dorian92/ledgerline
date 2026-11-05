import { add, div, sub, ZERO, type Dec } from '@/domain/money/dec';
import { dec } from '@/domain/money/dec';
import { fromCanonical } from '@/domain/money/canonical';
import { classifyOutcome } from '@/domain/trade/compute';

export interface MetricTrade {
  id: string;
  closed_at: number;
  net_pnl: string;
  r_multiple: string | null;
  opened_at: number;
  fees_complete: number;
  funding_status: string;
}

export interface Summary {
  netPnl: Dec;
  tradeCount: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: Dec | null;
  avgR: Dec | null;
  rSampleSize: number;
  equity: { t: number; e: Dec }[];
  startEquity: Dec;
  endEquity: Dec;
  maxDrawdownAbs: Dec;
  maxDrawdownPct: Dec | null;
  returnPct: Dec | null;
  caveats: { fundingUnknown: number; feesIncomplete: number };
}

export function computeSummary(
  trades: MetricTrade[],
  range: { start: number | null; end: number },
  opts: { startingBalance: Dec | null },
): Summary {
  const sorted = [...trades].sort((a, b) => a.closed_at - b.closed_at || a.id.localeCompare(b.id));
  const inRange = sorted.filter(
    (t) => (range.start === null || t.closed_at >= range.start) && t.closed_at <= range.end,
  );
  let netPnl = ZERO;
  let wins = 0;
  let losses = 0;
  let breakevens = 0;
  let rSum = ZERO;
  let rCount = 0;
  let fundingUnknown = 0;
  let feesIncomplete = 0;
  for (const t of inRange) {
    const net = fromCanonical(t.net_pnl);
    netPnl = add(netPnl, net);
    const outcome = classifyOutcome(net);
    if (outcome === 'win') {
      wins += 1;
    } else if (outcome === 'loss') {
      losses += 1;
    } else {
      breakevens += 1;
    }
    if (t.r_multiple) {
      rSum = add(rSum, fromCanonical(t.r_multiple));
      rCount += 1;
    }
    if (t.funding_status === 'unknown') {
      fundingUnknown += 1;
    }
    if (t.fees_complete === 0) {
      feesIncomplete += 1;
    }
  }
  const winDenom = wins + losses;
  const winRate = winDenom > 0 ? div(dec(String(wins)), dec(String(winDenom))) : null;
  const avgR = rCount > 0 ? div(rSum, dec(String(rCount))) : null;

  const pre = sorted.filter((t) => range.start !== null && t.closed_at < range.start!);
  let startEquity = opts.startingBalance ?? ZERO;
  for (const t of pre) {
    startEquity = add(startEquity, fromCanonical(t.net_pnl));
  }
  const equity: { t: number; e: Dec }[] = [];
  if (range.start !== null) {
    equity.push({ t: range.start, e: startEquity });
  }
  let e = startEquity;
  for (const t of inRange) {
    e = add(e, fromCanonical(t.net_pnl));
    equity.push({ t: t.closed_at, e });
  }
  const endEquity = e;
  let peak = startEquity;
  let maxDdAbs = ZERO;
  let maxDdPct: Dec | null = null;
  for (const p of equity) {
    if (p.e.gt(peak)) {
      peak = p.e;
    }
    const dd = sub(peak, p.e);
    if (dd.gt(maxDdAbs)) {
      maxDdAbs = dd;
    }
    if (!peak.isZero() && peak.isPositive()) {
      const pct = div(dd, peak);
      if (maxDdPct === null || pct.gt(maxDdPct)) {
        maxDdPct = pct;
      }
    }
  }
  if (peak.lte(0)) {
    maxDdPct = null;
  }
  const returnPct =
    !startEquity.isZero() && startEquity.isPositive() ? div(netPnl, startEquity) : null;

  return {
    netPnl,
    tradeCount: inRange.length,
    wins,
    losses,
    breakevens,
    winRate,
    avgR,
    rSampleSize: rCount,
    equity,
    startEquity,
    endEquity,
    maxDrawdownAbs: maxDdAbs,
    maxDrawdownPct: maxDdPct,
    returnPct,
    caveats: { fundingUnknown, feesIncomplete },
  };
}
