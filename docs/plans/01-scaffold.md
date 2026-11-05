# 01 — Scaffold

## Goal

Create the Expo + TypeScript project with expo-router, strict lint/format/test tooling and the import
boundary rules, and prove that a development build runs on the Android emulator.

## Depends on / user actions

None. U-02 is needed for the device gate. U-03 (app id) is ideally decided now. If it isn't, use the placeholder `app.ledgerline`.

## Read first

`docs/architecture.md` §1–§2, `docs/testing-strategy.md` (Gates), `docs/workflow.md`.

## Scope

1. Scaffold with `npx create-expo-app@latest` (default TypeScript template with expo-router) into
   `/workspace/tmp-scaffold`, then move the contents to the repo root, keeping `docs/`. Remove the template's
   example screens and components (tabs demo, `components/`, `constants/`, `hooks/`, reset script).
   Record the exact Expo SDK, React Native and React versions in `docs/decisions.md` as D-018.
2. `app.config.ts` (not `app.json`): `name: 'Ledgerline'`, `slug: 'ledgerline'`, `scheme: 'ledgerline'`,
   `orientation: 'portrait'`, `userInterfaceStyle: 'dark'`, `android.package` = U-03 or `app.ledgerline`,
   `android.allowBackup: false` (use the Expo config field if available, otherwise a tiny config plugin in `plugins/withNoBackup.ts`),
   `android.edgeToEdgeEnabled` per SDK default, `backgroundColor: '#0B0E14'`, splash bg `#0B0E14`,
   `experiments.typedRoutes: true`. Placeholder icon: a violet square with a white "L" (simple PNG generated with a script or committed asset ≤ 50 KB).
3. `tsconfig.json`: extends `expo/tsconfig.base`, `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, path alias `@/*` → `src/*`.
4. ESLint flat config (`eslint.config.js`) using `eslint-config-expo/flat` plus Prettier (`eslint-config-prettier`).
   Add the boundary rules from architecture §2:
   - `src/domain/**`: `no-restricted-imports` for `react`, `react-native`, `expo*`, `@tanstack/*`, `zustand`, `@/data/*`, `@/ui/*`, `@/features/*`, `@/platform/*`.
   - `src/domain/**`, `src/data/**`: `no-restricted-globals` `parseFloat`, `parseInt`, plus `no-restricted-properties` `Number.parseFloat`.
   - `src/features/**`: `no-restricted-imports` `@/data/db/*`.
   - Global: `@typescript-eslint/no-explicit-any: error`, `no-console: ['error', { allow: ['warn','error'] }]`.
5. Prettier: `.prettierrc` `{ "singleQuote": true, "trailingComma": "all", "printWidth": 100 }`, plus `.prettierignore` (android, ios, coverage, e2e/screenshots).
6. Jest: `jest-expo` preset, `jest.config.js` with `testPathIgnorePatterns` for `/e2e/`, `setupFilesAfterEach` → `src/test/setup.ts` (empty for now).
   Add `src/domain/__tests__/sanity.test.ts` (asserts 1+1) plus one RNTL test rendering the home placeholder.
7. `package.json` scripts:
   `start` (`expo start --dev-client --port 8137`), `android` (`expo run:android --port 8137`), `typecheck`, `lint` (`eslint . --max-warnings 0 && prettier --check .`),
   `format`, `test` (`jest`), `test:coverage`, `check` (`npm run typecheck && npm run lint && npm run test -- --ci`), `prebuild` (`expo prebuild --platform android --clean`).
8. Install the dev client: `npx expo install expo-dev-client`.
9. `.gitignore`: add `android/`, `ios/`, `e2e/screenshots/`, `coverage/`, `*.keystore`, `*.jks`, `.env*` (except `.env.example`), `fixtures/csv/raw/`.
10. Minimal routes: `app/_layout.tsx` (Stack, dark background), `app/index.tsx` showing "Ledgerline" on `#0B0E14`.
11. Create the empty folders from architecture §2 with `.gitkeep` only where needed: `src/domain`, `src/data`, `src/ui`, `src/features`, `src/platform`, `src/state`, `src/test`, `fixtures/csv/{real-anonymized,synthetic}`, `e2e`.
12. Replace `README.md`: what Ledgerline is (offline, private, Android), prerequisites (Node 22 LTS, JDK 17 as
    required by the SDK's Gradle, Android Studio + SDK 34+, an emulator), commands (`npm install`, `npm run android`, `npm run check`), links to `docs/`.
13. Append the step 01 entry to `docs/progress-log.md`.

## Out of scope

UI design, fonts, navigation tabs, any domain code, CI config (no CI provider decision yet), EAS config.

## Tests

- `sanity.test.ts`, `app/__tests__/index.test.tsx` (renders the text "Ledgerline").
- Lint self-test: add a temporary file `src/domain/__lint_probe__.ts` importing `react-native`, confirm `npm run lint` fails, then delete it. Note the result in the progress log.

## Acceptance criteria

- `npm run check` exits 0 on a clean clone after `npm ci`.
- `npx expo prebuild --platform android --clean && npm run android` builds and launches on an emulator; the screen shows "Ledgerline" on a dark background.
- `android/` is not tracked by git.
- The generated `android/app/src/main/AndroidManifest.xml` has `android:allowBackup="false"`.

## Gates

A: `npm run check`. D: `npm run android` (with the emulator running).

## Review checklist

- [ ] No leftover template demo code or assets.
- [ ] Port 8137 is used consistently.
- [ ] Versions recorded (D-018). The lockfile is committed.

## Risks / notes

- A cloud agent VM may lack the Android SDK/emulator (`/dev/kvm` may exist but isn't guaranteed to be usable).
  Installing the cmdline tools, an emulator image and a headless emulator (`-no-window -gpu swiftshader_indirect`) is allowed if it works within the VM.
  Otherwise mark D as pending for Dorian (U-02).
- If `create-expo-app` refuses a non-empty target, scaffold into `tmp-scaffold` as described and move the files.
