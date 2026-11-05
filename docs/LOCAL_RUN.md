# Ledgerline — local run (Windows + Pixel 6 emulator)

These steps are for Dorian’s machine: **Windows**, **Android Studio**, **Pixel_6** AVD, **Node 22 LTS**.

## One-time setup

1. Install [Android Studio](https://developer.android.com/studio) with SDK 34+, platform tools, and a **Pixel 6** virtual device (API 34 recommended).
2. Install [Maestro CLI](https://maestro.mobile.dev/docs/getting-started/installation) and add it to `PATH`.
3. Clone the repo and install dependencies:

```powershell
cd C:\path\to\ledgerline
npm ci
```

4. Ensure `ANDROID_HOME` is set (Studio → SDK Manager shows the path). Accept SDK licenses if prompted:

```powershell
sdkmanager --licenses
```

## Dev client build (first time)

Expo uses a **development build**, not Expo Go.

```powershell
npm run prebuild
npm run android
```

- `prebuild` generates the `android/` folder (gitignored).
- `android` compiles the dev client and installs it on the running emulator.

Start the emulator from Android Studio (**Device Manager → Pixel 6 → Run**) before `npm run android`.

## Daily dev loop

Terminal 1 — Metro:

```powershell
npm start
```

Terminal 2 — if the app is not installed yet, or after native dependency changes:

```powershell
npm run android
```

The app listens on port **8137**. The dev client connects to Metro automatically on the same machine.

## Quality gate (same as CI)

```powershell
npm run check
```

## Maestro E2E flows

With the emulator running and the dev build installed:

```powershell
maestro test e2e/onboarding.yaml
maestro test e2e/dashboard.yaml
maestro test e2e/history.yaml
```

**Import flow (real journal):** create a real account in the app, then:

```powershell
maestro test e2e/import.yaml
```

The import test taps **Load synthetic test CSV** (test adapter) because the Binance/Bybit/OKX exchange adapters are not verified yet.

Optional smoke:

```powershell
maestro test e2e/smoke.yaml
```

## Android home widget (step 23)

After `npm run prebuild`, open the project in Android Studio and confirm:

- Widget provider entries exist under `android/app/src/main/` (from `react-native-android-widget` + `app.config.ts` plugin).
- Build → **Make Project** succeeds.

See `docs/WIDGET_VERIFY.md` for the checklist.

## Troubleshooting

| Issue                | Fix                                                         |
| -------------------- | ----------------------------------------------------------- |
| Metro cannot connect | Same Wi‑Fi/USB; run `adb reverse tcp:8137 tcp:8137`         |
| Gradle fails         | JDK 17+, `JAVA_HOME` set, run `cd android; .\gradlew clean` |
| Emulator not found   | `adb devices` must list the Pixel 6                         |
| SQLite native errors | Re-run `npm run prebuild` after upgrading `expo-sqlite`     |

## App ID

Package name is **`app.ledgerline`** (placeholder until **U-03** is confirmed).
