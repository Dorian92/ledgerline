import { abs, isPos, isZero, ROUND_HALF_EVEN, type Dec } from './dec';
import type { QuoteCurrency } from './types';

const MINUS = '\u2212';

function formatGrouped(d: Dec, dp: number): string {
  const rounded = d.toDecimalPlaces(dp, ROUND_HALF_EVEN);
  const negative = rounded.isNegative();
  const absStr = rounded.abs().toFixed(dp);
  const [intRaw, frac] = absStr.split('.');
  const int = intRaw ?? '0';
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const num = frac !== undefined ? `${withCommas}.${frac}` : withCommas;
  return negative ? `${MINUS}${num}` : num;
}

export function formatMoney(
  d: Dec,
  ccy: QuoteCurrency,
  opts: { sign?: 'always' | 'negative'; compact?: boolean; hidden?: boolean } = {},
): string {
  if (opts.hidden) {
    return '••••';
  }
  let body = formatGrouped(d, 2);
  const signMode = opts.sign ?? 'always';
  if (signMode === 'always') {
    if (isPos(d)) {
      body = `+${body.replace(MINUS, '')}`;
    }
  }
  if (ccy === 'USD') {
    const core = body.replace(MINUS, '-').replace(/^\+/, '+').replace(/^-/, '-');
    if (core.startsWith('+')) {
      return `+$${core.slice(1)}`;
    }
    if (core.startsWith('-')) {
      return `-$${core.slice(1)}`;
    }
    return `$${core}`;
  }
  if (opts.compact) {
    return body;
  }
  return `${body} ${ccy}`;
}

export function formatPrice(d: Dec): string {
  let s = d.toFixed();
  if (s.includes('.')) {
    s = s.replace(/\.?0+$/, '');
  }
  return s;
}

/** Bounded display for inputs and detail rows (avoids full canonical precision). */
export function formatPriceForDisplay(d: Dec, maxDp = 8): string {
  let s = d.toDecimalPlaces(maxDp, ROUND_HALF_EVEN).toFixed(maxDp);
  if (s.includes('.')) {
    s = s.replace(/\.?0+$/, '');
  }
  if (s === '-0') {
    return '0';
  }
  return s;
}

export function formatQty(d: Dec): string {
  return formatPrice(d);
}

export function formatR(d: Dec | null): string {
  if (d === null) {
    return '—';
  }
  let body = formatGrouped(d, 2);
  if (isPos(d)) {
    body = `+${body.replace(MINUS, '')}`;
  }
  return `${body}R`;
}

export function formatPercent(d: Dec | null, dp: number): string {
  if (d === null) {
    return '—';
  }
  return `${formatGrouped(d, dp)}%`;
}

/** Formats a unitless ratio (e.g. 0.0182) as a signed percentage (1.82%). */
export function formatRatioAsPercent(d: Dec | null, dp: number): string {
  if (d === null) {
    return '—';
  }
  if (d.isZero()) {
    return `0.${'0'.repeat(dp)}%`;
  }
  const pct = d.mul(100);
  const rounded = pct.toDecimalPlaces(dp, ROUND_HALF_EVEN);
  let body = formatGrouped(rounded, dp);
  if (rounded.isPositive() && !body.startsWith('+')) {
    body = `+${body.replace(MINUS, '')}`;
  }
  return `${body}%`;
}

export function moneyA11yLabel(d: Dec, ccy: QuoteCurrency): string {
  if (isZero(d)) {
    return 'zero';
  }
  const amount = formatGrouped(abs(d), 2);
  const kind = isPos(d) ? 'profit' : 'loss';
  if (ccy === 'USD') {
    return `${kind} ${amount} US dollars`;
  }
  return `${kind} ${amount} ${ccy}`;
}
