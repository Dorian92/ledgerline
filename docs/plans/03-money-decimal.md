# 03 — Money and decimal domain

## Goal

Provide the only allowed way to parse, compute, store and format prices, quantities and amounts.

## Depends on

1.

## Read first

`docs/financial-semantics.md` §1 and §8, `docs/data-model.md` (Conventions).

## Scope

1. `npm i decimal.js date-fns @date-fns/tz` and `npm i -D fast-check`.
2. `src/domain/money/dec.ts`:
   - A configured clone: `const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_EVEN, toExpNeg: -40, toExpPos: 40 })`.
   - `export type Dec = InstanceType<typeof D>` (or an opaque wrapper; a plain clone is fine).
   - `dec(value: string | Dec): Dec`. Throws `MoneyError` on invalid input. **No `number` overload**, except `decFromInt(n: number)` for integer literals with an `Number.isSafeInteger` assert.
   - Helpers: `ZERO`, `add`, `sub`, `mul`, `div` (throws on divide by zero), `neg`, `abs`, `cmp`, `isZero`, `isPos`, `isNeg`, `sum(Dec[])`, `max`, `min`.
3. `src/domain/money/canonical.ts`: `toCanonical(d: Dec): string` → no exponent, trimmed trailing zeros, `"0"` for zero (including `-0`), `-` sign.
   `fromCanonical(s: string): Dec` validates the regex `^-?(0|[1-9]\d*)(\.\d*[1-9])?$`.
4. `src/domain/money/parse.ts`: `parseUserDecimal(input: string): { ok: true; value: Dec } | { ok: false; reason: 'empty'|'invalid'|'grouping' }`,
   implementing §8 input rules (trim, `,` as decimal only if there's no `.` and exactly one `,`, reject grouping, reject exponent in user input).
   `parseCsvDecimal(input: string, opts: { allowExponent: boolean; allowGrouping?: ','; stripSuffix?: string[] })` for importers.
5. `src/domain/money/format.ts`:
   - `formatMoney(d: Dec, ccy: QuoteCurrency, opts?: { sign?: 'always'|'negative'; compact?: boolean; hidden?: boolean }): string`
     → `+$2,526.40` (USD) or `+2,526.40 USDT`; `hidden` → `••••`; U+2212 minus.
   - `formatPrice(d)`, `formatQty(d)`, `formatR(d | null)` → `+2.04R` / `—`, `formatPercent(d | null, dp)`.
   - `moneyA11yLabel(d, ccy)` → `"profit 2,526.40 US dollars"` / `"loss 138.50 USDT"` / `"zero"`.
   - Grouping implemented manually on the canonical string (not `Intl.NumberFormat`, to avoid float conversion).
6. `src/domain/money/types.ts`: `QuoteCurrency = 'USDT'|'USDC'|'USD'`, `isQuoteCurrency`.
7. `src/domain/time/tz.ts`: `localDayKey(epochMs, tz): 'YYYY-MM-DD'`, `localHour(epochMs, tz)`, `startOfLocalDay(epochMs, tz): number`,
   `addLocalDays(dayKey, n)`, `parseInZone(dateString, pattern, tz): number` (wraps `@date-fns/tz` TZDate + date-fns `parse`). `resolveDisplayTz(pref: 'device'|'UTC'): string` lives in platform code, not here.
8. `src/ui/Money.tsx`: the component using `formatMoney` and color rules (design-system §3), reading `hidden` from props (the store comes later).
9. Enable a Jest `coverageThreshold` for `src/domain/**`: 90% lines/branches/functions.

## Out of scope

Trade logic, metrics, currency conversion.

## Tests

- Canonical round-trip property: for random decimal strings, `toCanonical(fromCanonical(s)) === s` for canonical s; `toCanonical(dec('1.50')) === '1.5'`; `-0` → `'0'`; `1e-8` → `'0.00000001'`.
- Arithmetic: `0.1 + 0.2 = 0.3` exactly; division by zero throws.
- parseUserDecimal: `'68,412.5'` → grouping error; `'0,15'` → `0.15`; `' 12 '` → 12; `'1e5'` → invalid; `''` → empty; `'-3.2'` ok.
- format: rounding half-even at 2 dp (`'2.345'` → `2.34`, `'2.355'` → `2.36`); negative with U+2212; USD glyph vs USDT suffix; hidden; `formatR(null)` = `—`; large numbers `1234567.891` → `1,234,567.89`.
- tz: `localDayKey` across DST in `Europe/Berlin` (2026-03-29, 2026-10-25), `Asia/Kolkata` offsets, and UTC midnight boundaries. `startOfLocalDay` on a DST day.
- Hermes check: a dev-only test screen isn't needed. Instead, add `src/platform/__devchecks__/intlTz.ts`, run once at dev startup (`__DEV__`), which logs a warning if `new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Berlin' })` throws. Note in the progress log whether it passed on the emulator.

## Acceptance criteria

- All tests green, coverage ≥ 90% for `src/domain/money` and `src/domain/time`.
- No use of JS `number` for amounts anywhere in these modules except `decFromInt`.

## Gates

A. (D optional: record the Hermes Intl tz result if an emulator is available.)

## Review checklist

- [ ] `formatMoney` never calls `toNumber()`.
- [ ] Rounding mode is half-even everywhere and documented in code comments only where non-obvious.

## Risks / notes

If Hermes lacks `Intl` timeZone support on the target, `@date-fns/tz` fails. In that case, record a decision to add the
`@formatjs/intl-datetimeformat` polyfill with the tz data needed (the bundle-size cost is acceptable).
