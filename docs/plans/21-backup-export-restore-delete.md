# 21 — Backup, export, restore and deletion

## Goal

Give users full ownership of their data: a versioned JSON backup, a CSV trade export, a validated all-or-nothing restore, and complete deletion.

## Depends on

20 (05).

## Read first

`docs/data-model.md` (Backup file format, Trade CSV export), `docs/architecture.md` §8.

## Scope

1. `npx expo install expo-sharing expo-file-system` (file-system may already exist).
2. `src/domain/backup/schema.ts`: zod schemas for backup v1 (data-model.md), with canonical-decimal refinements and enum checks.
   `serializeBackup(snapshot, meta): string` and `parseBackup(text): { ok, backup } | { ok: false, reason: 'not_json'|'not_ledgerline'|'too_new'|'invalid', details }`.
3. `src/data/repositories/backup.ts`: `snapshotAll(db)` (reads all user tables), `restoreAll(db, backup)` (in one transaction: delete in FK-safe order → insert → `recomputeOutdated`; afterwards set `active_account_id` to the first account).
   Before restoring, write a safety copy of the current data to `documentDirectory/pre-restore-latest.json` (overwritten each time), and offer "Undo restore" on the result screen, which restores that file.
4. CSV export `src/domain/backup/csvExport.ts`: RFC 4180 writer (quote cells containing `,` `"` or a newline; double the quotes), the columns from data-model.md, for the active account or all accounts (a choice).
5. Delivery: write to `cacheDirectory`, then present two options: **Save to device** (Android SAF: `StorageAccessFramework.requestDirectoryPermissionsAsync()` → `createFileAsync` → write) and **Share…** (`Sharing.shareAsync`). Delete the cache file after.
   File names from data-model.md. A warning line before backup: "This file contains your whole journal in readable form. Store it somewhere private."
6. Restore UI: pick a file → parse → summary ("Backup from Nov 5, 2026 · 2 accounts · 1,204 trades · made with Ledgerline 1.0.0") → confirm "Replace all data on this device?" (destructive style) → progress → result.
   Errors are shown with the reason and "Nothing was changed."
7. Delete all data: confirm by typing `DELETE` → close the DBs → `SQLite.deleteDatabaseAsync` for both files → delete `pre-restore-latest.json` and the cache → reset the stores → onboarding.
   Copy: "This deletes all journal data, demo data and settings from this phone. Backups you saved elsewhere aren't affected. Purchases stay with your Google account."
8. All of these are real-mode only (`useRealModeOnly`), except Delete all, which works in both modes.
9. Wire up the Settings → Data rows (replacing the placeholders from 20).

## Out of scope

Encrypted backups, automatic/scheduled backups, cloud destinations, importing Ledgerline CSV exports.

## Tests

- Property: random DB contents → snapshot → serialize → parse → restore into an empty DB → snapshot equals the original (deep equal, canonical strings).
- Rejections: not JSON, a wrong `format`, `formatVersion` 2, a non-canonical decimal, an unknown enum, a missing FK target. For each, the existing DB is unchanged (row counts and a checksum compared).
- Restore failure injected mid-insert → rollback → original data intact.
- The CSV writer escapes quotes/newlines/commas; the header order; ISO UTC timestamps; tags joined with `|`.
- Delete all: after the call, opening the DBs yields fresh empty schemas and `mode='unset'`.
- Demo guard on backup/export/restore.

## Acceptance criteria

- A backup made on the device restores on a fresh install with identical dashboard numbers (manual D check: record the before/after hero and tile values).
- No path deletes or overwrites data without an explicit confirmation.

## Gates

A, D (`e2e/backup.yaml`: create 2 trades → backup via Share to a Files location (or a dev-only "backup to app storage" button if Maestro can't drive SAF) → delete all → onboarding → restore → trades present).

## Review checklist

- [ ] The restore transaction contains no file I/O.
- [ ] Backups exclude the prefs listed in data-model.md.
- [ ] The SAF write handles user cancel gracefully.
