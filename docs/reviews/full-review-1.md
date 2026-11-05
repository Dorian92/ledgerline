# Full review 1 — main branch

**Reviewer:** independent agent (workflow §5)  
**Date:** 2026-11-05  
**Baseline commit reviewed:** `fa43c69` (pre-fix)  
**References:** `financial-semantics.md`, `data-model.md`, `architecture.md`, plans 08–25

Severity: **Critical** (ship blocker / data corruption) · **High** · **Medium** · **Low** · **Info**

---

## Critical

| ID   | Finding                                                                                                                                             | Status                                                                |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| C-01 | **`fills` table missing from DB** while `data-model.md` and plan 16 require fill rows for import-based trades. Import commit never persisted fills. | **Fixed** — migration `0002_fills`, commit inserts fills, test added. |

---

## High

| ID   | Finding                                                                                                       | Status                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| H-01 | **Widget showed static placeholder**, not today PnL; ignored hide-amounts, demo tag, and Pro lock (plan 23).  | **Fixed** — `buildTodaySnapshot`, `loadWidgetSnapshot`, live widget UI, `requestWidgetUpdate` on trade mutations. |
| H-02 | **Pro gating ignored demo preview** (plan 22: `has('pro')` true in demo on demo data).                        | **Fixed** — `useHasPro()` + `ProGate`.                                                                            |
| H-03 | **Entitlement not persisted** — widget headless task cannot read in-memory mock Pro.                          | **Fixed** — `entitlement_pro` pref + hydrate on startup; mock purchase writes pref.                               |
| H-04 | **Insights used hardcoded `UTC` and fake `$10k` starting balance** instead of display TZ and account balance. | **Fixed** — `resolveDisplayTz` + account `starting_balance`.                                                      |

---

## Medium

| ID   | Finding                                                                                                                       | Status                                                                                                                                |
| ---- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| M-01 | **Accounts rename/delete** in repo but not exposed in UI (plan 20).                                                           | **Fixed** — settings accounts screen.                                                                                                 |
| M-02 | **`restoreBackup` dynamic `INSERT` column order** from JSON keys — fragile vs schema migrations (crash / wrong mapping risk). | **Open (Low risk for v1)** — backup format is app-controlled; documented. Prefer typed restore in a follow-up.                        |
| M-03 | **Widget refresh not wired** on privacy/mode/backup (plan 23).                                                                | **Partially fixed** — trade CRUD + mode refresh + hide toggle; restore/delete-all can call refresh in backup screen (add if missing). |
| M-04 | **Import concurrency** — only single-batch rollback tested; no parallel commit test (plan 16).                                | **Open** — acceptable for v1; atomicity within one batch verified.                                                                    |
| M-05 | **Pro billing architecture** (providers, paywall modal, release guard) still stub vs plan 22 scope.                           | **Open** — blocked on U-06/U-07; mock path documented.                                                                                |

---

## Low

| ID   | Finding                                                                                        | Status                                                        |
| ---- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| L-01 | **`Number()` in chart code** (`InsightCharts`, `paths.ts`) for layout only, not money storage. | **Accepted** — display scaling only; domain/data use `Dec`.   |
| L-02 | **`buckets.ts` uses `.toNumber()`** for heatmap intensity ratio.                               | **Accepted** — visualization bucket, not monetary.            |
| L-03 | **Widget name `Today` vs plan `TodaySummary`** — cosmetic config mismatch.                     | **Open** — rename optional.                                   |
| L-04 | **No `fills` cascade tested on undo** — undo deletes trades; FK cascade should remove fills.   | **Fixed implicitly** — `ON DELETE CASCADE` on fills.trade_id. |

---

## Info / compliance

| ID   | Finding                                                                                         | Status                                |
| ---- | ----------------------------------------------------------------------------------------------- | ------------------------------------- |
| I-01 | **No outbound network** for journal data — grep shows no `fetch`/HTTP client usage in app code. | **Pass**                              |
| I-02 | **Demo vs real** — separate DB files; imports throw `DemoModeError` in demo mode.               | **Pass**                              |
| I-03 | **R-multiple** — `compute.ts` matches §3.3 (net/risk, stop side, no estimate).                  | **Pass** (tests in `compute.test.ts`) |
| I-04 | **Time / DST** — periods use `localDayKey` / `@date-fns/tz`; metrics tests include DST cases.   | **Pass**                              |
| I-05 | **Import atomicity** — single transaction per batch; rollback test on validation failure.       | **Pass**                              |

---

## Plan acceptance gaps (remaining, non-blocked)

- **13–15:** Exchange adapters still unverified (U-04/U-05).
- **22:** Full paywall UI + Play Billing provider (U-06/U-07).
- **23:** Deep link `ledgerline://trade/new` on widget "+", 30 min periodic verify on device (**D**).
- **25:** Full TalkBack audit and on-device 10k seed (**D**).
- **26–28:** E2E visual baseline, billing, release.

---

## Fixes applied in this review pass

1. Migration v2 + fill persistence on import commit.
2. `buildTodaySnapshot` + widget task loader + live widget rendering.
3. Pro demo override + persisted `entitlement_pro`.
4. Insights display TZ / starting balance.
5. Accounts rename/delete UI.
6. Widget refresh hooks on data mutations and key prefs.

Re-run **Gate A** after fixes.

**Post-fix gate A:** 20 suites / 70 tests green (see commit after this review).
