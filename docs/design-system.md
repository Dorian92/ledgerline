# Ledgerline — Design system and visual acceptance

Reference mockups (attached to the planning request; **user action U-01**: commit them to
`docs/design/mockups/` as `overview.png`, `1-dashboard.png`, `2-import.png`):
- **overview**: Dashboard, Import trades, Quick add (bottom sheet), Trades (history), Insights (PRO), Android home widget.
- **1-dashboard**: full-height dashboard.
- **2-import**: full-height import preview.

The look is dark, premium and restrained fintech. Mockup numbers are **demo data, not specs**.

## 1. Tokens (`src/ui/tokens.ts`)

```ts
export const color = {
  bg: '#0B0E14', card: '#131824', cardRaised: '#171D2B', border: '#1F2833',
  text: '#E8ECF4', textSecondary: '#9AA3B5', textMuted: '#6B7486',   // verify contrast, §5
  violet: '#7C5CFF', violetPressed: '#6A4AF0', violetSoft: 'rgba(124,92,255,0.14)',
  green: '#22C55E', greenSoft: 'rgba(34,197,94,0.14)',
  red: '#F43F5E', redSoft: 'rgba(244,63,94,0.14)',
  amber: '#F59E0B', amberSoft: 'rgba(245,158,11,0.14)',        // duplicates/warnings (import mockup)
  neutralCell: '#1A2130',
} as const;
export const radius = { card: 16, control: 12, pill: 999, fab: 20 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;
```
`text*`, `amber` and `neutralCell` are derived from the mockups by eye. Step 02 may adjust them, but only to meet contrast requirements.

## 2. Typography

- UI: **Inter** 400/500/600/700. Figures (PnL, prices, quantities, R, %, table cells): **JetBrains Mono**
  400/500/600 with `fontVariant: ['tabular-nums']`.
- Scale (sp): hero figure 40/48 mono 600 · screen title 26 Inter 700 · section title 17 Inter 600 ·
  body 15 · secondary 13 · caption/label 11–12 uppercase with letter-spacing 0.6 (e.g. "NET PNL · 30D", "WIN RATE").
- Respect system font scaling up to 1.3×. Beyond that, the hero figure may shrink via `adjustsFontSizeToFit`, but body text must not.

## 3. Components (from mockups)

| Component | Spec |
|---|---|
| `Card` | bg `card`, 1 px `border`, radius 16, padding 16 |
| `StatTile` | Card with uppercase caption + mono value (Win rate, Avg R, Max DD) |
| `Segmented` | pills 7D/30D/YTD/ALL; selected = violet fill, white text; unselected = card bg + border |
| `Pill` | LONG (greenSoft bg, green text), SHORT (redSoft/red), DEMO DATA (violet outline), PRO (violet fill) |
| `Money` | mono, sign-colored (green ≥ +0.01, red ≤ −0.01, text for 0), respects hide-amounts |
| `TradeRow` | symbol (600) + side pill + leverage `2x` muted; second line `HH:mm · Setup`; right: net PnL + R in muted |
| `Fab` | 64 dp violet square, radius 20, `+` icon, bottom-right above tab bar, elevation |
| `Banner` (tilt) | Card with red border, ⚠ icon, red title, secondary body |
| `Chip` | emotion/setup chips: unselected outline; selected violet fill; emoji optional (mockup: 😌 Calm, ⚡ FOMO, 😤 Revenge, 😨 Fear) |
| `Sheet` | quick add bottom sheet: grabber, title, close ×, violet primary "Save trade" fixed bottom |
| `ExchangeTile` | import source: square card, brand-colored monogram badge (B/BY/OK), name; selected = violet border. Use **monograms only**, not exchange logos (trademarks). |
| `PreviewTable` | mono rows: status icon, TIME, SYMBOL, SIDE (green BUY/red SELL), QTY, PRICE; duplicate row amber tint, error row red tint |
| `Heatmap` | 7-column month grid, rounded cells, green/red opacity steps |
| `BarChart` | hour-of-day bars green above/red below baseline |
| `EquityChart` | green line + vertical gradient fill to transparent, dotted gridlines, end dot |
| `TabBar` | 4 tabs, active violet label + dot indicator |

