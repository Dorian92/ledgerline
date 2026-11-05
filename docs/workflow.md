# Ledgerline — Execution workflow (for implementation and review agents)

This repo was planned up front so that implementation agents (Composer/Grok) can execute without re-planning.

## Per-step loop

1. **Pick** the first unchecked step in `docs/roadmap.md` whose dependencies are all ✔ (agent gate) and whose
   user actions (U-xx) are done, or whose plan says how to proceed without them.
2. **Read** `docs/plans/<step>.md` completely, plus the docs it references. The plan is the contract.
3. **Implement** only what's in "Scope". Anything in "Out of scope" stays out, even if it's easy.
4. **Gate**: run `npm run check` (G-A). For 📱 steps also run the device gate (G-D), and for 🎨 steps the visual gate (G-V),
   per `docs/testing-strategy.md`.
5. **Review** by an independent agent (a fresh context), using the plan's "Review checklist" plus the general checklist below.
   The reviewer fixes the issues it finds (or sends them back) and re-runs the gates.
6. **Record**: tick the step's checkboxes in `docs/roadmap.md`, append new decisions to `docs/decisions.md`
   and open questions to `docs/financial-semantics.md`, and write a short entry in `docs/progress-log.md`
   (date, step, commit SHA, gates run with results, deviations, follow-ups).
7. **Commit** with `step <NN>: <summary>` (one or more commits per step). Push.

### Branching

- While the repository is an unpublished draft: commit directly to `main`, one step at a time, and only after the gates pass.
- Once the forge supports PRs for this repo (U-12): branch `step/<NN>-<slug>` from `main`, open one PR per step,
  review in the PR, and merge after the gates are green. Don't stack more than one unmerged step unless the roadmap marks them parallel.

## When the plan is wrong or incomplete

- A plan detail that's **wrong or impossible** (an API changed, a library is incompatible): pick the smallest
  faithful alternative, record it as a decision (`D-NNN`), and note it in the progress log.
- A **financial or import semantics** gap: don't guess. Add it to "Open questions" in
  `financial-semantics.md`, implement the case as an explicit unsupported/error path, and continue.
- A **blocking user action**: stop that step, report the U-id, and move to the next unblocked step
  (the roadmap's dependency graph shows the parallel options).

## General review checklist (applies to every step)

- [ ] Only scoped files/behavior changed. Nothing in `Out of scope` added. No new dependencies beyond those the plan names (or recorded as a decision).
- [ ] No floats on money/qty/price in `src/domain`/`src/data` (`grep -rn "parseFloat\|Number(" src/domain src/data`, and justify each hit).
- [ ] Domain code has no React/Expo imports. Features don't import the DB directly.
- [ ] Time-dependent code takes `now`/`tz`. No `new Date()` inside domain functions.
- [ ] Tests cover the plan's listed cases, and the tests fail if the implementation is broken (spot-check by mutating one line).
- [ ] UI: loading/empty/error states, accessibility labels, 48 dp targets, hide-amounts respected, demo pill shown in demo mode.
- [ ] No network calls, no analytics, no secrets, no credentials requested.
- [ ] Copy is honest: no "AI", predictions or advice, and no unverified exchange support claims.
- [ ] Docs updated (roadmap boxes, decisions, progress log, README if commands changed).

## Hard constraints (all steps)

- Never touch Dorian's other apps (Pulse, Holdfast) or any repository other than this one.
- No iOS/Xcode setup. Android emulator only.
- No paid or recurring services. No backend. No push notifications.
- Never commit raw (non-anonymized) exchange exports, keystores, or `.env` files with secrets.
