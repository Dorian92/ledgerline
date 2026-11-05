# 19 — Tilt detector (rule-based) and the dashboard tilt banner

## Goal
Three transparent, rule-based behavior flags computed on-device from the user's closed trades, with visible thresholds, sample-size gating and
non-predictive copy; plus the dashboard "Tilt warning" banner for today's revenge-pattern trades.

## Depends on
18 (07, 09).

## Read first
This plan (normative rule definitions), `docs/financial-semantics.md` §3.4, §7; `docs/monetization.md` (no "AI" claims).

## Rule definitions (normative)
Input: the closed trades of the active account within the Insights period, sorted by `(closedAt, id)`, plus the display `tz`. Thresholds live in prefs `tilt_thresholds` with these defaults:

1. **Quick re-entry after a loss** (`revenge`)
   - A trade T is *flagged* if there's a losing trade L (same account) with `L.closedAt ≤ T.openedAt ≤ L.closedAt + W`, with `W = 5 min` (options 5/10/15/30).
   - Output: `flaggedCount`, flagged win rate, flagged avg net, flagged avg R (over R-available trades, with n), the same stats for non-flagged trades, and the flagged Σ net.
   - Shown when `closedCount ≥ 20` **and** `flaggedCount ≥ 3`. Otherwise "Not enough data (needs 20 trades and 3 matches; you have X/Y)".
   - Copy: "**Trades opened soon after a loss**: 7 trades opened within 5 min of a losing trade · avg −0.8R vs +0.4R otherwise."
2. **Larger size after a losing streak** (`oversize`)
   - Streak = `N = 3` consecutive losses by close order (a breakeven or a win ends a streak). For each streak, the *next trade* = the first trade with `openedAt ≥ last loss closedAt`.
   - Size = notional at entry = `entry × maxQuantity` (quote units). Notional is used because stops/risk are often missing; this is documented in the "How" sheet. Baseline = the median notional of up to 20 closed trades that closed before the streak's first loss (requires ≥ 10, otherwise that streak is skipped).
   - The streak is *flagged* if `nextSize ≥ M × baseline` with `M = 1.5`.
   - Output: streaks evaluated, flagged count, the median ratio of flagged instances ("+68%"), and the flagged next trades' Σ net.
   - Shown when `closedCount ≥ 20` and `evaluated ≥ 2`. Card state "No oversizing found in N streaks" when 0 are flagged (that's informative, not an error).
3. **Weaker time of day** (`hours`)
   - 6 blocks of 4 hours by the local `openedAt` hour: 00–04, 04–08, …, 20–24.
   - For each block with `n_block ≥ 10` and `n_rest ≥ 10`: `WR_block` vs `WR_rest` (win rate per §6, breakevens excluded).
   - Flag the block if `WR_block ≤ WR_rest − 15 pp`. Report the worst flagged block (largest gap) and the count of other flagged blocks.
   - Copy: "**Lower win rate 20:00–24:00**: 31% (n=26) vs 62% at other times · −$1,024 net in this block."
   - Shown when `closedCount ≥ 30`.

The thresholds `W`, `N`, `M` and the 15 pp gap are user-adjustable in Settings → Insights rules (bounded choices: W ∈ {5,10,15,30} min, N ∈ {2,3,4,5}, M ∈ {1.25,1.5,2}, gap ∈ {10,15,20} pp). The minimum samples aren't adjustable.

## Scope
1. `src/domain/insights/tilt.ts`: `evaluateTilt(trades, { tz, thresholds }): TiltReport` with one result object per rule: `{ id, status: 'insufficient'|'clear'|'flagged', stats, sample: {...}, thresholds }`.
   `todayRevengeTrades(trades, now, tz, W): string[]` (ids; no sample gate, since it's a factual statement).
2. Insights section "Tilt detector" (below the charts), 3 cards like the mockup (icon tile, bold title, secondary detail). Each card has a "How is this calculated?" link → a sheet with the rule definition in plain words, the thresholds in use, the sample sizes and the caveat:
   "This describes patterns in your past trades. It doesn't predict future results and isn't financial advice."
3. Settings → Insights rules screen (`app/settings/insights-rules.tsx`) with the bounded pickers and "Reset to defaults".
4. Dashboard banner (step 09 slot): when `todayRevengeTrades.length ≥ 1` and not dismissed today: red-bordered `Banner` "Tilt warning" + "N trades opened within W min of a loss today". Tap → Insights; ✕ → dismiss for today (`dismissed_tilt_day` pref).
5. Copy rules: no "you will", "predict", "AI", "smart"; use "opened", "after", "in your past trades".

## Out of scope
Notifications about tilt, ML, cross-account analysis, emotion-tag correlation (future).

## Tests
- Each rule on hand-built sequences: boundary at exactly W (inclusive), W+1 ms (not flagged); a loss closing after T opened (not flagged); streaks broken by breakeven; a baseline with < 10 prior trades skipped; median ratio computation; hour blocks across midnight in the display tz; DST day.
- Sample gating: 19 trades → insufficient; thresholds change the results.
- The demo seed at fixed `now` produces `flagged` for all three rules (it was seeded that way in step 06).
- The banner shows/hides/dismisses per day (component test with a mocked clock).
- Copy lint test: the rendered strings from all tilt cards don't match `/predict|will|AI|smart|guarantee/i`.

## Acceptance criteria
The rules exactly match the definitions above; the thresholds and sample sizes are visible in the UI; the banner appears in demo mode "today".

## Gates
A, D (`e2e/tilt.yaml`: demo; dashboard banner visible → tap → Insights; open a "How" sheet; change W in settings → the card text updates), V.

## Visual check
Compare the tilt cards with the overview's "Tilt detector" section and the banner with the dashboard mockup.
