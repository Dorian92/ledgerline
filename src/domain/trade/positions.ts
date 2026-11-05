import { add, div, max, mul, sub, ZERO, type Dec } from '../money/dec';
import type {
  BuiltTrade,
  FillInput,
  FillKey,
  PositionBuildResult,
  PositionSide,
} from './types';

interface PositionState {
  qty: Dec;
  avgEntry: Dec;
  maxAbsQty: Dec;
  feesQuote: Dec;
  feesComplete: boolean;
  openedAt: number;
  closedAt: number;
  exitQtySum: Dec;
  exitNotional: Dec;
  sourceIndexes: number[];
  realized: Dec;
  orphan: boolean;
}

function keyStr(k: FillKey): string {
  return `${k.symbol}\u001f${k.positionSide}`;
}

function fresh(): PositionState {
  return {
    qty: ZERO,
    avgEntry: ZERO,
    maxAbsQty: ZERO,
    feesQuote: ZERO,
    feesComplete: true,
    openedAt: 0,
    closedAt: 0,
    exitQtySum: ZERO,
    exitNotional: ZERO,
    sourceIndexes: [],
    realized: ZERO,
    orphan: false,
  };
}

function isReduce(side: 'buy' | 'sell', positionSide: PositionSide, qty: Dec): boolean {
  if (positionSide === 'long') {
    return side === 'sell';
  }
  if (positionSide === 'short') {
    return side === 'buy';
  }
  if (qty.isZero()) {
    return false;
  }
  if (qty.isPositive()) {
    return side === 'sell';
  }
  return side === 'buy';
}

function signedQtyAfterOpen(
  side: 'buy' | 'sell',
  positionSide: PositionSide,
  qty: Dec,
  q: Dec,
): Dec {
  if (positionSide === 'long') {
    return qty.isZero() ? q : add(qty, q);
  }
  if (positionSide === 'short') {
    return qty.isZero() ? q.negated() : sub(qty, q);
  }
  if (qty.isZero()) {
    return side === 'buy' ? q : q.negated();
  }
  if (qty.isPositive()) {
    return side === 'buy' ? add(qty, q) : sub(qty, q);
  }
  return side === 'sell' ? sub(qty, q.negated()) : add(qty, q);
}

function buildClosedTrade(state: PositionState, symbol: string): BuiltTrade {
  const exitPrice = div(state.exitNotional, state.exitQtySum);
  const direction = state.qty.isPositive() || state.maxAbsQty.equals(state.exitQtySum)
    ? 'long'
    : 'short';
  const dir: 'long' | 'short' =
    state.realized.gte(ZERO) && exitPrice.gte(state.avgEntry) ? 'long' : direction;
  return {
    symbol,
    baseAsset: symbol.replace(/-PERP$/, '').split('/')[0] ?? symbol,
    quoteAsset: 'USDT',
    instrument: 'perp',
    direction: dir,
    openedAt: state.openedAt,
    closedAt: state.closedAt,
    entryPrice: state.avgEntry,
    exitPrice,
    quantity: state.exitQtySum,
    maxQuantity: state.maxAbsQty,
    fees: state.feesQuote,
    feesComplete: state.feesComplete,
    pnlSource: 'computed',
    reportedGrossPnl: state.realized,
    sourceIndexes: [...state.sourceIndexes],
  };
}

function closePosition(state: PositionState, symbol: string, closed: BuiltTrade[]): PositionState {
  closed.push(buildClosedTrade(state, symbol));
  return fresh();
}

function applyOpen(state: PositionState, fill: FillInput, q: Dec): PositionState {
  const flat = state.qty.isZero();
  const newQty = signedQtyAfterOpen(fill.side, fill.key.positionSide, state.qty, q);
  const absNew = newQty.abs();
  const avgEntry = flat
    ? fill.price
    : div(add(mul(state.avgEntry, state.qty.abs()), mul(fill.price, q)), add(state.qty.abs(), q));
  return {
    ...state,
    qty: newQty,
    avgEntry,
    maxAbsQty: max(state.maxAbsQty, absNew),
    feesQuote: add(state.feesQuote, fill.feeQuote),
    feesComplete: state.feesComplete && !fill.feeOther,
    openedAt: flat ? fill.executedAt : state.openedAt,
    closedAt: fill.executedAt,
    sourceIndexes: [...state.sourceIndexes, fill.sourceIndex],
  };
}

