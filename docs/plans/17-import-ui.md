# 17 — Import UI

## Goal
Build the "Import trades" flow from mockup `2-import.png`: choose the exchange and file, detect the format, show summary chips and a preview table with row warnings,
confirm the time zone, import, and show the result with undo. Honest labels for unsupported exchanges.

## Depends on
06, 16, and at least one of 13/14/15 shipped.

## Read first
`docs/import-spec.md` §1, §4; `docs/design-system.md` (2-import, corrections 1, 2, 7).

## Scope
1. `npx expo install expo-document-picker expo-file-system`.
2. Routes: `app/import/index.tsx` (source + file), `app/import/preview.tsx`, `app/import/result.tsx`. Entry points: Settings → Data → "Import CSV", the dashboard/history empty states, and onboarding create-account (a secondary "Import a CSV next" choice).
   All are guarded by `useRealModeOnly()`. In demo mode, show a sheet "Imports go into your journal, not the demo. Start my journal?"
3. Source screen: header "← Back", title "Import trades"; 3 `ExchangeTile`s (Binance, Bybit, OKX) with monograms B / BY / OK.
   Unsupported exchanges: a muted tile with a "Not yet" caption; tapping it explains "We haven't verified <exchange>'s export format yet."
   Below: the target account selector (if > 1 account, which needs Pro, so it's normally a single one) and a "Choose CSV file" button (`getDocumentAsync({ type: ['text/csv','text/comma-separated-values','text/plain','*/*'], copyToCacheDirectory: true })`).
   Short help per exchange: the export menu path from the format doc ("In Binance: Orders → Futures → Trade History → Export").
   Footer "No file? Try demo data →" (switches to demo mode via the DEMO sheet flow, after confirming).
4. Processing: read the file (size check first), build the plan off the UI thread as far as JS allows (chunked; show "Reading 2,400 of 5,000 rows…").
   Detection mismatch (the user picked Bybit, the file is Binance) → "This looks like a Binance file. Use Binance?"
5. Preview screen (mockup):
   - File card: name, size, row count, the detected format badge (`✓ Binance Futures v2` style → use the adapter label + version).
   - Chips: `N valid`, `N duplicates` (amber), `N warnings` (amber), `N errors` (red). Zero-count chips are hidden.
   - The time zone row when `timestampPolicy.kind==='ask'`: "Times in this file are: UTC ▾". Changing it rebuilds the plan.
   - Preview table card: "Preview" + `x of N`. Columns TIME (`MM-dd HH:mm` in the display tz), SYMBOL, SIDE (BUY/SELL or LONG/SHORT for closed-position formats), QTY, PRICE.
     Status icons: ✓ valid (green), ⧉ duplicate (amber row tint), ⚠ error (red tint), ! warning (amber).
     Show the first 7 rows plus a "Show all rows" FlashList (full screen) with a status filter.
   - Grouped messages below the table (from `plan.messages`).
   - Privacy note card: 🔒 "Parsed on-device. Your file never leaves this phone."
   - Previously-imported-file hint (step 16 §3).
   - Pinned primary button: "Import M trades" + secondary text "from N rows". Disabled when M = 0, with the reason ("Everything in this file is already imported").
6. Commit with a progress state, then the result screen: "Imported M trades", counts by status, "View trades" (→ Trades tab, filtered to `source: import` for this batch is optional; plain Trades is fine), "Undo import" (confirm: "Remove the M trades from this import? Edits you made to them will be lost.").
7. Settings → Data → "Import history" list (batches with date, file, counts, undone) with Undo per batch. This can be a simple screen in `app/settings/imports.tsx`.
8. Update onboarding welcome bullet 2 with the actual supported exchange list.

## Out of scope
Inline row editing, multi-file import, funding files, the share-intent "Open with Ledgerline" (future).

## Tests
- Component: the preview renders chips with the correct counts and hides zero chips; the button label uses M and N; disabled when M=0; the tz selector triggers a rebuild; unsupported tile messaging; demo-mode guard sheet.
- Integration (better-sqlite3 + domain): plan → commit → history query shows M trades; re-import → M=0 message.
- Copy test: the messages match import-spec wording for duplicate/error rows.

## Acceptance criteria
- End-to-end on the emulator with a **real anonymized** fixture pushed via `adb push fixtures/... /sdcard/Download/`: preview counts equal the fixture's meta `expected`; import; history and dashboard update; undo restores the previous totals.
- A non-CSV/unknown file shows "We don't recognize this file" with the closest-format hint.

## Gates
A, D (`e2e/import.yaml`: real mode, push the fixture beforehand via a script `e2e/scripts/push-fixtures.sh`, pick the file (Maestro can tap through the Android picker; if that's unreliable, add a dev-only "Import from bundled fixture" button in the dev gallery and use it in the flow), check the chips, import, undo), V.

## Visual check
Side by side with `2-import.png`: tile row, file card with badge, chips, preview table typography (mono), row tints, messages, privacy card, pinned button + demo link.
Expected deviations: consistent counts, "M trades from N rows", skip-only copy.

## Review checklist
- [ ] Nothing here can import into the demo DB.
- [ ] Row numbers in messages match the preview row numbers.
- [ ] Large files don't freeze the UI for more than about 100 ms at a time.
