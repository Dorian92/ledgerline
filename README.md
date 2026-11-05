# Ledgerline

A private, offline crypto trading journal for Android, built with Expo / React Native + TypeScript.
All data and computation stay on the device: no account, no backend, no analytics.

**Status: planning complete, no application code yet.** Implementation follows `docs/roadmap.md`
one step at a time, each with a detailed plan in `docs/plans/`.

## Where to start

| Doc | Purpose |
|---|---|
| [docs/roadmap.md](docs/roadmap.md) | Ordered steps, dependency graph, acceptance criteria and gates |
| [docs/workflow.md](docs/workflow.md) | How implementation and review agents execute a step |
| [docs/plans/](docs/plans/) | One detailed plan per step (`01-scaffold.md` … `28-release-prep.md`) |
| [docs/architecture.md](docs/architecture.md) | Stack, layout, data flow, demo/real separation, security posture |
| [docs/data-model.md](docs/data-model.md) | SQLite schema v1, backup and export formats |
| [docs/financial-semantics.md](docs/financial-semantics.md) | Normative PnL, fees, funding, R, positions, periods and metrics definitions |
| [docs/import-spec.md](docs/import-spec.md) | CSV import scope, pipeline, dedupe/idempotency, evidence policy |
| [docs/design-system.md](docs/design-system.md) | Tokens, components, mockup corrections, visual acceptance |
| [docs/testing-strategy.md](docs/testing-strategy.md) | Test layers, gates, performance budgets |
| [docs/monetization.md](docs/monetization.md) | Free vs one-time Pro proposal, billing limitations, competitors |
| [docs/decisions.md](docs/decisions.md) | Decision log |
| [docs/launch-checklist.md](docs/launch-checklist.md) | User actions (U-xx) and the pre-release checklist |
| [docs/future-scope.md](docs/future-scope.md) | iOS, read-only API sync and other non-v1 items |

## Running locally

Not applicable yet. Step `01-scaffold` adds the project and replaces this section with the run guide
(Node 22 LTS, Android Studio + emulator, `npm install`, `npm run android`, `npm run check`).
