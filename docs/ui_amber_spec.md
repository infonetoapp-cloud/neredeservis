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
- `warning`: `#8A5F00`
- `warning-strong`: `#7A5200`
- `danger-strong`: `#C13E36`

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

### 4.1 CTA Hierarchy
- Per screen, only one visual-primary CTA is allowed.
- Priority order:
  - level-1: `primary` (amber filled)
  - level-2: `secondary` (outline/dark)
  - level-3: `text action` (low-emphasis)
- `danger` CTA must never be visually dominant when a safe alternative exists.
- Driver active-trip screen:
  - safe operational action stays level-1
  - destructive action (`Seferi Bitir`) stays guarded and non-dominant
- Max visible CTAs in one viewport:
  - 1 primary
  - up to 1 secondary
  - optional tertiary text action

### 4.2 Component Architecture Contract
- UI implementation must be component-first, not screen-first.
- Core reusable primitives are mandatory:
  - buttons
  - inputs
  - chips/pills
  - cards/banners
  - sheets/scaffold shells
- Required state model for interactive components:
  - `default`
  - `pressed`
  - `focus`
  - `disabled`
  - `error` (where applicable)
- One-off visual blocks are not accepted if they can be generalized into reusable Amber components.

## 5) Screen Contracts

### 5.1 Splash and Hook
- Minimal text.
- Clear start CTA.
- No redundant copy blocks.
- V1.0 auth acilisi statik hero varlikla calisir (`assets/images/start.jpeg`).
- V1.0 scope'ta video baslatilmaz.
- Hero varlik acilamazsa fallback arkaplan ile auth akisi bloklanmadan devam eder.

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

### 5.7 Auth Hero Entry (Login/Register)
- Screen structure:
  - full-screen hero image
  - readability layer (`gradient` + optional dark scrim)
  - foreground action layer (CTA stack)
- Foreground action layer includes:
  - `Google ile giris`
  - `Uye ol`
  - `Giris yap`
- `Misafir` CTA auth hero ekraninda gosterilmez.
- Layout rules:
  - safe-area aware top/bottom spacing
  - text and CTA contrast must stay AA-compliant over image
  - no hardcoded crop that breaks on `16:9`, `19.5:9`, `20:9`
- Failure rule:
  - if hero asset fails, fallback to solid/surface gradient background and keep auth flow fully usable.

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
- Visual quality bar is production-grade premium UIX; default Flutter look-and-feel is not an acceptable baseline.

## 9) Motion and Feedback
- Meaningful animations only:
  - heartbeat pulse
  - stale-state transitions
  - safe action confirmations
- Auth giris ekraninda video motion yok; statik hero + hafif fade gecisleri kullanilir.
- Avoid decorative animation noise in operational screens.
- Motion baseline:
  - fade: `120-180ms`, `easeOut`
  - slide: `180-240ms`, `easeOutCubic`
  - interactive confirmation: max `300ms`
- Never animate layout-critical content in a way that delays user input.

## 10) Font Fallback Strategy
- Primary families:
  - heading: `Space Grotesk`
  - body: `Manrope`
- Runtime source:
  - local asset first (required for V1.0)
- Fallback chain:
  - heading: `Space Grotesk -> Manrope -> system sans`
  - body: `Manrope -> Space Grotesk -> system sans`
- Missing-glyph behavior:
  - do not crash or block render
  - render with fallback family and keep layout stable
- Turkish glyph gate:
  - must render `C/c`, `G/g`, `I/ı`, `O/o`, `S/s`, `U/u` variants correctly

## 11) Acceptance Rule
- UI merge requires:
  - golden tests updated
  - core widget tests green
  - screenshot review against this spec

## 12) Final Freeze Notes (Step 170-178)
- Freeze label: `AMBER_UI_FREEZE_2026_02_18`.
- Amber UI son gorunum onayi: kullanici onayi alindi, duzeltme turu kapatildi.

### 12.1 Icon Set Freeze (Step 172)
- Amber UI icon kaynagi sadece `Phosphor (Regular)` olarak sabitlendi.
- Teknik kaynak: `lib/ui/tokens/icon_tokens.dart`.
- `lib/ui` altinda `Icons.*` kullanimi yasak (governance testi ile korunur).

### 12.2 Emoji Governance (Step 173)
- Emoji kullanimi UI metinlerinde yasak.
- Emoji yalniz duyuru/sablon katmaninda kontrollu olarak kullanilabilir.
- `lib/ui` ve paywall copy kaynaklari test ile denetlenir.

### 12.3 Driver Active Trip Rule (Step 174)
- Ekranda su uc oge birlikte zorunlu:
  - mini harita shell
  - heartbeat gostergesi
  - `Siradaki Durak + kus ucusu mesafe`
- Bu kontrat widget testi ile sabitlenmistir.

### 12.4 Passenger Single-Sheet Rule (Step 175)
- Passenger takip ekraninda yalniz bir adet `DraggableScrollableSheet` bulunur.
- Coklu sheet veya paralel alt panel davranisi kabul edilmez.

### 12.5 Primary CTA Text Standard (Step 176)
- Standart CTA metin tokenlari:
  - `Devam Et`
  - `Koda Katil`
  - `Seferi Baslat`
  - `Seferi Bitir`
  - `Aboneligi Yonet`
- Teknik kaynak: `lib/ui/tokens/cta_tokens.dart`.

### 12.6 Warning/Error Color Schema (Step 177)
- `warning`: `#8A5F00`
- `warning-strong`: `#7A5200`
- `danger`: `#D64E45`
- `danger-strong`: `#C13E36`
- Warning/error chip ve banner semasi bu tokenlar ile sabitlenmistir.

### 12.7 Toast/Snackbar Schema (Step 178)
- Tone seti: `info | success | warning | error`
- Teknik kaynak: `lib/ui/components/feedback/amber_snackbars.dart`
- Varsayilan ikon ve arkaplan semasi tone'a gore sabitlenmistir.
