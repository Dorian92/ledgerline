# 25 — Quality hardening: accessibility, performance, errors and states

## Goal

Systematically audit and fix accessibility, performance budgets, error handling and screen states across the finished app.

## Depends on

10, 17, 21, 23, 24 (all user-facing features).

## Read first

`docs/design-system.md` §5–§6, `docs/testing-strategy.md` (Performance budgets), `docs/architecture.md` §7.

## Scope

1. **States audit**: create `docs/qa/states-matrix.md`, a table of every screen × {loading, empty, error, insufficient data, demo, hidden amounts, locked}, with ✔/✘ and evidence. Fix every ✘.
2. **Error handling**:
   - A root `ErrorBoundary` (architecture §7) with Restart (`expo-updates` isn't used, so use `DevSettings.reload` in dev and, in production, a state reset that remounts the root) and "Copy error details" (`expo-clipboard`).
   - The DB recovery screen for migration/open failures: "Export raw database file" (copy the `.db` to cache → share) and "Reset app data" (double confirm).
   - React Query `onError` defaults → a non-blocking toast; there are no silent catches (grep for `catch {}` / `catch (e) {}`).
3. **Accessibility audit** with TalkBack and Google's Accessibility Scanner app on the emulator: every screen, at font scale 1.0 and 1.3, and with "Remove animations" on. Record the findings in `docs/qa/a11y-audit.md` (issue, screen, severity, fix commit). Fix all blockers/majors.
   Check: labels for icon buttons, money labels, chart summaries, focus order in sheets, the lock overlay focus trap, a 48 dp minimum, contrast.
4. **Performance**:
   - A dev-only "Seed 10k trades" action (in the dev gallery; it writes to the demo DB only).
   - Measure on the emulator (dev and `--variant release`): cold start, dashboard compute (a dev-only `performance.now()` timing log), period switch, history scroll (the RN perf monitor), import of 5k rows. Record the results in `docs/qa/performance.md` against the budgets.
   - Fix regressions: memoize view models, `React.memo` rows, FlashList `getItemType`, avoid re-parsing Dec in render (precompute display strings in the view model).
5. **Robustness**: rotation is locked to portrait (already done); app backgrounded during import/restore (the transaction completes or rolls back; the UI resumes the correct state); a low-storage write failure surfaces an error (simulate by throwing from the adapter in tests).
6. **Copy review**: grep the UI strings for banned claims (`AI`, `predict`, `guarantee`, `best`, `only app`, `first`) and fix any hits.

## Out of scope

New features; redesigns beyond fixing audit findings.

## Tests

Add regression tests for each fixed bug; an ErrorBoundary component test; the recovery-screen component test.

## Acceptance criteria

All states-matrix cells ✔; no open a11y blockers/majors; every budget met or documented with a justified exception approved in the progress log; `npm run check` green.

## Gates

A, D.