## 4. Mockup corrections (deliberate deviations)

The mockups contain demo inconsistencies. The implementation must follow the data, not copy the pixels:

1. **Import counts:** 312 valid + 9 duplicates + 4 warnings ≠ 316 rows, and the button says 303. We use
   the invariant from import-spec §4, and the button shows "Import M trades from N rows".
2. **"Row 6 missing fill price — fix or skip":** v1 has no inline fixing. The copy is "Row 6 has no fill price and
   will be skipped. Fix it in the file and import again; rows already imported won't be duplicated."
3. **Quick add computed panel:** +$124.13 / +2.11R is gross-based. We show **net** first (+120.03 USDT, +2.04R)
   and "Gross +124.13 · Fees 4.10 · Risk 58.88" as a secondary line (financial-semantics §3.3).
4. **Dashboard recent trades** all show 14:32, and SOL is +96.20 on the dashboard but +124.10 in history. Real data won't do that.
   The demo generator must produce consistent data across screens and the widget (step 06 test).
5. **Daily totals** (Wed Nov 4: rows sum to −212.65 while the header shows −212.45). Daily headers are computed, never stored.
6. **Currency glyph:** `$` only for USD accounts. USDT/USDC show the code (§8 of financial-semantics).
   The demo account uses **USD**, so demo screens can match the mockup glyph.
7. **"Parsed on-device. Your file never leaves this phone."** is kept, and it's true by design.
8. **Insights "example text"** labels in the tilt section become real computed text plus a "How is this calculated?" link to the rule's thresholds and sample size.
9. **Widget** shows today's net, trade count, W/L and avg R; `+` opens quick add. When amounts are hidden or in demo mode, see step 23.
10. **Status bar** (9:41, battery) is mockup chrome only. We use the real system bar with light content.

## 5. Accessibility requirements (checked in every UI step, audited in step 25)

- Contrast: body/secondary text ≥ 4.5:1 on `card` and `bg`; large figures ≥ 3:1. Verify with a contrast calculator and record the values in the step 02 PR notes.
- Color is never the only signal: PnL has a sign, sides have text (LONG/SHORT, BUY/SELL), and import statuses have an icon plus text.
- Touch targets ≥ 48×48 dp (pills/chips get `hitSlop`).
- Every interactive element has `accessibilityRole` and `accessibilityLabel`. Money labels read as words ("profit 2,526 dollars 40 cents", "loss 138.50 USDT").
  Charts get an `accessibilityLabel` summary ("Equity from 10,000 to 12,526 over 30 days, max drawdown 8.7 percent") and are otherwise hidden from TalkBack.
- Focus order follows the visual order. The sheet traps focus, and the close button is first.
- Reduce motion: honor `AccessibilityInfo.isReduceMotionEnabled` (no chart animation).

## 6. States (every data screen)

| State | Pattern |
|---|---|
| loading | skeleton blocks matching the layout (no spinners for < 300 ms; delay skeleton by 150 ms) |
| empty | illustration-free: icon, title, one sentence, primary action ("Import trades", "Add a trade"), secondary "Try demo data" |
| error | "Couldn't load your trades." + "Try again" + "Copy error details" |
| insufficient data | for insights/R: what's missing and how many trades are needed |

## 7. Visual acceptance process

For each UI step:
1. Run on an Android emulator: **Pixel 7 profile, API 34+, 1080×2400, font scale 1.0**, in demo mode (seeded deterministic data) and with real-mode empty data.
2. Capture screenshots with Maestro `takeScreenshot` (flows in `e2e/`) or `adb exec-out screencap -p > e2e/screenshots/<step>-<screen>.png`.
3. Compare side by side with the mockup (`docs/design/mockups`), using the checklist in the step plan: layout order, tokens, typography, spacing rhythm, states. Pixel-perfect isn't the goal. **Structure, hierarchy, colors and type must match**, and the deviations in §4 are expected.
4. Attach the screenshots to the step's PR or commit notes (`docs/visual-log.md` gets one line per screen with the path and verdict). Screenshots aren't committed except the accepted baseline set in `docs/design/accepted/` (step 26).
5. Font scale 1.3 screenshot for the same screen: nothing clipped or overlapping.
