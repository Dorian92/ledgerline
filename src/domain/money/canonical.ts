import { dec, type Dec, MoneyError } from './dec';

const CANONICAL_RE = /^-?(0|[1-9]\d*)(\.\d*[1-9])?$/;

export function toCanonical(d: Dec): string {
  if (d.isZero()) {
    return '0';
  }
  let s = d.toFixed();
  if (s.includes('.')) {
    s = s.replace(/\.?0+$/, '');
  }
  if (s === '-0') {
    return '0';
  }
  return s;
}

export function fromCanonical(s: string): Dec {
  if (!CANONICAL_RE.test(s)) {
    throw new MoneyError(`Not canonical: ${s}`);
  }
  return dec(s);
}
