# 16 — Import commit (atomic, idempotent, undoable)

## Goal

Persist an `ImportPlan` into the real DB atomically, record the batch and fingerprints, guarantee idempotency, and support undoing an import.

## Depends on

05, 12.

## Read first

`docs/data-model.md` (import tables), `docs/import-spec.md` §4.

## Scope

1. `src/data/repositories/imports.ts` (`createImportsRepo(db, deps)`):
   - `existingFingerprints(accountId): Promise<Set<string>>`.
   - `commit({ accountId, plan, fileName }): Promise<{ batchId; tradesCreated }>`. In **one transaction**:
     1. Re-read the fingerprints for the plan's fingerprints (`SELECT … WHERE fingerprint IN (…)` chunked by 500). If any now exist (a concurrent or double tap), **drop those trades** from the commit (all-or-nothing per trade: a trade with any existing fingerprint is skipped) and count them as duplicates in the result.
     2. Insert `import_batches`.
     3. For each trade: `validateTradeInput` → `computeTrade` → insert the trade (`source='import'`, `import_batch_id`) + fills (with `fee_asset`) + fingerprints.
     4. Update the batch counts. Return.
        If any insert fails, roll back everything and throw `ImportCommitError` with the trade index.
   - `listBatches(accountId)`, `undo(batchId)`: in one tx delete the trades with this batch id (fills cascade) and the fingerprints for the batch, and set `undone_at`. Idempotent.
   - Guard: throws `DemoModeError` if called with the demo DB (the repo receives the `mode` and asserts it's `real`).
2. File hashing helper `src/platform/files/readFile.ts` (expo-file-system) for `file_sha256`. It isn't used for dedupe, only recorded.
3. Optional duplicate-file hint: if a batch with the same `file_sha256` exists, the plan UI (17) shows "You imported this file on <date>", and dedupe still governs.

## Out of scope

UI (17); funding files.

## Tests (better-sqlite3)

- Commit creates the expected trades/fills/fingerprints/batch counts for a synthetic plan.
- Atomicity: inject a failure at the Nth trade insert (a test hook on the repo deps) → zero rows in all import tables and trades.
- Idempotency: committing the same plan twice → the second commit creates 0 trades; a new plan built with `existingFingerprints` → 0 trades.
- Concurrency: two commits of the same plan started back-to-back → the total trade count equals a single commit.
- Undo removes exactly the batch's trades and fingerprints; re-importing after an undo works again; undo twice is a no-op; trades edited after import are still deleted by undo (the UI warns in 17).
- Demo guard throws.

## Acceptance criteria

All of the above; 5k-trade commit < 3 s in Node (loose).

## Gates

A.

## Review checklist

- [ ] Single transaction; no awaits on non-DB work inside the tx.
- [ ] Parameter count per statement stays under SQLite limits (chunk IN lists by 500).
