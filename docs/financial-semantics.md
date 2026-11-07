# Ledgerline — Financial semantics (normative)

This document is the **source of truth** for every number Ledgerline shows. Code in `src/domain` must
match it, and the tests cite section numbers (for example `// §3.2`). If an implementer finds a case it
doesn't cover, they must **not guess**. They add it to "Open questions" at the end and mark the case
unsupported in code.

Ledgerline describes the user's past trades. It never gives predictions or advice.

## 1. Units and representation

| Quantity                           | Unit                                                                 | Representation     |
| ---------------------------------- | -------------------------------------------------------------------- | ------------------ |
| price                              | quote currency per 1 base unit (e.g. USDT per BTC)                   | `Dec`              |
| quantity                           | base asset units (e.g. BTC), always > 0. Direction carries the sign. | `Dec`              |
| notional                           | quote units = price × quantity                                       | `Dec`              |
| fees, funding, PnL, risk, balances | quote currency of the account (`USDT`/`USDC`/`USD`)                  | `Dec`              |
| R multiple                         | dimensionless                                                        | `Dec`              |
| timestamps                         | epoch ms UTC                                                         | `number` (integer) |

- `Dec` = `decimal.js` configured with `precision: 40` and `rounding: ROUND_HALF_EVEN` for internal
  arithmetic. **No intermediate rounding.** Rounding happens only at display (§8) and when storing
  canonical strings, which are exact and unrounded.
- Supported in v1: **linear** instruments only (spot, USDT-margined/USDC-margined perpetuals) where
  PnL = Δprice × base qty in the quote currency.
- **Unsupported in v1:** inverse/coin-margined contracts, options, dated futures with a non-linear
  multiplier, margin interest, cross-currency trades (quote ≠ account quote), and contract-denominated
  quantities without a verified contract size (see import-spec). These are rejected with an explicit
  reason. They are never approximated.
- USDT, USDC and USD are treated as distinct currencies, with no conversion. The `$` glyph is display
  shorthand only (§8).

## 2. Trade lifecycle

- A **trade** is one position on one symbol in one direction, from first entry to flat (or still open).
- `status = 'open'`: no exit, no PnL, excluded from every metric. It's shown in history in an "Open" section.
- `status = 'closed'`: has `closedAt ≥ openedAt`, `exitPrice`, `quantity` (= total closed qty).
- Manual trades have a single average entry and a single average exit. Scaling in and out manually is
  recorded as average prices with the total quantity. That's exact for linear PnL (see §3.1).

## 3. Per-trade calculations (`src/domain/trade/compute.ts`)

### 3.1 Gross PnL

- Long: `gross = (exit − entry) × qty`
- Short: `gross = (entry − exit) × qty`
- `entry`/`exit` are quantity-weighted average prices (`Σ pᵢqᵢ / Σ qᵢ`, unrounded).
- If `pnlSource = 'exchange'`, then `gross = reportedGrossPnl`, and the computed value is used only for a
  consistency check. A mismatch larger than `max(0.01, 0.0001 × |gross|)` raises an import warning
  `pnl_mismatch`. The trade still stores the exchange value.

### 3.2 Net PnL

`net = gross − fees + funding`

- `fees` are positive costs. A maker rebate is a negative fee, so it increases net.
- `funding` is signed: positive = received, negative = paid.
- `fundingStatus`: `included` (funding is known and present), `none` (spot, or a user-confirmed zero),
  `unknown` (the export has no funding; the value is treated as 0 and **flagged**). Metrics that include any
  trade with `unknown` funding show a footnote: "Funding not included for N trades".
- `feesComplete = false` (some fee was in a non-quote asset such as BNB): fees in other assets are **not
  converted**. Only quote-denominated fees are subtracted, and the trade and metrics show
  "Fees incomplete for N trades".

### 3.3 Risk and R multiple

- `risk = |entry − stop| × R_qty`, where `R_qty = maxQuantity` (the peak open quantity; equals `quantity` for manual trades).
- R is **available** only if all of these hold:
  1. `stop` is present (otherwise `no_stop`),
  2. the stop is on the loss side: long → `stop < entry`, short → `stop > entry` (otherwise `stop_wrong_side`),
  3. `risk > 0` (otherwise `zero_risk`),
  4. the trade is closed (otherwise `open`).
