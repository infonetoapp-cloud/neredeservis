# Design System V0 (Tokens + Typography + Brand Direction)

Tarih: 2026-02-24
Durum: V0 / Plan (kod degil)

## 1. Amaç

Tasarimi "guzel olsun" seviyesinden cikarip:
- tutarli
- premium
- uygulanabilir
- ekipce surdurulebilir
hale getirmek.

Bu dokuman:
- tipografi
- renk tokenlari
- spacing/radius/shadow sistemi
- iconografi
- motion prensipleri
- brand hissi
icin temel verir.

## 2. Tasarim Kimligi (Net Hedef)

Hedef hissiyat:
- modern
- premium
- sade
- guven veren
- hizli operasyon odakli

Kaçinilacak hissiyat:
- ERP/muhasebe paneli
- kalabalik dashboard
- rastgele renkli kutular
- "template SaaS" gorunumu

## 3. Tipografi Stratejisi (Apple-like hissiyat, birebir kopya degil)

### 3.1 Ana kural

Apple tarzi hissiyat icin:
- nötr, temiz, iyi spacing alan bir grotesk/sans
- net hiyerarsi
- az ama etkili font ailesi

Apple SF Pro birebir kullanimi lisans/pratik sebeplerle hedeflenmez.

### 3.2 Onerilen font stratejisi (MVP)

Panel (primary):
- `Manrope` (variable) veya benzeri modern grotesk

Landing (display/headline):
- `Space Grotesk` (karakter katmak icin) + body'de `Manrope`

Kural:
- Panelde okunabilirlik > karakter
- Landing'de marka karakteri > ama okunabilirlik bozulmayacak

### 3.3 Typography scale (taslak)

Panel:
- Display: `32-40`
- Page title: `24-28`
- Section title: `18-20`
- Body: `14-16`
- Meta/caption: `12-13`

Kural:
- Table satirlari ve operasyonel degerler icin taranabilirlik odakli line-height

### 3.4 Font usage rules

- Tek ekranda 2 fonttan fazla yok
- Harita ekranlarinda daha sakin tipografi
- Numeric data (ETA, sayilar, durumlar) icin tutarli digit spacing hissi

## 4. Color System (Token-based)

### 4.1 Color philosophy

Renk sistemi:
- neutral-first
- tek güçlü brand accent
- semantik status renkleri
- gereksiz doygunluk yok

### 4.2 Token gruplari (taslak)

Brand:
- `brand.primary`
- `brand.primary.hover`
- `brand.primary.soft`

Neutrals:
- `bg.canvas`
- `bg.surface`
- `bg.surfaceElevated`
- `border.subtle`
- `border.strong`
- `text.primary`
- `text.secondary`
- `text.tertiary`

Semantic:
- `success.*`
- `warning.*`
- `danger.*`
- `info.*`

Map/live ops accent:
- `ops.live`
- `ops.stale`
- `ops.route`

### 4.3 Renk kullanimi kurallari

- Status rengi = sadece anlam tasir, dekor degil
- Dashboard kartlari gökkuşağına donmez
- Ayni anlami farkli ekranlarda farkli renkle gosterme

## 5. Spacing System (8px grid + micro steps)

Oneri:
- ana grid `8px`
- ara spacingler icin `4px` adimlar

Token mantigi:
- `space.1 = 4`
- `space.2 = 8`
- `space.3 = 12`
- `space.4 = 16`
- `space.5 = 20`
- `space.6 = 24`
- `space.8 = 32`
- `space.10 = 40`
- `space.12 = 48`

Kural:
- Ekranlarda spacing rastgele degil token ile verilir

## 6. Radius + Shadow + Surface Sistemi

### 6.1 Radius (taslak)

- `r.sm` = 10-12
- `r.md` = 14-16
- `r.lg` = 20-24
- `r.xl` = 28-32

Kural:
- Her component kendi radius uydurmaz

### 6.2 Shadow/Elevation

Apple-like his icin:
- yumusak, dusuk kontrastli shadow
- az katmanli elevation

Kural:
- Shadow + border + blur ayni anda abartili olmayacak

### 6.3 Surface hierarchy

Katmanlar:
- canvas
- primary surface
- elevated card
- overlay panel / drawer
- modal

## 7. Iconografi ve Gorsel Dil

### 7.1 Icons

Yön:
- ince ama okunakli çizgi iconlar
- operasyonel durumlarda net semantik ikonlar

Kural:
- bir ekranda farklı icon style mixleme yok

### 7.2 Illustrations / graphics

Landing:
- premium, yalın, geometrik
- gerçekçi stock karmaşası yok

Panel:
- minimum illustration, daha çok bilgi tasarımı

## 8. Motion / Interaction Tokens

Hedef:
- akıcı ama dikkat dağıtmayan etkileşim

Prensipler:
- kısa ve tutarlı geçişler
- loading feedback belirgin
- drawer/panel transition yumuşak
- reduced motion desteği

Token yaklaşımı (taslak):
- `duration.fast`
- `duration.normal`
- `easing.standard`
- `easing.emphasized`

## 9. Data Visualization / KPI Kart Kurallari

Panel KPI'ları:
- büyük rakam + kısa açıklama + trend
- tek kartta 1 ana sinyal
- gereksiz chart spam yok

Tablo ekranlarında:
- rakam vurgusu net
- operasyon durumları semantik chip ile

## 10. Map (Live Ops) Visual Kurallari

Harita panelin vitrini oldugu icin:
- map style sakin ve premium olacak
- marker/route renkleri panel tokenlariyla tutarlı olacak
- stale/live durumları net ayrışacak
- map ustu UI katmanlari okunakli olacak

Kural:
- Harita, UI'yı boğmaz
- UI, haritayı kapatmaz

## 11. Dark Mode Karari (MVP)

MVP karar:
- Light-first
- Dark mode zorunlu degil

Not:
- Tasarım sistemi dark mode'a acik tasarlanacak (token mantigi ile)

## 12. Faz 1 Tasarim Token Scope

Faz 1'de kesinleşecek:
- typography scale
- color tokens V1
- spacing/radius/shadow tokens V1
- nav/header/card/button/input temel stilleri

Faz 2/3'te genişleyecek:
- tables
- maps
- dashboards
- alerts/toasts

## 13. Çıktı Formatı (kodlama öncesi)

Bu dokumanin uygulama ciktisi:
- tasarim token listesi
- component style spec
- UI review checklist

Kod tarafinda:
- CSS variables / design tokens olarak yansitilacak
