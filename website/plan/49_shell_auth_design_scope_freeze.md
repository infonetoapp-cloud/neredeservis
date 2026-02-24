# Shell + Auth Design Scope Freeze (Faz 1 UI Start)

Tarih: 2026-02-24
Durum: V1 freeze candidate

## 1. Amac

Kod yazmadan once, Faz 1'de tasarlanacak ilk ekranlarin kapsam ve token subset'ini netlestirmek.

Bu dokuman sayesinde:
- tasarim dagilmaz
- once temel component dili oturur
- premium his erken asamada yakalanir

## 2. Faz 1 Tasarim Kapsami (ilk ekranlar)

Bu turda sadece asagidaki ekranlar tasarlanir:

1. `Landing Header + Hero shell` (detay landing sonradan)
2. `Login Screen`
3. `Mode Selector`
4. `Company Selector`
5. `Panel App Shell`
   - sidebar / nav rail
   - top bar
   - page header area
   - content canvas
6. `Dashboard Shell (Company)`
7. `Dashboard Shell (Individual Driver)`

Kapsam disi (sonra):
- full landing sections
- route editor detay
- live ops map detay
- members/vehicles tablo detaylari

## 3. Faz 1 Token Subset (44'ten secilen minimum set)

Faz 1'de kod ve tasarim sadece bu subset'e dayanacak.

### 3.1 Typography

- `font.ui`
- `font.display`
- `fw.medium`, `fw.semibold`, `fw.bold`
- `type.pageTitle`
- `type.sectionTitle`
- `type.cardTitle`
- `type.body`
- `type.bodyStrong`
- `type.caption`
- `type.displayHero`
- `type.navLabel`

### 3.2 Spacing

- `space.1`, `space.2`, `space.3`, `space.4`, `space.5`, `space.6`, `space.8`, `space.10`, `space.12`

### 3.3 Radius

- `radius.md`
- `radius.lg`
- `radius.xl`
- `radius.pill`

### 3.4 Shadows

- `shadow.sm`
- `shadow.md`
- `shadow.focus`

### 3.5 Core Colors

Brand:
- `color.brand.500`
- `color.brand.600`
- `color.brand.050`

Surface / text:
- `color.bg.canvas`
- `color.bg.surface`
- `color.bg.subtle`
- `color.border.subtle`
- `color.border.default`
- `color.text.primary`
- `color.text.secondary`
- `color.text.tertiary`

Semantic (Faz 1 min):
- `color.success.500`
- `color.warning.500`
- `color.danger.500` (44'te tanimli deger)

## 4. Faz 1 Base Components (tasarim + sonra kod)

Ilk tasarlanacak base components:
- Button (primary / secondary / ghost)
- Input (default / focus / error / disabled)
- Password field
- Card
- Badge / status chip
- Topbar action button
- Sidebar item
- Empty state card
- Loading skeleton block

Kural:
- Bu componentler oturmadan ekran cesitlendirmeye gecme.

## 5. Login / Auth Ekrani Kalite Kurali

Login ekrani "default template" gibi gorunmeyecek.

Olmasi gereken:
- premium hero-side veya premium panel-side kompozisyon
- temiz tipografi
- net CTA hiyerarsisi
- Google login butonu marka kuralina uygun, ama sayfa geri kalanina entegre
- form validasyon durumlari sade

Olmamasi gereken:
- standart bootstrap login card hissi
- asiri gradient / neon / cam efekt spam

## 6. Panel Shell Kalite Kurali

Shell, tum urunun karakterini belirler.

Bu nedenle:
- nav spacing ve active state dikkatli tasarlanir
- topbar kalabalik olmaz
- page header + action zone standartlastirilir
- canvas genislik davranisi sabit kurala baglanir

## 7. Responsive Scope (Faz 1)

Faz 1'de su varyantlar cizilir:
- Desktop (1440)
- Laptop (1280)
- Tablet/compact panel shell (1024)
- Mobile sadece login + mode selector (minimum)

Not:
- Panelin tam mobile deneyimi Faz 2/Faz 3'te detaylanir.

## 8. Review Checklist (Faz 1)

Her Faz 1 ekrani icin:
- token subset disi deger var mi?
- hiyerarsi net mi?
- 1 ana CTA belli mi?
- spacing tutarli mi?
- empty/loading state dusunuldu mu?
- auth hata durumlari dusunuldu mu?

## 9. Sonraki Adim (Faz 1 tasarim tamamlaninca)

Sonraki freeze:
- table pattern
- form section pattern
- drawer pattern
- route/stop editor shell
- live ops split-pane shell

## 10. Referanslar

- `30_information_architecture_and_navigation.md`
- `34_panel_user_flows_and_wireflow_plan.md`
- `37_visual_design_direction_apple_like_modern.md`
- `40_panel_visual_patterns_and_interaction_spec.md`
- `44_design_tokens_v1_numeric_table.md`
- `45_figma_design_handoff_structure_plan.md`

