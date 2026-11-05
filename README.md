# Ledgerline

Private, offline crypto trading journal for **Android** (Expo / React Native + TypeScript). All data stays on the device.

Planning and specs: [`docs/roadmap.md`](docs/roadmap.md).

## Prerequisites

- Node.js 22 LTS
- JDK 17+ (for Gradle / Android builds)
- Android Studio with SDK 34+ and an emulator (Pixel 7 profile recommended)
- Maestro CLI (optional, for `e2e/` flows)

## Commands

```bash
npm ci
npm run check          # typecheck + lint + tests
npm run android        # dev build on emulator (requires prebuild)
npm run prebuild       # generate android/ (gitignored)
npm start              # Metro on port 8137
```

First native run:

```bash
npm run prebuild
npm run android
```

## App id

Placeholder `app.ledgerline` until Dorian confirms **U-03**.
