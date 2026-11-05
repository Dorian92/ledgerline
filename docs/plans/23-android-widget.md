# 23 — Android home-screen widget and quick-add deep link

## Goal
An Android home-screen widget showing today's journal summary with a "+" button that opens quick add, matching the overview mockup.
Capabilities are honestly bounded: the widget **displays** a snapshot and **launches** the app. It can't take input itself.

## Depends on
09, 22 (08, 07).

## Read first
`docs/architecture.md` §5, D-014; `docs/design-system.md` correction 9.

## Widget capabilities (v1, normative)
- Size: 4×2 cells default, resizable to 3×2 minimum. Content: the "Ledgerline · Today" label (+ a "DEMO" tag in demo mode), today's net PnL (large, colored), the line "3 trades · 2W 1L · +2.1R" (avg R of today's R-available trades, omitted if none), and a violet "+" button.
- Tap the body → `ledgerline://` (dashboard). Tap "+" → `ledgerline://trade/new`.
- Updates: (1) immediately after any data mutation, a mode switch, a privacy change or an entitlement change (the app calls `requestWidgetUpdate`); (2) Android periodic update (`updatePeriodMillis` = 30 min, the platform minimum) via the headless task, which recomputes today's snapshot from SQLite, so the day rollover can lag up to ~30 min. The widget shows the date ("Thu, Nov 5"), so staleness is visible.
- Privacy: hide amounts on → `••••`; app lock on → amounts hidden and the "+" still works (the app asks to unlock first). Demo mode → the demo snapshot with the DEMO tag.
- Not Pro (real mode) → the locked state "Today's summary is a Pro feature" + the "+" button (quick add stays free).
- No interactive toggles, no scrolling lists, no live prices, no network.

## Scope
1. **Spike first (time-boxed to one sub-commit):** `npx expo install react-native-android-widget` and add its config plugin in `app.config.ts`
   (widget name `TodaySummary`, `minWidth`/`minHeight` for 3×2, `targetCellWidth` 4, `targetCellHeight` 2, `updatePeriodMillis: 1800000`, a preview image).
   Verify on the emulator, with the New Architecture and the current SDK, that the widget renders, a click opens a deep link, and the headless task can open expo-sqlite.
   Record the result as decision D-0xx. **If the spike fails** in a way that isn't trivially fixable: implement the fallback as a local Expo module `modules/ledgerline-widget` (Kotlin, `AppWidgetProvider` + RemoteViews or Jetpack Glance)
   that renders a JSON snapshot stored in SharedPreferences and written via a module function `setSnapshot(json)`. Periodic recompute is then limited to "show the snapshot and date", with the stale day indicated by the date label. Document the trade-off.
2. `src/platform/widget/snapshot.ts` (pure part in `src/domain/metrics/today.ts`): `buildTodaySnapshot({ trades, now, tz, mode, hidden, locked, pro }): WidgetSnapshot` (pre-formatted strings, so the widget doesn't need decimal logic).
3. `src/platform/widget/TodaySummaryWidget.tsx` (the widget JSX using the library's `FlexWidget`/`TextWidget` primitives) with the tokens: bg `#131824`, radius 16, border, Inter (bundle the font if the library supports custom fonts; otherwise the system font, and record it).
4. `src/platform/widget/taskHandler.ts` registered in the app entry (`index.js`/`registerWidgetTaskHandler`): it handles `WIDGET_ADDED`, `WIDGET_UPDATE`, `WIDGET_RESIZED` → opens the real DB (read-only queries), reads the mode/prefs/entitlement cache, builds the snapshot and renders. On error it renders "Open Ledgerline to refresh".
5. `onDataChanged()` hook point (from 08) → `requestWidgetUpdate`. Also call it after a mode switch, a privacy toggle, an entitlement change, a restore and delete-all (delete-all renders the "Set up Ledgerline" state).
6. Widget picker metadata: label "Ledgerline · Today", description "Today's trading journal summary and quick add".

## Out of scope
Multiple widget types, configurable widgets, a lock-screen widget, iOS, launcher app shortcuts (future).

## Tests
- `buildTodaySnapshot`: wins/losses/count, avg R omitted when there are none, hidden → `••••`, locked, not-Pro state, demo tag, today boundaries in tz.
- Task handler unit test with a mocked DB + renderer: success and error paths.

## Acceptance criteria
- On the emulator: add the widget from the picker → it shows today's demo snapshot (3 trades, 2W 1L, matching the dashboard/history); adding a trade in the app updates the widget within ~2 s; "+" opens quick add from the home screen, including cold start; hide amounts → `••••`.
- Documented limits match the behavior.

## Gates
A, D (manual + Maestro where possible: Maestro can tap home-screen widgets only unreliably, so record a manual checklist result plus screenshots `23-widget-*.png` in the visual log), V (compare with the overview's widget).

## Review checklist
- [ ] The widget never shows real amounts when hide-amounts or app lock is on.
- [ ] The headless task doesn't write to the DB.
- [ ] Release build: the widget works after `expo prebuild --clean` (CNG, no manual edits to `android/`).
