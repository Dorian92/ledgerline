# 24 — Local journaling reminders

## Goal
An optional daily local notification reminding the user to log trades. It's off by default, has no backend or push, and needs explicit permission.

## Depends on
20.

## Read first
`docs/architecture.md` §1 (notifications row).

## Scope
1. `npx expo install expo-notifications`. Configure the plugin **without** FCM/push settings. Don't call `getExpoPushTokenAsync` / `getDevicePushTokenAsync` anywhere (a grep check in review).
2. An Android notification channel `journal-reminders` ("Journal reminders", default importance, no sound override).
3. `src/platform/notifications/reminders.ts`: `enableReminder({hour, minute})` → requests permission (Android 13+ `POST_NOTIFICATIONS`); if granted, cancels the existing reminder and schedules a daily trigger (`{ type: 'daily', hour, minute, channelId }`); stores `reminder` in prefs.
   `disableReminder()`, `rescheduleFromPrefs()` (on app start, ensuring exactly one scheduled reminder, matched by an identifier).
4. Content: title "Log today's trades", body "Takes a minute. Your journal stays on this device." Tap → opens the app at `trade/new` via `Notifications.addNotificationResponseReceivedListener` + the last-response check on cold start.
5. Settings → Reminders screen: a toggle, a time picker (default 21:00), and the permission-denied state with "Open system settings" (`Linking.openSettings()`).
6. Delete-all data cancels all scheduled notifications.

## Out of scope
Conditional reminders ("only if nothing logged today"), since that would need background execution; tilt alerts; push.

## Tests
A mocked `expo-notifications`: enable schedules exactly one; re-enable replaces; permission denied → not scheduled + state; disable cancels; `rescheduleFromPrefs` is idempotent.

## Acceptance criteria
On the emulator (API 34): enabling prompts for permission, and a reminder set 2 minutes ahead fires (Doze may delay inexact alarms; note the observed delay). Tapping it opens quick add. It survives an app restart. Document reboot behavior after testing (`adb reboot`).

## Gates
A, D (manual checklist recorded in the progress log; Maestro for the settings UI only).

## Review checklist
- [ ] No push-token APIs, no FCM config, no `google-services.json`.
- [ ] Off by default.
