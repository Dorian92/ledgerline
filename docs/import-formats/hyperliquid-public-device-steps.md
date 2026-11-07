# Import Hyperliquid public fills on device

**Data:** `fixtures/csv/real-anonymized/hyperliquid/public.hyperliquid.fills.v1__stuxfred-candidate.csv`  
(60 NEAR/BTC perp fills, wallet `0x69906b0ed626ca01a4b7c001e5711e5714ccf207`, leaderboard label stuxfred — **not your wallet**.)

## Before import

1. Switch to **real mode** (not demo). Demo blocks import.
2. Create a **USDC** account (quote picker on both flows):
   - **Start my journal** (first account): name e.g. `Public HL · stuxfred`, tap **USDC** under **Quote currency**, then **Create account**.
   - Or **Settings → Manage accounts**: same name, select **USDC**, **Create account**.
   - Fees in the CSV are USDC; the app does not convert USDC↔USD.
3. Copy the CSV to the phone/emulator (USB, cloud drive, or email attachment).

## File picker steps (Android)

1. **Settings → Import trades**
2. **Choose CSV file**
3. Select `public.hyperliquid.fills.v1__stuxfred-candidate.csv` (or your export with the same headers).
4. **Preview:** confirm “Hyperliquid public fills (third-party)”, third-party banner, **Import 60 public fills**.
5. **Commit** → **View public fills** to see the execution ledger.

## What you get

- One row per fill: price, size, fee (USDC), exchange **closedPnl** when non-zero.
- **No** synthetic round-trip trades, stops, R, or funding.
- Undo import removes the batch only; other journal data is untouched.

## Headers (exact)

`tid,oid,hash,time_ms,time_utc,coin,side,dir,px,sz,startPosition,fee,feeToken,builderFee,closedPnl,crossed`
