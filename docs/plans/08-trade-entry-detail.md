# 08 — Manual trade entry, detail, edit, delete

## Goal

Fast quick-add sheet (mockup "Quick add") with a live computed panel, plus emotion and setup tags and notes; a trade detail
screen; edit and delete with recalculation; the deep link `ledgerline://trade/new`.

## Depends on

04, 05, 06.

## Read first

`docs/financial-semantics.md` §3 and §8, `docs/design-system.md` §3–§6 (Sheet, Chip, Money, mockup correction 3).

## Scope

1. Dependencies: `npm i react-hook-form @hookform/resolvers @tanstack/react-query`. Set up `QueryClientProvider` in `app/_layout.tsx` if it isn't there yet.
2. Query layer `src/data/queries/`: `keys.ts` (`qk`), `useTrade(id)`, `useCreateTrade()`, `useUpdateTrade()`, `useDeleteTrade()`, `useTags()`, `useCreateTag()`.
   Mutations invalidate `[mode, accountId]`-prefixed keys and call `onDataChanged()` (a no-op hook point for the widget in 23).
3. Route `app/trade/new.tsx` (`presentation: 'modal'`, styled as a bottom sheet with a grabber), `app/trade/[id]/index.tsx` (detail),
   `app/trade/[id]/edit.tsx` (same form, prefilled).
4. `src/features/trade-form/TradeForm.tsx` fields, in mockup order:
   - SYMBOL (text with uppercase, suggestions from recent symbols of the account; `BTC` → `BTC-PERP`), the **Long/Short** segmented toggle (green/red when selected).
   - ENTRY, EXIT (optional; empty = open trade), SIZE (base units with the base asset suffix), STOP (optional).
   - "More" expandable: opened at / closed at (date+time pickers; default now; closed defaults to now when an exit is entered), fees (quote), funding (signed), leverage (info).
     Use `@react-native-community/datetimepicker` via `npx expo install`.
   - EMOTION chips (single select, optional): 😌 Calm, ⚡ FOMO, 😤 Revenge, 😨 Fear.
   - SETUP chips (multi select) from tags + "+ Add" (inline create with validation, max 24 chars).
   - NOTE (multiline, 4000 chars max, counter after 3500).
   - Numeric inputs use `keyboardType="decimal-pad"` and `parseUserDecimal`; errors inline under the field.
   - Zod schema in `src/features/trade-form/schema.ts`, mapping to `TradeInput`; domain `validateTradeInput` runs too and its errors are mapped to fields.
5. **Computed · live** panel (violet-tinted card): net PnL (big, signed), R (or "R —" with the reason, e.g. "Add a stop for R" / "Stop is on the wrong side"),
   and a secondary line "Gross +124.13 · Fees 4.10 · Risk 58.88". It updates on every valid keystroke (debounce 100 ms) via `computeTrade`.
   For open trades: "Open — PnL when closed".
6. "Save trade" primary button pinned above the keyboard (`KeyboardAvoidingView` / `react-native-keyboard-controller` only if needed; prefer built-in).
   Disabled until valid. Haptic on success, then close, then a toast/snackbar "Trade saved".
7. Detail screen: header symbol + side pill + leverage; big net PnL + R; a grid of entry, exit, size, stop, risk, fees (with "incomplete" note), funding (with status),
   opened/closed (local time + tz abbreviation), duration; emotion, setups, notes; source (Manual / Imported from <file> on <date>); R-unavailable explanation.
   Actions: Edit, Delete (confirm dialog "Delete this trade? This can't be undone." → back + snackbar).
8. `src/ui/TradeRow.tsx` (design-system §3) for reuse in 09/10.
9. Deep link: `ledgerline://trade/new` opens the sheet over the tabs (expo-router handles it; verify the cold start path redirects through onboarding if the mode is unset).
10. Demo mode: allowed (writes to the demo DB); the sheet shows the DEMO pill.

## Out of scope

History list (10), import-specific detail like a fills table (a basic count "N fills" is fine), photo attachments.

## Tests

- TradeForm component: typing the worked example shows `+120.03` / `+2.04R` and "Gross +124.13 · Fees 4.10 · Risk 58.88";
  missing stop → R reason; a stop on the wrong side → reason; empty exit → open state; save disabled with an invalid entry; `0,15` accepted.
- Mutation tests with a mocked repo: create → invalidates the correct keys; delete → navigates back.
- Repo integration (better-sqlite3): edit changes R and net; a tag created inline is attached.
- Deep-link route test with expo-router testing utilities (`renderRouter`) if available, otherwise a Maestro flow.

## Acceptance criteria

- Can add a trade in ≤ 6 interactions after opening (symbol, side, entry, exit, size, save). Defaults make the remaining fields optional.
- Edit and delete reflect immediately in any list or count currently mounted (placeholder Home count from step 06).
- No layout jump or hidden Save button with the keyboard open on a 1080×2400 and a 720×1280 emulator.

## Gates

A, D (`e2e/quick-add.yaml`: open via FAB placeholder or deep link `adb shell am start -a android.intent.action.VIEW -d ledgerline://trade/new`, fill in the worked example, save, open detail, edit stop, delete), V.

## Visual check

Compare the sheet with the mockup's Quick add: field order, two-column ENTRY/EXIT and SIZE/STOP grid, the Long/Short toggle, the computed panel, chips, note box, pinned violet Save.
Expected deviation: net-first computed panel.

## Review checklist

- [ ] No `parseFloat`; all parsing goes through `parseUserDecimal`.
- [ ] R is never displayed without a valid stop.
- [ ] TalkBack reads field labels and errors; the Long/Short toggle exposes its selected state.

## Risks / notes

expo-router modal + keyboard on Android: test `android:windowSoftInputMode` (`adjustResize` is the default with edge-to-edge; verify).
