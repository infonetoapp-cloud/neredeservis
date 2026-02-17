# NeredeServis Amber UI Spec (V1.0)

## 1) Purpose
- Defines the canonical UI system for V1.0 Amber direction.
- This document is implementation guidance for Flutter UI code.

## 2) Visual Direction
- Tone: clear, high-contrast, low-noise, operation-first.
- Core principle: one screen, one primary decision.
- Driver active-trip screen prioritizes road safety and glanceability.

## 3) Design Tokens

### 3.1 Colors
- `amber-500`: `#E8760A`
- `amber-400`: `#FF9042`
- `amber-100`: `#FFF3E7`
- `ink-900`: `#101413`
- `ink-700`: `#27312D`
- `surface-0`: `#FFFFFF`
- `surface-50`: `#F7F8F5`
- `line-200`: `#D8DFD4`
- `success`: `#3DA66A`
- `danger`: `#D64E45`

### 3.2 Typography
- Heading family: `Space Grotesk`
- Body family: `Manrope`
- Heading weights: `700`, `800`
- Body weights: `500`, `600`

### 3.3 Spacing and Radius
- Base grid: `4px`
- Spacing scale: `8, 12, 16, 20, 24, 32`
- Radius scale: `14, 20, 28`

## 4) Core Interaction Rules
- Primary CTA: amber background, dark text.
- Secondary CTA: dark/outline style.
- No destructive single-tap action on active trip.
- `Seferi Bitir` requires `slide-to-finish` or `long-press`.

## 5) Screen Contracts

### 5.1 Splash and Hook
- Minimal text.
- Clear start CTA.
- No redundant copy blocks.
- Video onboarding uses phased rollout:
  - phase 1: video-ready shell (poster + skip + CTA)
  - phase 2: real video asset integration
  - phase 3: release performance polish
- Video failure must fallback to static poster without blocking onboarding/auth.
- Default playback is muted and max one loop on first open.

### 5.2 Role Select
- Exactly two clear paths: Driver / Passenger.
- No tertiary distractions.

### 5.3 Driver Home
- Route cards list with clear hierarchy.
- Last used route surfaced first.

### 5.4 Driver Active Trip (Map + Guidance + Heartbeat)
- Mandatory elements:
  - simple map
  - guidance lite (`Siradaki Durak`, `Kus ucusu mesafe`)
  - heartbeat status (`green/yellow/red`)
- Red state must include peripheral alert:
  - red border flash
  - distinct haptic pattern
  - optional voice cue if enabled
- OLED burn-in protection:
  - heartbeat and status label micro-shift every 60s (2-3px)

### 5.5 Passenger Live Map
- ETA + stale state + driver note in single bottom sheet.
- Delay inference badge shown when:
  - `now > scheduledTime + 10 min`
  - no active trip

### 5.6 Join and Settings
- Join by SRV/QR with low friction.
- Settings include subscription, consent, support, account delete.

## 6) Permission UX
- No bulk prompt on onboarding.
- Prompt only on value moment.
- Denial must show impact + settings CTA.
- Passenger/guest never sees location permission flow.

## 7) Paywall UX
- Driver-only visibility.
- Entry points:
  - `Ayarlar > Abonelik`
  - trial-end banner
  - premium action intercept
- Label rules:
  - iOS: `Restore Purchases`
  - Android: `Satin Alimlari Geri Yukle`
  - both: `Manage Subscription`
- Copy source is `docs/NeredeServis_Paywall_Copy_TR.md`.

## 8) Accessibility and Quality
- Minimum tap target: `44x44`.
- Text contrast must pass WCAG AA for core UI.
- Primary flows must work on low-end Android and iPhone 11 class devices.
- Turkish text must render correctly (`UTF-8` validation).

## 9) Motion and Feedback
- Meaningful animations only:
  - heartbeat pulse
  - stale-state transitions
  - safe action confirmations
- Onboarding video is non-critical motion; respect reduced-motion and fallback to static poster.
- Avoid decorative animation noise in operational screens.

## 10) Acceptance Rule
- UI merge requires:
  - golden tests updated
  - core widget tests green
  - screenshot review against this spec