- `R = net / risk` (net, so after fees and funding). Fees aren't added to risk.
- When R is unavailable, the UI shows "—" with the reason on the detail screen ("Add a stop to see R").
  **R is never estimated** from leverage, a percentage, or an account default.
- Breakeven stops (stop == entry) give `zero_risk`, so R is unavailable. This is intentional, because the
  initial risk is unknown.

Worked example (mockup quick add, long BTC-PERP): entry 68,412.5, exit 69,240.0, qty 0.150, stop 68,020.0,
fees 4.10, funding 0 (none).
gross = 827.5 × 0.15 = **124.125**. net = 124.125 − 4.10 = **120.025**. risk = 392.5 × 0.15 = **58.875**.
R = 120.025 / 58.875 = **2.0386…**, displayed as **+2.04R**.
The mockup shows +$124.13 / +2.11R, which is gross-based. Ledgerline shows net as the headline and gross
as a secondary line. The test `compute.test.ts` encodes this example.

### 3.4 Outcome classification

- Round `net` to the account's display precision (2 dp, half-even).
- `win` if > 0, `loss` if < 0, `breakeven` if = 0.

## 4. Positions from fills (`src/domain/trade/positions.ts`, import only)

Input: the fills for one `(account, symbol, positionSide)`, sorted by `executedAt` then source row index.
`positionSide` is `long`/`short` in hedge mode and `both` in one-way mode.

Average-cost method (this matches how Binance, Bybit and OKX report realized PnL for linear perps):

