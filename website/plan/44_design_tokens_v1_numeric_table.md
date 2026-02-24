# Design Tokens V1 Numeric Table (Draft)

Tarih: 2026-02-24
Durum: V1 freeze candidate (Faz 1-3 visual baseline)

## 1. Amac

`38_design_system_tokens_typography_and_brand.md` dokumanindaki prensipleri sayisal/tanimli tokenlara cevirmek.

Not:
- Bu degerler V1 draft'tir
- UI comps cizilirken ince ayar yapilabilir
- Faz 1 baslangicinda token adlari korunarak degerlerde minör tuning yapılabilir

## 2. Typography Tokens (V1 Draft)

## 2.1 Font Families

- `font.ui`: `"Manrope", ui-sans-serif, system-ui, sans-serif`
- `font.display`: `"Space Grotesk", "Manrope", ui-sans-serif, system-ui, sans-serif`
- `font.mono`: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`

Karar (locked direction):
- Panel UI base = `Manrope`
- Landing display/headline = `Space Grotesk`
- Apple-benzeri kalite hissi = tipografi hiyerarsisi + spacing disiplini ile saglanacak

## 2.1.1 Font Weights (semantic)

- `fw.medium` = `500`
- `fw.semibold` = `600`
- `fw.bold` = `700`
- `fw.extrabold` = `800` (landing display sinirli)

## 2.2 Font Sizes (px)

- `fs.12` = `12`
- `fs.13` = `13`
- `fs.14` = `14`
- `fs.15` = `15`
- `fs.16` = `16`
- `fs.18` = `18`
- `fs.20` = `20`
- `fs.24` = `24`
- `fs.28` = `28`
- `fs.32` = `32`
- `fs.40` = `40`

## 2.3 Line Heights

- `lh.tight` = `1.15`
- `lh.title` = `1.2`
- `lh.body` = `1.45`
- `lh.relaxed` = `1.6`

## 2.4 Letter Spacing

- `ls.tight` = `-0.02em`
- `ls.normal` = `0`
- `ls.wide` = `0.02em`

## 2.5 Type Roles (semantic mapping)

- `type.pageTitle`: `fs.28`, `lh.title`, `font.ui`, `700`
- `type.sectionTitle`: `fs.20`, `lh.title`, `font.ui`, `700`
- `type.cardTitle`: `fs.16`, `lh.title`, `font.ui`, `600`
- `type.body`: `fs.14`, `lh.body`, `font.ui`, `500`
- `type.bodyStrong`: `fs.14`, `lh.body`, `font.ui`, `600`
- `type.caption`: `fs.12`, `lh.body`, `font.ui`, `500`
- `type.displayHero`: `fs.40`, `lh.tight`, `font.display`, `700`
- `type.kpiValue`: `fs.24`, `lh.tight`, `font.ui`, `700`
- `type.navLabel`: `fs.14`, `lh.body`, `font.ui`, `600`
- `type.tableCell`: `fs.14`, `lh.body`, `font.ui`, `500`
- `type.tableHeader`: `fs.12`, `lh.body`, `font.ui`, `600`, `ls.wide`

## 3. Spacing Tokens (px)

- `space.0` = `0`
- `space.1` = `4`
- `space.2` = `8`
- `space.3` = `12`
- `space.4` = `16`
- `space.5` = `20`
- `space.6` = `24`
- `space.7` = `28`
- `space.8` = `32`
- `space.10` = `40`
- `space.12` = `48`
- `space.14` = `56`
- `space.16` = `64`
- `space.20` = `80`

## 4. Radius Tokens (px)

- `radius.sm` = `10`
- `radius.md` = `14`
- `radius.lg` = `18`
- `radius.xl` = `24`
- `radius.2xl` = `32`
- `radius.pill` = `9999`

## 5. Border Tokens

- `border.width.hairline` = `1`
- `border.width.strong` = `1.5`

## 6. Shadow Tokens (V1 Draft)

CSS-style draft values:

- `shadow.sm` = `0 1px 2px rgba(16,24,40,0.06), 0 1px 1px rgba(16,24,40,0.04)`
- `shadow.md` = `0 8px 24px rgba(16,24,40,0.08), 0 2px 6px rgba(16,24,40,0.04)`
- `shadow.lg` = `0 16px 40px rgba(16,24,40,0.10), 0 4px 10px rgba(16,24,40,0.05)`
- `shadow.focus` = `0 0 0 4px rgba(37, 99, 235, 0.18)`

Kural:
- Panelde `shadow.md` ana elevated card defaultu olabilir.
- Dashboard KPI kartlari ve drawer'larda `shadow.md`, modal/layer emphasis'te `shadow.lg` tercih edilir

## 7. Color Tokens (V1 Draft, Light-first)

## 7.1 Brand

- `color.brand.500` = `#2563EB`
- `color.brand.600` = `#1D4ED8`
- `color.brand.100` = `#DBEAFE`
- `color.brand.050` = `#EFF6FF`

