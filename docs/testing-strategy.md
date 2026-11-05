# Ledgerline — Testing strategy and gates

## Test layers

| Layer                          | Tool                                        | Location                                                      | Runs in                                               |
| ------------------------------ | ------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| Domain unit + property         | Jest + `fast-check`                         | `src/domain/**/__tests__/*.test.ts`                           | agent + CI                                            |
| Data/integration (real SQLite) | Jest + `better-sqlite3` behind `Db`         | `src/data/**/__tests__/*.test.ts`                             | agent + CI                                            |
| Import fixtures                | Jest, reads `fixtures/csv/**`               | `src/domain/import/__tests__/`                                | agent + CI                                            |
| Component                      | `@testing-library/react-native` (jest-expo) | `src/features/**/__tests__/*.test.tsx`, `src/ui/**/__tests__` | agent + CI                                            |
| Device E2E smoke               | Maestro                                     | `e2e/*.yaml`                                                  | Android emulator (Dorian's machine, or a VM with KVM) |
| Visual                         | Maestro screenshots + manual comparison     | `e2e/screenshots/`                                            | emulator                                              |

## Gates

**Agent gate (G-A), required for every step:**

```
npm run check      # = npm run typecheck && npm run lint && npm run test -- --ci
```

- `typecheck`: `tsc --noEmit`
- `lint`: `eslint . --max-warnings 0` and `prettier --check .`
- `test`: `jest`. Coverage thresholds (from step 03): `src/domain/**` ≥ 90% lines/branches;
  `src/data/**` ≥ 80%. Enforced through `coverageThreshold` in jest config, with `npm run test:coverage`
  included in `check` from step 05 onward.

**Device gate (G-D), required for steps marked 📱 in the roadmap:**

```
npx expo run:android                 # dev build installs and launches on the emulator
maestro test e2e/<flow>.yaml         # flows named in the step plan
```

If the executing agent has no working emulator, it must say so explicitly in its report and leave the
roadmap's `device ✔` box unchecked. Dorian runs G-D locally. A step can't count as **done** until G-D passes;
the next step may _start_ once G-A passes and only G-D is pending, and the roadmap tracks this.

**Visual gate (G-V), UI steps 🎨:** `docs/design-system.md` §7, with screenshots recorded in `docs/visual-log.md`.

**Release gate (G-R), step 28:** `npm run check`, all Maestro flows green, `scripts/check-release-config.ts` passes,
`./gradlew bundleRelease` succeeds, and a manual smoke on the release APK.

## Rules for test authors

- Financial tests cite `financial-semantics.md` sections and use string decimals (`'68412.5'`), never floats.
- Property tests (fast-check) to include at least: long/short symmetry (`gross_long(e,x,q) = −gross_short(e,x,q)`),
  positions-from-fills realized == §3.1 on the averages, the sum of daily PnL == period net, max DD ≥ 0,
  the import summary invariant, and backup round-trip equality.
- Time-dependent code takes `now` and `tz` as parameters. Tests use fixed instants and at least the zones
  `UTC`, `Europe/Berlin` (DST), `America/New_York` and `Asia/Kolkata` (+05:30).
- DB tests use a fresh in-memory `better-sqlite3` database per test via `createTestDb()` (step 05), with migrations applied.
- Component tests mock repositories/query hooks, not SQLite.
- Don't snapshot-test whole screens (brittle). Assert on text, roles and labels.
- Every bug fix adds a regression test.

## Performance budgets (checked in step 25)

| Scenario                               | Budget (emulator, release-like `--variant release` or dev with `__DEV__` noted)             |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| Cold start to dashboard (1k trades)    | < 2.5 s                                                                                     |
| Dashboard metrics compute (10k trades) | < 150 ms in JS (measured with `performance.now()` in a dev-only debug screen)               |
| Period switch                          | < 100 ms perceived                                                                          |
| History scroll (10k trades)            | no blank cells for more than 1 frame burst; FlashList `estimatedItemSize` set               |
| Import parse + plan (5k rows)          | < 3 s, UI stays responsive (progress text, work chunked with `await` yields every 500 rows) |
| Import commit (5k rows)                | < 3 s in a single transaction                                                               |
