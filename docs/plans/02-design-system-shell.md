# 02 — Design system and app shell

## Goal
Implement the tokens, typography and core UI primitives from the mockups, the 4-tab navigation shell
with placeholder screens, and the Maestro smoke harness.

## Depends on / user actions
01. U-01 (mockups in `docs/design/mockups/`) for the visual gate.

## Read first
`docs/design-system.md` (all), `docs/architecture.md` §5.

## Scope
1. Dependencies (via `npx expo install`): `expo-font`, `@expo-google-fonts/inter`, `@expo-google-fonts/jetbrains-mono`,
   `react-native-svg`, `react-native-safe-area-context`, `react-native-screens` (usually already present), `expo-haptics`, `@expo/vector-icons` (already in Expo; use `Feather`/`Ionicons`).
2. `src/ui/tokens.ts`: exactly as design-system §1. `src/ui/typography.ts`: named text styles
   (`hero`, `title`, `section`, `body`, `secondary`, `caption`, `mono`, `monoSmall`).
3. Font loading in `app/_layout.tsx` with `useFonts` and keep the splash until loaded (`SplashScreen.preventAutoHideAsync`).
4. Primitives in `src/ui/` (each a file with props typed, `testID` passthrough, a11y props):
   `Text` (variant prop), `Card`, `StatTile`, `Segmented<T>`, `Pill` (variants: long, short, demo, pro, neutral),
   `Button` (primary violet, secondary outline, destructive red text; loading/disabled), `IconButton`,
   `Fab`, `Chip` (selectable), `Banner` (tones: danger, warning, info), `EmptyState`, `ErrorState`, `Skeleton`,
   `Sheet` (modal content container with grabber + title + close), `ScreenHeader` (title, eyebrow, right slot for the DEMO pill),
   `Divider`, `ListRow`. `Money` and `TradeRow` come later (steps 03/08), because they need domain formatting.
5. Tabs: `app/(tabs)/_layout.tsx` with expo-router `Tabs` and a custom `tabBar` component
   `src/ui/TabBar.tsx` (bg `bg`, top border `border`, active = violet label + 4 dp dot above the label, inactive = `textMuted`).
   Tabs: Home (`index`), Trades, Insights, Settings. Each screen has a `ScreenHeader` and an `EmptyState` placeholder with real copy:
   - Home: "Your dashboard will appear here."
   - Trades: "No trades yet."
   - Insights: "Insights need some closed trades."
   - Settings: "Settings".
6. Move `app/index.tsx` so that the root redirects to `(tabs)`. Onboarding routing comes in step 06.
7. Status/navigation bars: `expo-status-bar` light style, nav bar color `bg` (via `expo-navigation-bar` if needed for SDK edge-to-edge; follow the SDK's recommended approach).
8. A dev-only gallery screen `app/dev/ui-gallery.tsx` (registered only when `__DEV__`; link from Settings in dev) that renders every primitive in all variants. It's used for screenshots.
9. Maestro harness: `e2e/smoke.yaml` (launch app → assert the "Home" tab is visible → tap each tab → assert the headers), `e2e/README.md` (install Maestro, run commands, screenshot conventions). `appId` comes from the config.
10. Contrast table: compute ratios for `text`, `textSecondary`, `textMuted`, green, red and violet on `bg` and `card`. Adjust `textMuted` if it's below 4.5:1 for body use (or restrict it to ≥ 18sp/decorative), and record the results in `docs/design-system.md` §5.

## Out of scope
Charts, Money formatting, any data, onboarding, Light mode (dark only).

## Tests
- Component tests: `Segmented` calls `onChange` and marks the selected item with `accessibilityState.selected`; `Button` disabled/loading
  states; `Chip` toggles; `Pill` renders its text; `EmptyState` renders title + action; `TabBar` renders 4 tabs with `accessibilityRole="tab"`.

## Acceptance criteria
- All primitives exist, are typed, and appear in the gallery.
- Tab bar and headers visually match the mockup structure (G-V).
- `maestro test e2e/smoke.yaml` passes.

## Gates
A, D (`npm run android` + `maestro test e2e/smoke.yaml`), V (gallery + 4 tabs; compare the tab bar, card style, pills and FAB to the mockup).

## Visual check
Screenshots: `02-gallery-1.png`, `02-gallery-2.png`, `02-tabs-home.png`. Check: bg/card/border colors, 16 radius, Inter for UI, JetBrains Mono for numbers in the gallery samples, violet active tab with dot.

## Review checklist
- [ ] Every interactive primitive has a role/label and a ≥ 48 dp target (`hitSlop` where it's smaller visually).
- [ ] No hard-coded colors outside `tokens.ts`.
- [ ] The gallery is excluded from release navigation.

## Risks / notes
`fontVariant: ['tabular-nums']` with JetBrains Mono is redundant (it's monospaced), but keep it for Inter numerals in captions.
