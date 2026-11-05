# 26 — E2E suite and visual baseline

## Goal
Consolidate the Maestro flows into a reliable suite, produce a deterministic screenshot set, run the final side-by-side review against the mockups, and accept a visual baseline.

## Depends on
25.

## Read first
`docs/design-system.md` §4, §7; `docs/testing-strategy.md`.

## Scope
1. A deterministic clock for screenshots: a dev/e2e-only env `EXPO_PUBLIC_FIXED_NOW=2026-11-05T14:45:00Z` plus `EXPO_PUBLIC_FIXED_TZ=UTC`, read by `useNow`/the demo generator/`useDisplayTz` **only when `__DEV__`**.
   `check-release-config` fails if these are set for release.
2. `e2e/` suite: `smoke`, `onboarding`, `quick-add`, `dashboard`, `history`, `import`, `insights`, `tilt`, `settings`, `backup`, `pro` (mock). Shared subflows in `e2e/common/` (launch fresh, enter demo, enter real with an account).
   `npm run e2e` runs them all; `e2e/README.md` documents the emulator profile (design-system §7) and the prerequisites.
3. `e2e/screenshots.yaml`: captures, in demo mode with the fixed clock: dashboard (top + scrolled), quick add (empty + worked example filled in), trades, trade detail, import source, import preview (real anonymized fixture in real mode), import result, insights (calendar + hours + tilt), paywall, settings, onboarding welcome, plus the widget (manual).
   Plus a font-scale-1.3 variant of the dashboard, quick add and import preview (`adb shell settings put system font_scale 1.3`).
4. Side-by-side review: build `docs/design/review.md` with, per mockup panel, the mockup crop reference, our screenshot path, a checklist (structure, colors, type, spacing, states, the deviations from design-system §4) and a verdict. Fix any visual defects found (spacing, typography, alignment) in this step.
5. Accept the baseline: copy the final screenshots to `docs/design/accepted/` (PNG, optimized with `pngquant` or `oxipng` if available, otherwise as-is; ≤ 400 KB each). Future UI changes must update the accepted images in the same commit.

## Out of scope
Pixel-diff CI (optional future), store marketing graphics (28 uses these screenshots as raw material).

## Acceptance criteria
`npm run e2e` passes 3 consecutive times on a fresh emulator (flake check); the screenshot set is complete; review.md has a verdict per screen with no open "fail".

## Gates
A, D, V.
