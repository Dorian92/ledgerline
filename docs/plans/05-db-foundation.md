# 05 — DB foundation

## Goal
Provide the SQLite access layer, the migration runner, schema 0001 and repositories for accounts, trades, tags and prefs,
with calc-on-write, tested against real SQLite in Node.

## Depends on
04.

## Read first
`docs/data-model.md` (all), `docs/architecture.md` §3–§4, `docs/financial-semantics.md` §9.

## Scope
1. Dependencies: `npx expo install expo-sqlite expo-crypto`; dev: `npm i -D better-sqlite3 @types/better-sqlite3`.
2. `src/data/db/types.ts`:
   ```ts
   export interface Db {
     exec(sql: string): Promise<void>;
     run(sql: string, params?: SqlParam[]): Promise<{ changes: number }>;
     all<T>(sql: string, params?: SqlParam[]): Promise<T[]>;
     get<T>(sql: string, params?: SqlParam[]): Promise<T | null>;
     transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T>;   // nested calls reuse the outer tx
     close(): Promise<void>;
   }
   type SqlParam = string | number | null;
   ```
3. `src/data/db/expoDb.ts`: `openExpoDb(fileName): Promise<Db>` using `SQLite.openDatabaseAsync`, sets `PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;`,
   and `transaction` via `withExclusiveTransactionAsync` (or `withTransactionAsync` if exclusive isn't available. Document which one, because the exclusive form prevents interleaving).
4. `src/test/sqliteTestDb.ts`: `createTestDb(): Promise<Db>`, a better-sqlite3 `:memory:` adapter with the same semantics (sync calls wrapped in promises; transaction with `BEGIN IMMEDIATE`/`COMMIT`/`ROLLBACK`; nested → savepoint-free reuse), migrations applied.
5. Migrations: `src/data/db/migrations/0001_init.ts` containing the SQL from data-model.md. **Create `import_batches` before `trades`.**
   Seed the 4 default tags in the migration (fixed UUIDs as constants so demo/real share the ids).
   `src/data/db/migrate.ts`: `migrate(db, migrations)` reads `PRAGMA user_version`, applies pending migrations in order, each in a transaction followed by `PRAGMA user_version = N`.
   Throws `MigrationError { fromVersion, failedVersion, cause }`. Rejects a DB whose `user_version` is greater than the latest known one (downgrade) with `DbTooNewError`.
6. `src/data/ids.ts`: an `IdGenerator` interface; `expoIds` uses `Crypto.randomUUID()`; the test version uses `node:crypto`.
7. `src/data/clock.ts`: a `Clock { now(): number }`, injected into repositories.
8. Repositories (`src/data/repositories/`), each a factory `createXRepo(db, deps)`:
   - `accounts`: `create({name, quoteCurrency, startingBalance?, exchange?})`, `update`, `list({includeArchived})`, `get`, `archive`, `delete`.
   - `trades`: `create(input: TradeInput)` (validate → compute → insert trade + trade_tags in one tx), `update(id, input)` (same, recompute),
     `delete(id)`, `get(id)` (with tags), `listClosedForMetrics(accountId)` (projection: id, symbol, direction, opened_at, closed_at, net_pnl, r_multiple,
     quantity, entry_price, risk_amount, fees_complete, funding_status, emotion; ordered by closed_at, id), `listForHistory(accountId, filter, page)`,
     `listOpen(accountId)`, `recomputeOutdated()` (batches of 500 where `calc_version < CALC_VERSION`).
   - Row ↔ domain mapping in `src/data/mappers/trade.ts`, using `fromCanonical`/`toCanonical` only.
   - `tags`: `list`, `create(name)` (unique NOCASE → `TagExistsError`), `rename`, `archive`, `delete`.
   - `prefs`: typed `get<K extends PrefKey>(key)`, `set(key, value)` with a zod schema per key (`npm i zod`).
9. `src/data/bootstrap.ts`: `openDatabases()` opens `ledgerline.db` → migrate → `recomputeOutdated`. The demo DB is opened lazily by step 06.
   Call it from `app/_layout.tsx` while the splash is visible. On failure, render a minimal `DbErrorScreen` with the error and the copy "Your data hasn't been changed." (full recovery options come in step 25).
10. `src/data/DbProvider.tsx`: React context exposing `{ db, repos }` for the active database.

## Out of scope
Demo DB/mode switching (06), import tables usage (16), React Query hooks beyond a placeholder (added per feature), backup.

## Tests (better-sqlite3)
- Migrations: fresh DB → user_version 1; running twice is a no-op; a failing migration rolls back and keeps the version; downgrade rejected.
- Schema constraints: closed trade without exit_price rejected by CHECK; FK cascade on account delete removes trades + trade_tags.
- trades.create stores the canonical strings and the derived fields from `computeTrade` (the worked example from §3.3).
- trades.update changing the stop recomputes R; changing direction flips the PnL sign.
- trades.delete removes trade_tags.
- recomputeOutdated: manually set calc_version 0 on 3 rows → recomputed, and their values are correct.
- tags unique case-insensitive; rename collision error.
- prefs zod validation rejects a malformed value.
- Transaction rollback: an error thrown inside `transaction` leaves no partial rows.

## Acceptance criteria
- All tests pass, `src/data` coverage ≥ 80% (enable the threshold and add `test:coverage` to `check`).
- App boots on the emulator; the progress log notes the user_version read back (a dev log line is fine).

## Gates
A, D (app launches, no DB error screen).

## Review checklist
- [ ] Every SQL query is parameterized (no string interpolation of values).
- [ ] All multi-statement writes are in `transaction`.
- [ ] No float conversions in mappers.

## Risks / notes
`better-sqlite3` needs a native build in Node. If prebuilt binaries are unavailable, install build tools (python3, make, g++).
The expo-sqlite async API names vary slightly between SDKs, so check the installed version's docs.
