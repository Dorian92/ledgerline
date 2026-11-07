# Ledgerline device UX audit (pass 1)

**Date:** 7 November 2026 (device capture ~17:11–17:17 Europe/Belgrade)  
**Baseline build:** `main` @ `206338e` (Pixel_6 emulator, 1080×2400)  
**Corrections landed:** `main` after UX pass (see git SHA in release notes below)  
**Scope:** Observed UI/navigation on device; code fixes and regression tests in-repo. No on-device re-verification from the cloud VM.

Evidence PNGs (audit): `ledgerline-ux-audit/` in repo attachments. Approved references: `ledgerline-design/1-dashboard.png`, `3-quick-add.png`, `5-insights.png`.

---

## Fix tracking (UX-01 … UX-15)

| ID | Severity | Summary | Status | Verification |
| --- | --- | --- | --- | --- |
| UX-01 | High | Back/Close on nested routes; modal close | **Fixed** (code) | Retest: trade detail/edit/new, Settings sub-screens, Import/Backup/Pro/Reminders/Accounts, onboarding create |
| UX-02 | High | Hide amounts across UI + a11y/charts | **Fixed** (code) | Retest: toggle Privacy → Home/Trades/Insights; TalkBack labels on equity/calendar |
| UX-03 | High | Cancel onboarding must not strand unset real mode | **Fixed** (code) | Retest: Demo → Start journal → Back without create; expect demo dashboard |
| UX-04 | High | Trades day totals format + loss color | **Fixed** (code) | Retest: Trades history headers (bounded currency, red negatives) |
| UX-05 | High | Insights histogram/calendar bounds + loss color | **Fixed** (code) | Retest: R distribution width; 7-column calendar; drawdown label units |
| UX-06 | High | Accounts new-name input height | **Fixed** (code) | Retest: Settings → Manage accounts |
| UX-07 | Medium | Demo %/win rate/R semantics | **Fixed** (code + tests) | Retest: dashboard 7D/30D/YTD; **re-seed demo** for new trade mix (DB not wiped) |
| UX-08 | Medium | Trade detail metadata + delete styling | **Fixed** (code) | Retest: open BTC-PERP detail; delete confirm |
| UX-09 | Medium | Form hierarchy, Cancel, 48dp targets | **Partial** | Retest: Quick add two-column, Cancel, computed block; keyboard occlusion not re-tested |
| UX-10 | Medium | Demo Import/Backup dead-ends | **Fixed** (code) | Retest: demo → Import/Backup CTAs + Back |
| UX-11 | Medium | Import without account | **Fixed** (code) | Retest: cancel create → Import synthetic; preview shows guard |
| UX-12 | Low/Med | Search empty copy | **Fixed** (code) | Retest: search `UXNORESULT` |
| UX-13 | Medium | Dashboard layout vs mock | **Partial** | Retest: cards, See all, FAB inset, period pills after headline |
| UX-14 | Medium | Safe area on scroll/sheets | **Fixed** (code) | Retest: Insights top clip; caveat sheet bottom inset |
| UX-15 | Low/Med | Pro/mock billing copy | **Fixed** (code) | Retest: Pro screen; mock unlock only in `__DEV__` |

---

## Original findings (observed behavior)

### UX-01 High: no visible Back/Close on nested screens

Repro: dashboard trade → detail → Edit; Quick add; Settings → Privacy/Import/Backup/Pro/Reminders; Manage accounts; Demo data → Start my journal.  
**Observed:** Title only; tabs hidden; hardware back worked but no in-app affordance. Quick add occasionally returned to Home tab on hardware back.  
**Evidence:** `01-trade-detail.png`, `05-trades.png`, `24-accounts.png`, design refs for desired Quick add close.

### UX-02 High: Hide amounts masks headline only

**Observed:** NET PNL masked but equity endpoints, recent rows, Insights MAX DD, and a11y strings still exposed amounts.  
**Evidence:** `29-hidden-dashboard.png`, `19-insights-bottom.png`.

### UX-03 High: cancelling journal creation strands user

**Observed:** After Back from create-account without saving, demo badge gone, blank dashboard, mode effectively broken.  
**Evidence:** audit notes `22-cancel-create-mode.png`, `23-settings-no-account.png`.

### UX-04 High: monetary totals wrong in Trades

**Observed:** Day headers showed raw decimals; negative totals green.  
**Evidence:** `05-trades.png`.

### UX-05 High: Insights charts unusable

**Observed:** R bar overflow; 2-row calendar; loss days green; MAX DD without currency.  
**Evidence:** `19-insights-bottom.png` vs design `5-insights.png`.

### UX-06 High: oversized account name field

**Evidence:** `24-accounts.png`.

### UX-07 Medium: suspicious demo metrics

**Observed:** 0% win rate with ~79 trades and tiny % move; incoherent R vs PnL on sample short.  
**Root cause (code):** `formatPercent` applied to unitless ratios; demo exits not always sign-consistent with side.  
**Fix:** `formatRatioAsPercent`; demo generator exit logic; existing DB unchanged until user resets demo.

### UX-08–UX-15

See uploaded `findings_f165.md` for full prose and filenames.

---

## Implementation notes (correction pass)

- **`NavScreen`**: shared back/close header + safe-area padding on nested routes and modals.
- **Privacy**: `Money`, `EquityChart`, trade rows, Insights charts respect `hideAmounts`; chart a11y labels redacted when hidden.
- **Guards**: `useRealModeOnly` requires real mode **and** `activeAccountId`; `DemoGuardPanel` on demo Import/Backup.
- **Formatting**: history headers use `formatMoney` + signed colors; dashboard `toDashboardViewModel` uses ratio→percent scaling.
- **No DB wipe**; mock billing remains `__DEV__` only.

---

## Automated verification (VM)

- `npm run check` — 20 suites, **74** tests (added formatting, guards, demo, history display).
- `npm run prebuild` — Android prebuild **OK** (icons/assets verified via `verify:assets`).

---

## Device retest checklist (Windows `C:\l`, Pixel_6)

After `git pull` to correction SHA:

1. Nested routes show **← Back** or **✕ Close**; Quick add Cancel returns to originating context.
2. **Hide amounts**: no `$` on Home equity range, recent, Trades, Insights drawdown/R/calendar a11y.
3. Demo → Start journal → **Cancel**: still on demo dashboard with DEMO DATA.
4. Trades day headers: **-$X.XX** in red/green correctly.
5. Insights: histogram within screen; calendar 7 columns + weekday row; loss cells red.
6. Accounts: single-line name field; no giant box; no mock purchase outside dev.
7. Trade detail shows entry/exit/size/fees/times; delete styled + confirms.
8. Demo Import/Backup: notice + Start journal + Back; real import blocked without account.
9. Dashboard: FAB does not cover last recent row; period pills after headline (visual compare to mock).
10. Optional: **Reset demo data** to pick up generator fix for win/loss mix.

---

## Limitations

- Cloud agent did **not** re-run the Pixel_6 emulator suite; checklist above is for local confirmation.
- Existing demo DB may show old trade PnL until reset/re-seed; percentage display fix applies immediately.
