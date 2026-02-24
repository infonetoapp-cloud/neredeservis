# Figma Design + Handoff Structure Plan (Web)

Tarih: 2026-02-24
Durum: V0 / process plan

## 1. Amac

Tasarim calismalari kodlamaya gecerken:
- daginik figma sayfalari
- isimlendirme karmasasi
- handoff eksikligi
olmasin.

Bu dokuman Figma/process standardini tanimlar.

## 2. Figma Dosya Yapisi (onerilen)

Tek ana dosya ile baslanabilir (MVP), ama sayfalar net ayrilir:

Pages:
1. `00-Foundations`
2. `01-Components`
3. `02-Patterns`
4. `10-Landing`
5. `20-Panel-Auth`
6. `21-Panel-Individual`
7. `22-Panel-Company`
8. `23-Panel-LiveOps`
9. `90-Flows-Prototype`
10. `99-Archive`

## 3. Foundations Page Icerigi

- typography scale
- color tokens
- spacing/radius/shadow tokens
- icon usage examples
- motion principles notes

Referans:
- `38_design_system_tokens_typography_and_brand.md`
- `44_design_tokens_v1_numeric_table.md`

## 4. Components Page Icerigi

MVP component seti:
- buttons
- inputs
- select/dropdown
- chips/status badges
- cards
- table row patterns
- empty/error states
- dialogs/modals
- drawers
- top bar / side nav

Kural:
- component varyantlari acik naming ile

## 5. Patterns Page Icerigi

Patternlar:
- Management Page (table + filter + drawer)
- Detail Workspace
- Live Ops Split View
- Auth Screen

Referans:
- `40_panel_visual_patterns_and_interaction_spec.md`

## 6. Screen Pages (Landing + Panel)

Kural:
- ekranlar feature/flow bazli gruplanir
- "random screen dump" yapilmaz

Ornek:
- `20-Panel-Auth`: login, forgot password, auth error states
- `21-Panel-Individual`: dashboard, routes, route detail, stops editor
- `22-Panel-Company`: dashboard, drivers, vehicles, members
- `23-Panel-LiveOps`: live map variants

## 7. Naming Convention (Figma Frames/Components)

### Components

Format:
- `Component / Variant / State`

Ornek:
- `Button / Primary / Default`
- `Button / Primary / Hover`
- `StatusChip / Live / Default`

### Frames

Format:
- `<Area> / <Screen> / <State>`

Ornek:
- `PanelAuth / Login / Default`
- `PanelCompany / DriversList / Empty`
- `PanelOps / LiveOps / Loaded`

## 8. Handoff Paketinde Zorunlu Olanlar

Bir ekran kodlamaya gecmeden once Figma tarafinda:
- [ ] default state
- [ ] loading state
- [ ] empty state (gerekliyse)
- [ ] error/forbidden state (gerekliyse)
- [ ] responsive note (desktop/tablet/mobile behavior)
- [ ] interactions note (drawer/modal/transition)
- [ ] component references (hangi componentler kullaniliyor)

## 9. Engineering Handoff Notlari (Figma disi)

Her ekran icin issue/PR'e baglanacak:
- route path
- role/permission etkisi
- API dependency
- acceptance criteria

Referans:
- `41_design_quality_review_and_handoff_checklist.md`
- `36_github_epics_and_issue_template_plan.md`

## 10. Review Ritmi (tasarim -> muhendislik)

Onerilen ritim:
- haftalik design review (15-30 dk)
- implementasyon oncesi handoff review
- implementasyon sonrasi parity check

## 11. "Premium gorunum kaybolmasin" kuralı

Kodlama sonrasi ekran review'unda:
- spacing
- typography
- hierarchy
- state tasarimi
kontrol edilir.

Figma tasarimi guzel olup implementasyon "ERP" hissine kayiyorsa:
- parity bug/task acilir

## 12. Faz 1 Handoff Scope

Faz 1 icin Figma'da hazir olmasi yeterli ekranlar:
- Landing hero + CTA shell
- Panel login
- Panel shell (top bar + side nav)
- Mode selector placeholder
- Company selector placeholder

Faz 2/3 ekranlari sonradan bu sistemle genisletilir.
