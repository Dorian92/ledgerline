import { dec, type Dec, MoneyError } from './dec';

export type ParseUserResult =
  { ok: true; value: Dec } | { ok: false; reason: 'empty' | 'invalid' | 'grouping' };

export function parseUserDecimal(input: string): ParseUserResult {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { ok: false, reason: 'empty' };
  }
  if (/[eE]/.test(trimmed)) {
    return { ok: false, reason: 'invalid' };
  }
  if (/,/.test(trimmed) && /\.\d/.test(trimmed)) {
    return { ok: false, reason: 'grouping' };
  }
  if (/\d,\d{3}/.test(trimmed)) {
    return { ok: false, reason: 'grouping' };
  }
  let normalized = trimmed;
  if (!trimmed.includes('.') && (trimmed.match(/,/g)?.length ?? 0) === 1) {
    normalized = trimmed.replace(',', '.');
  } else if (trimmed.includes(',')) {
    return { ok: false, reason: 'grouping' };
  }
  try {
    return { ok: true, value: dec(normalized) };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

export function parseCsvDecimal(
  input: string,
  opts: { allowExponent?: boolean; allowGrouping?: ','; stripSuffix?: string[] } = {},
): Dec {
  let s = input.trim();
  for (const suffix of opts.stripSuffix ?? []) {
    if (s.endsWith(suffix)) {
      s = s.slice(0, -suffix.length).trim();
    }
  }
  if (!opts.allowExponent && /[eE]/.test(s)) {
    throw new MoneyError(`Exponent not allowed: ${input}`);
  }
  if (opts.allowGrouping === ',' && s.includes(',')) {
    if (/\d,\d{3}/.test(s)) {
      throw new MoneyError(`Grouping not allowed: ${input}`);
    }
  }
  return dec(s);
}