Not:
- Mavi secimi "kurumsal guven + operasyon netligi" icin
- Faz 1 comps sonrasinda ton ince ayar yapilabilir

Brand kullanimi kuralı (locked):
- Brand blue ana CTA / odak / aktif state icin
- Mor (`ops.selected`) sadece live ops secim vurgusunda sinirli
- Panelde birden cok "marka rengi" olusturulmaz

## 7.2 Neutral Surfaces / Text

- `color.bg.canvas` = `#F6F7FB`
- `color.bg.surface` = `#FFFFFF`
- `color.bg.surfaceElevated` = `#FFFFFF`
- `color.bg.subtle` = `#F2F4F7`

- `color.border.subtle` = `#E6EAF2`
- `color.border.default` = `#D7DDE8`
- `color.border.strong` = `#C2CBDA`

- `color.text.primary` = `#0F172A`
- `color.text.secondary` = `#475467`
- `color.text.tertiary` = `#667085`
- `color.text.inverse` = `#FFFFFF`

## 7.3 Semantic

- `color.success.500` = `#16A34A`
- `color.success.100` = `#DCFCE7`

- `color.warning.500` = `#D97706`
- `color.warning.100` = `#FEF3C7`

- `color.danger.500` = `#DC2626`
- `color.danger.100` = `#FEE2E2`

- `color.info.500` = `#0284C7`
- `color.info.100` = `#E0F2FE`

## 7.4 Live Ops Tokens

- `color.ops.live` = `#10B981`
- `color.ops.stale` = `#F59E0B`
- `color.ops.offline` = `#94A3B8`
- `color.ops.route` = `#2563EB`
- `color.ops.selected` = `#7C3AED`

## 8. Motion Tokens

Duration:
- `motion.fast` = `120ms`
- `motion.normal` = `180ms`
- `motion.slow` = `260ms`

Easing:
- `motion.ease.standard` = `cubic-bezier(0.2, 0.0, 0, 1)`
- `motion.ease.emphasized` = `cubic-bezier(0.2, 0.8, 0.2, 1)`

Motion kullanım kuralı:
- panel list/table ekranlarinda motion minimal
- drawer/map/panel transitions'ta `motion.normal`
- auth/landing hero micro transitions'ta `motion.slow` (sinirli)

## 9. Z-Index Tokens (basic)

- `z.base` = `0`
- `z.header` = `10`
- `z.dropdown` = `20`
- `z.drawer` = `30`
- `z.modal` = `40`
- `z.toast` = `50`

## 10. Component Size Tokens (MVP)

Buttons:
- `btn.height.sm` = `36`
- `btn.height.md` = `42`
- `btn.height.lg` = `48`

Inputs:
- `input.height.md` = `44`
- `input.height.lg` = `48`

Table:
- `table.row.height.compact` = `40`
- `table.row.height.default` = `48`
- `table.row.height.comfortable` = `56`

Nav/Layout:
- `sidebar.width.expanded` = `264`
- `sidebar.width.collapsed` = `84`
- `topbar.height` = `64`
- `page.maxContentWidth` = `1440`
- `page.contentPaddingX.desktop` = `24`
- `page.contentPaddingY.desktop` = `20`

Drawer:
- `drawer.width.sm` = `360`
- `drawer.width.md` = `420`
- `drawer.width.lg` = `520`

Cards:
- `card.padding.md` = `16`
- `card.padding.lg` = `20`
- `card.gap` = `12`

Filter/Search row:
- `filterbar.height` = `48`
- `filterbar.gap` = `8`

Map (live ops):
- `liveOps.leftPane.minWidth` = `320`
- `liveOps.leftPane.maxWidth` = `420`
- `liveOps.detailDrawer.width` = `420`
- `liveOps.marker.size.default` = `12`
- `liveOps.marker.size.selected` = `16`

## 11. CSS Variable Mapping Plan (implementation note)

Implementation sirasinda (ornek naming):
- `--nsv-color-bg-canvas`
- `--nsv-color-text-primary`
- `--nsv-space-4`
- `--nsv-radius-md`
- `--nsv-shadow-md`

Kural:
- token isimleri feature bazli degil, system bazli olacak

## 12. Review Triggers

Asagidakiler olursa token revizyonu:
- spacing da tutarsizlik tekrarliyor
- panel ERP hissine kayiyor
- live ops ekrani kontrast/okunabilirlik sorunu yasatiyor
- landing ve panel brand dili kopuyor

## 13. Freeze Scope (Faz 1-3)

Faz 1'de frozen kabul edilenler:
- typography family/scale direction
- spacing/radius/shadow token isimleri
- ana color token isimleri ve base palette
- nav/layout temel olculeri

Faz 2/3'te tune edilebilecekler (breaking olmayan):
- brand tone ince ayari (hex küçük farklar)
- shadow kuvveti
- table row density varsayilanı
- live ops marker size/kontrast tuning

Kural:
- Token isimleri degistirilmezse styling refactor maliyeti dusuk kalir.
