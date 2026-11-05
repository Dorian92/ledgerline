/* eslint-disable import/no-named-as-default */
import Decimal from 'decimal.js';

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

const D = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_EVEN,
  toExpNeg: -40,
  toExpPos: 40,
});

export type Dec = InstanceType<typeof D>;

export const ZERO: Dec = new D(0);

export function dec(value: string | Dec): Dec {
  if (value instanceof D) {
    return value;
  }
  try {
    return new D(value);
  } catch {
    throw new MoneyError(`Invalid decimal: ${value}`);
  }
}

export function decFromInt(n: number): Dec {
  if (!Number.isSafeInteger(n)) {
    throw new MoneyError('decFromInt requires a safe integer');
  }
  return new D(n);
}

export function add(a: Dec, b: Dec): Dec {
  return a.plus(b);
}
export function sub(a: Dec, b: Dec): Dec {
  return a.minus(b);
}
export function mul(a: Dec, b: Dec): Dec {
  return a.times(b);
}
export function div(a: Dec, b: Dec): Dec {
  if (b.isZero()) {
    throw new MoneyError('Division by zero');
  }
  return a.div(b);
}
export function neg(a: Dec): Dec {
  return a.negated();
}
export function abs(a: Dec): Dec {
  return a.abs();
}
export function cmp(a: Dec, b: Dec): number {
  return a.comparedTo(b);
}
export function isZero(a: Dec): boolean {
  return a.isZero();
}
export function isPos(a: Dec): boolean {
  return a.gt(0);
}
export function isNeg(a: Dec): boolean {
  return a.lt(0);
}
export function sum(values: Dec[]): Dec {
  return values.reduce((acc, v) => acc.plus(v), ZERO);
}
export function max(a: Dec, b: Dec): Dec {
  return Decimal.max(a, b);
}
export function min(a: Dec, b: Dec): Dec {
  return Decimal.min(a, b);
}

export { D as DecimalInternal };
export const ROUND_HALF_EVEN = Decimal.ROUND_HALF_EVEN;