- State: `qty` (signed: + long, − short), `avgEntry`, `maxAbsQty`, `fees`, `openedAt`, `fills[]`.
- **Opening/increasing fill** (same sign as position, or the position is flat): `avgEntry = (avgEntry×|qty| + p×q) / (|qty|+q)`; `qty += ±q`.
- **Reducing fill** (opposite sign, `q ≤ |qty|`): realized `+= (p − avgEntry) × q × sign(qty)`; `qty` moves toward 0; `avgEntry` unchanged. The exit average accumulates `Σ p q / Σ q` over the reducing fills.
- **Close**: when `qty == 0` exactly, emit a closed trade: `entry = avgEntry` at the time of the first reduction
  (it's constant across reductions), `exit` = the exit average, `quantity = Σ reducing q`, `maxQuantity = maxAbsQty`,
  `fees = Σ fees` of all fills in the quote asset, `openedAt` = first fill, `closedAt` = last fill.
  The result is `gross = realized` (identical to §3.1 by construction; asserted in a property test).
- **Flip** (opposite-sign fill with `q > |qty|`): split the fill into a closing part `|qty|` and an opening
  part `q − |qty|`. The fee is **prorated by quantity** (exact decimal division). Close the trade, then open a new one.
  In hedge mode a flip is impossible; if it happens there, raise `error: inconsistent_hedge_fill`.
- **Orphan reduce** (the first fill for a key reduces a flat position, because the position was opened
  before the export window): every fill of that key until it's flat again is marked
  `error: opened_before_export`. They aren't imported, and the preview says to export a longer date range.
- **Still open at file end**: not imported (`warning: still_open`) and no fingerprint is stored, so a later
  export that contains the close imports the whole position. v1 does **not** import open positions from CSV.
- Quantity tolerance: exact decimal comparison only. Dust (|qty| < 1e-12 after a close) counts as zero **only**
  if the format document declares a step size that justifies it. Otherwise it's `error: residual_quantity`.

## 5. Periods (`src/domain/metrics/periods.ts`)

Let `tz` = the display time zone (device tz by default, or UTC per setting) and `today` = the local date of `now`.

- `7D`: `[startOfDay(today − 6 days), now]`
- `30D`: `[startOfDay(today − 29 days), now]`
- `YTD`: `[startOfDay(Jan 1 of today's year), now]`
- `ALL`: everything
- Trades are assigned to a period **by `closedAt`**. Open trades are excluded.
- DST: day starts are computed with `@date-fns/tz` in `tz`, never as `now − n×86400000`.

## 6. Summary metrics (`src/domain/metrics/summary.ts`)

For the closed trades `T` in a period, sorted by `(closedAt, id)`:

- **Net PnL** = Σ net. **Trade count** = |T|.
- **Win rate** = wins / (wins + losses). Breakevens are excluded and their count is shown. If the denominator is 0, the value is "—".
- **Average R** = mean of R over `T_R` = trades with available R. Shown with its sample size: "avg of 37/142
  trades with a stop". If `T_R` is empty, the value is "—".
- **Profit factor, expectancy**: not in v1 (keeps the scope tight).
- **Equity series**: points `(closedAt_i, E_i)`, where `E_0 = B + Σ net of all closed trades before the period start`,
  `E_i = E_{i−1} + net_i`, and `B = starting_balance` (or 0 if unset). The first point sits at the period start with `E_0`.
- **Max drawdown** (realized, closed-trade equity): `peak_i = max(E_0..E_i)`; `DD_abs = max(peak_i − E_i)`.
  `DD_pct = max((peak_i − E_i) / peak_i)` is shown **only if** `B > 0` and every `peak_i > 0`. Otherwise
  only `DD_abs` in quote units is shown. It's displayed as a negative ("−8.7%").
- **Return %** (hero subtitle) = period net / `E_0`, shown only when `E_0 > 0`.
- Caveat text (info sheet on the metrics row): "Based on closed trades only. Deposits, withdrawals and
  unrealized PnL aren't tracked, so percentages are approximate."

## 7. Grouping by day, hour and calendar (`src/domain/metrics/buckets.ts`)

- **Day** of a closed trade = the local date of `closedAt` in `tz`. **Daily PnL** = Σ net of that day.
- **Hour-of-day** = the local hour (0–23) of **`openedAt`** in `tz` (the decision time). Per hour: count, wins,
  losses, net, win rate.
- **Calendar heatmap** (month view): one cell per local day: net, count. Color intensity =
  `min(1, |net| / max(|net| over the month's days))`, mapped to 4 opacity steps. Green if > 0, red if < 0,
  neutral if 0 or no trades. The month total is in the header.
- History sections are grouped by closed day (newest first). Open trades go in a top "Open" section, ordered by `openedAt` desc.

## 8. Display formatting (`src/domain/money/format.ts`)

- Locale formatting is fixed to `en-US` grouping in v1 (`1,234.56`). Input parsing accepts `.` or `,` as
  the decimal separator (a `,` is treated as decimal only when the input contains no `.` and exactly one `,`). No grouping is allowed in input.
- PnL and money: 2 dp, half-even, explicit sign (`+`/`−`, using U+2212 for minus in display and `-` in
  accessibility labels). Currency: `$` prefix for `USD`; for `USDT`/`USDC` the amount is followed by the code in
  secondary text ("+2,526.40 USDT"). Compact contexts (widget, list rows) may show the code once per section header instead.
- Prices: as entered/imported, trimmed of trailing zeros, at least 1 dp, max 8 dp.
- Quantities: as stored, max 8 dp, never rounded to 0. Show "<0.00000001" if needed.
- R: 2 dp with sign and suffix `R` ("+2.04R").
- Percent: 1 dp for win rate and DD, 2 dp for return.
- Hide amounts (privacy): quote-denominated values render as `••••` (PnL, fees, equity, entry/exit/stop prices, size, calendar day $, and matching accessibility labels). Editable forms mask those fields until **Reveal**; save without edits keeps full canonical decimals from the DB. R, win rate and return/max-DD percentages stay visible.

## 9. Recalculation rules

- Editing any input field of a trade recomputes its derived fields in the same DB transaction.
- Deleting a trade or undoing an import needs no stored aggregates to change (aggregates are computed on read).
  Queries are invalidated and the widget snapshot is refreshed.
- `CALC_VERSION` (starts at 1) bumps whenever §3 changes. On startup, trades with `calc_version < CALC_VERSION` are recomputed in batches of 500 inside transactions.

## Open questions

(Implementers append here, with the step ID and the case. Don't resolve them by guessing.)

- Q-01 (step 11): Do the Bybit/OKX closed-PnL exports emit one row per partial close or per position? This decides import-spec §5 mapping.
