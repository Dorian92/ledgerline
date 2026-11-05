# Ledgerline — Future scope (explicitly not v1)

Nothing here gets built without a new roadmap step and plan.

## iOS

- Needs a Mac with Xcode, an Apple Developer Program membership (annual fee, which conflicts with the
  "no recurring dependencies" preference, so it's a business decision), and StoreKit products.
- Code impact: the widget has to be rebuilt with WidgetKit (Swift; an Expo module or `expo-apple-targets`),
  the billing provider needs an iOS path, the app lock uses Face ID strings, and screenshot blocking isn't available on iOS.
- The domain/data layers are platform-agnostic by design (architecture §2), so they need no changes.

## Read-only exchange API sync

- Opt-in only, read-only API keys, stored in `expo-secure-store`, calls made directly from the device to the
  exchange (still no Ledgerline backend). This needs the `INTERNET` permission and a privacy-policy update.
- Never request withdrawal/trade permissions. Validate the key scope where the exchange API allows it.
- It would reuse the import pipeline: API responses → `NormalizedRow` → the same dedupe/commit.
- v1 must **not** ask users for API keys or credentials in any form.

## Other candidates (unprioritized)

Funding-history CSV import · encrypted backups (passphrase) · SQLCipher · multi-file import ·
inline fixing of preview rows · coin-margined contracts · profit factor/expectancy · localization ·
tablet layouts · launcher app shortcut (long-press "Add trade") · screenshot attachments per trade.
