# Ledgerline — Decision log

Format: `D-NNN — title — status — rationale`. New decisions are appended by the step that makes them.
Changing an accepted decision needs a new entry that supersedes it.

- **D-001 — Android-only v1 via Expo dev builds (CNG), no Expo Go, no iOS** — accepted — The widget,
  billing and native config need dev builds. Dorian targets the Android emulator only.
- **D-002 — Fully offline, no backend, no analytics/crash SDK** — accepted — This is the product promise. It also means no recurring infrastructure.
- **D-003 — expo-sqlite behind a `Db` interface; hand-written SQL migrations with `user_version`** —
  accepted — Fewer dependencies than an ORM, easy for models to follow, and testable with better-sqlite3. Drizzle was rejected to keep the migration path explicit.
- **D-004 — Decimals as canonical TEXT + decimal.js; no floats in domain code** — accepted — Crypto
  quantities need 8+ dp, and scaled integers risk overflow in price×qty.
- **D-005 — Calc on write (cached per-trade derived values), aggregates on read in JS** — accepted.
- **D-006 — Separate demo database file** — accepted — This is the strongest guarantee that demo data never mixes with real data.
- **D-007 — R uses net PnL and requires a valid initial stop; never estimated** — accepted — financial-semantics §3.3.
- **D-008 — Average-cost position reconstruction from fills; flips split with prorated fees; open/orphan positions not imported** — accepted.
- **D-009 — Exchange support only with real-sample evidence** — accepted — import-spec §1.
- **D-010 — Funding not imported from separate files in v1; trades flagged funding unknown** — accepted.
- **D-011 — One-time Pro unlock behind an `EntitlementProvider`; mock dev-only; no fake release entitlement** — accepted.
- **D-012 — `allowBackup=false`; explicit user-controlled backup file instead** — accepted — Avoids silent cloud copies of financial data. Trade-off: no automatic device migration.
- **D-013 — Charts with react-native-svg + pure path builders** — accepted — Avoids Skia and a chart-library dependency.
- **D-014 — Widget via `react-native-android-widget`; fallback to a local Expo Kotlin module** — accepted, to be validated in step 23 (spike first).
- **D-015 — en-US number formatting in v1; English only** — accepted — Lets us ship before investing in i18n.
- **D-016 — Display time zone = device tz by default (setting: UTC)** — accepted.
- **D-017 — Package/app id** — **pending user decision U-03** — Placeholder `app.ledgerline`. Must be final before the first Play upload (step 28).
- **D-018 — Expo SDK version** — pending, recorded by step 01.
