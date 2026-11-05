# 20 — Settings, privacy and accounts

## Goal
Build the Settings tab: account management and switching, display time zone, privacy controls (hide amounts, app lock, block screenshots),
demo/real switching, and about/disclaimer. Placeholders for the data actions (21), Pro (22) and reminders (24).

## Depends on
06.

## Read first
`docs/architecture.md` §4, §8; `docs/data-model.md` (app_prefs keys); `docs/design-system.md` §5.

## Scope
1. `npx expo install expo-local-authentication expo-screen-capture`.
2. `src/features/settings/SettingsScreen.tsx`, grouped list sections:
   - **Account**: the active account (name, quote currency) → `settings/accounts`: list, create, rename, change starting balance, archive, delete (confirm with the trade count: "Delete 'Main' and its 312 trades?"). The quote currency is immutable after creation (helper text).
     Creating a second real account is allowed in this step; step 22 gates it behind Pro.
     An account switcher is also reachable by tapping the account eyebrow on the Dashboard header (bottom sheet list).
   - **Display**: Time zone: "Device (Europe/Berlin)" / "UTC". Stored in `display_tz`; `useDisplayTz()` now reads the pref.
   - **Privacy** (`settings/privacy`):
     - Hide amounts: a toggle, plus a quick toggle by long-pressing the dashboard hero (`usePrivacy()` store, persisted).
     - App lock: a toggle, enabled only if `hasHardwareAsync && isEnrolledAsync` (or the device credential). It requires a successful auth to turn on. On cold start and on resume after > 30 s in the background, a full-screen lock overlay with "Unlock" calls `authenticateAsync({ promptMessage: 'Unlock Ledgerline' })`.
       If auth isn't available anymore → explain and allow the device credential fallback (`disableDeviceFallback: false`).
     - Block screenshots: `preventScreenCaptureAsync()` / `allowScreenCaptureAsync()` (FLAG_SECURE; it also blanks the recents thumbnail). Default off.
   - **Data**: rows for Import CSV, Import history (17 or a placeholder), Backup, Restore, Export CSV, Delete all data (21 placeholders, disabled with "Coming in this version"; don't ship placeholders to release: the step 21 review ensures they're filled).
   - **Insights rules** (from 19, if done; otherwise hidden).
   - **Reminders** (placeholder for 24).
   - **Ledgerline Pro** (placeholder for 22).
   - **Demo**: "Explore demo data" / "Back to my journal", "Reset demo data".
   - **About** (`settings/about`): version (`expo-application`), the disclaimer "Ledgerline is a journal. It doesn't give financial or investment advice.", "Your data stays on this device", the privacy policy (an in-app text screen from `src/content/privacyPolicy.ts`, a placeholder until step 28 fills it), open-source licenses (a generated JSON via `npx license-checker-rseidelsohn --json --production` committed as `src/content/licenses.json` + a simple list).
3. Mode-aware: in demo mode the Account section shows "Demo account" read-only; privacy settings are global.

## Out of scope
Backup/restore/delete (21), Pro (22), reminders (24), languages, themes.

## Tests
- Account CRUD repo tests (the delete cascade already exists in step 05; add archive filtering).
- Component: settings sections render; toggling hide amounts makes `Money` render `••••` on the dashboard (integration with the store); the tz switch changes a history day grouping (view-model test).
- App lock state machine `src/features/privacy/lockMachine.ts` (pure): background timestamps, the threshold, success/fail transitions. Unit-tested with a mocked clock.

## Acceptance criteria
- Switching accounts updates dashboard/history/insights for that account only.
- With app lock on, killing and reopening the app requires auth; a < 30 s background doesn't.
- Block screenshots on → `adb exec-out screencap` yields a black image (manual check noted in the log).

## Gates
A, D (`e2e/settings.yaml`: create a 2nd account, switch, hide amounts, back to the dashboard and assert `••••`), V.

## Visual check
No mockup. Follow the tokens: grouped cards, 48 dp rows, secondary text for values, chevrons.

## Review checklist
- [ ] The lock overlay covers everything, including modals, and blocks TalkBack focus behind it.
- [ ] No settings are stored outside `app_prefs` (except the session store mirror).
