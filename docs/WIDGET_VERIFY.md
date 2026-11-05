# Android widget verification (Dorian)

Ledgerline ships a **Today** summary widget via [`react-native-android-widget`](https://saleksovski.github.io/react-native-android-widget/).

## What we added in-repo

- `app.config.ts` — config plugin entry for the widget package
- `src/widgets/TodayWidget.tsx` — React widget UI (net PnL + trade count placeholders)
- `src/widgets/widgetTaskHandler.tsx` — registers the widget with the library

## What you verify locally

1. `npm run prebuild` on Windows (generates `android/`).
2. Open `android/` in Android Studio → **Build → Make Project** (no compile errors).
3. Run on **Pixel_6** emulator → long-press home screen → **Widgets** → find **Ledgerline Today**.
4. Add the widget; it should show placeholder copy until live data wiring is connected to `onDataChanged()` from trade mutations.
5. Tap widget → should deep-link to `ledgerline://` (tabs).

## Known limits in cloud CI

The cloud agent VM has **no Android SDK**, so widget native code is not compiled here. Gate **D** for step 23 depends on this checklist.

## Privacy / demo

When implemented, the widget must respect **hide amounts** and show **Demo** when `mode === 'demo'` (same rules as step 23 plan).
