# Ledgerline — Monetization (proposal, not validated)

## Market honesty

Direct competitors already exist: **FuturesEdge, TradingLog, UltraTrader, Daily Edge** (and many generic
trading journals, including web/desktop tools). We have **not** validated a market gap, demand, or revenue.
Ledgerline's angle is a hypothesis: _fully offline, no account, crypto-futures-first CSV import, and
tilt/behavior insights with transparent rules_. Store copy and docs must not claim "first", "only",
"proven", "AI", or performance outcomes.

## Model

- **Free:** demo mode (all features on demo data), one real account, unlimited manual trades, CSV import,
  dashboard, history with search/filters, backup/export/restore/delete, privacy features, reminders.
  The free tier is fully useful offline, with no purchase infrastructure required.
- **Pro (one-time unlock, non-consumable):** Insights (calendar heatmap, hour-of-day, tilt detector),
  the home-screen widget, and multiple real accounts.
  - The price of **$15–20 is a hypothesis**. The Play Console price is set at launch (user action) and can be changed later.
  - A user's own data is never paywalled: export, backup and deletion are always free.
- No subscriptions, no ads, no trials with timers.

## Entitlement providers (see architecture §6)

| Provider              | When                                                 | Behavior                                                                                                         |
| --------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `UnavailableProvider` | Default; any build without billing configured        | Pro locked; paywall explains that purchases are unavailable in this build; **no unlock path**                    |
| `MockProvider`        | `__DEV__ && EXPO_PUBLIC_BILLING_MODE==='mock'` only  | Paywall banner "MOCK PURCHASE — development only"; toggles a dev-only flag; never compiled into release behavior |
| `PlayBillingProvider` | Release builds with the product configured (step 27) | Google Play Billing one-time product `ledgerline_pro`                                                            |

Demo mode shows Pro features unlocked **on demo data only**. That's not an entitlement and it never applies to real data.

## Verification limitations (no backend, by design)

- There is no server-side receipt validation. We rely on the Play Billing client: query owned purchases at
  startup and on resume, check `purchaseState == PURCHASED`, and **acknowledge** new purchases within 3 days
  (otherwise Google refunds them automatically).
- The entitlement is cached locally (`app_prefs.entitlement_cache`) so the app works offline. It's re-checked
  whenever Play is reachable, which picks up refunds and revocations on the next successful query.
- Known risk: on rooted or modified devices the client-side check can be bypassed. For a one-time,
  low-price, offline app this is accepted and documented. It's **not** mitigated with obfuscation or fake
  security claims. Play Integrity / server verification would require a backend, which is out of scope.
- No "restore by email" (there's no account). Restoring goes through Play (same Google account), and the
  paywall has a "Restore purchase" button.

## What must exist before charging money (user actions, see launch-checklist)

Google Play developer account (one-time registration fee, not recurring), a payments profile,
the app uploaded to at least the internal testing track, the `ledgerline_pro` product created and activated,
license testers configured.
