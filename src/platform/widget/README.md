# Android home-screen widget spike

`react-native-android-widget` was evaluated for v1. Native widget code requires a prebuild Android project and
Gradle wiring that is not available in this cloud VM (no Android SDK).

## Planned surface

- Today net PnL + trade count from the active account
- Tap opens `ledgerline://trade/new`
- Respects hide-amounts and demo mode (show "Demo" label)

## Next steps on a device

1. `npm i react-native-android-widget`
2. `npx expo prebuild`
3. Register `LedgerlineWidgetProvider` in `AndroidManifest.xml` per library docs
4. Bridge refresh from `onDataChanged()` in trade mutations