function applyReduce(
  state: PositionState,
  fill: FillInput,
  q: Dec,
  feePortion: Dec,
): PositionState {
  const sign = state.qty.isPositive() ? 1 : -1;
  const realizedAdd = mul(mul(sub(fill.price, state.avgEntry), q), sign);
  const newQty = state.qty.isPositive() ? sub(state.qty, q) : add(state.qty, q);
  return {
    ...state,
    qty: newQty,
    exitQtySum: add(state.exitQtySum, q),
    exitNotional: add(state.exitNotional, mul(fill.price, q)),
    realized: add(state.realized, realizedAdd),
    feesQuote: add(state.feesQuote, feePortion),
    feesComplete: state.feesComplete && !fill.feeOther,
    closedAt: fill.executedAt,
    sourceIndexes: [...state.sourceIndexes, fill.sourceIndex],
  };
}

function processGroup(
  symbol: string,
  positionSide: PositionSide,
  fills: FillInput[],
  mode: 'one-way' | 'hedge',
  closed: BuiltTrade[],
  errors: PositionBuildResult['errors'],
  stillOpen: PositionBuildResult['stillOpen'],
): void {
  let state = fresh();
  for (const fill of fills) {
    if (state.orphan) {
      errors.push({ sourceIndex: fill.sourceIndex, code: 'opened_before_export' });
      continue;
    }
    const q = fill.quantity;
    const flat = state.qty.isZero();
    const reduce = isReduce(fill.side, positionSide, state.qty);

    if (flat && reduce && positionSide !== 'both') {
      state.orphan = true;
      errors.push({ sourceIndex: fill.sourceIndex, code: 'opened_before_export' });
      continue;
    }

    if (!reduce || (flat && positionSide === 'both')) {
      state = applyOpen(state, fill, q);
      continue;
    }

    const absQty = state.qty.abs();
    if (q.gt(absQty)) {
      if (mode === 'hedge') {
        errors.push({ sourceIndex: fill.sourceIndex, code: 'inconsistent_hedge_flip' });
        continue;
      }
      const closePart = absQty;
      const openPart = sub(q, closePart);
      const feeClose = mul(fill.feeQuote, div(closePart, q));
      const feeOpen = sub(fill.feeQuote, feeClose);
      state = applyReduce(state, fill, closePart, feeClose);
      if (!state.qty.isZero()) {
        errors.push({ sourceIndex: fill.sourceIndex, code: 'residual_quantity' });
      } else {
        state = closePosition(state, symbol, closed);
      }
      state = {
        ...fresh(),
        qty: fill.side === 'buy' ? openPart : openPart.negated(),
        avgEntry: fill.price,
        maxAbsQty: openPart,
        feesQuote: feeOpen,
        feesComplete: !fill.feeOther,
        openedAt: fill.executedAt,
        closedAt: fill.executedAt,
        sourceIndexes: [fill.sourceIndex],
      };
      continue;
    }

    state = applyReduce(state, fill, q, fill.feeQuote);
    if (state.qty.isZero()) {
      state = closePosition(state, symbol, closed);
    }
  }

  if (!state.qty.isZero()) {
    stillOpen.push({
      key: { symbol, positionSide },
      sourceIndexes: state.sourceIndexes,
    });
  }
}

export function buildPositionsFromFills(
  fills: FillInput[],
  opts: { mode: 'one-way' | 'hedge' },
): PositionBuildResult {
  const sorted = [...fills].sort(
    (a, b) => a.executedAt - b.executedAt || a.sourceIndex - b.sourceIndex,
  );
  const groups = new Map<string, FillInput[]>();
  for (const f of sorted) {
    const k = keyStr(f.key);
    const g = groups.get(k) ?? [];
    g.push(f);
    groups.set(k, g);
  }

  const closed: BuiltTrade[] = [];
  const stillOpen: PositionBuildResult['stillOpen'] = [];
  const errors: PositionBuildResult['errors'] = [];

  for (const [k, group] of groups) {
    const [symbol, positionSide] = k.split('\u001f') as [string, PositionSide];
    processGroup(symbol, positionSide, group, opts.mode, closed, errors, stillOpen);
  }

  return { closed, stillOpen, errors };
}
