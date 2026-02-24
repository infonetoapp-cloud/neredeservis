# Information Architecture + Navigation Plan (Landing + Panel)

Tarih: 2026-02-24
Durum: V0 / Faz 0 detayi

## 1. Amac

Web sistemin sayfa yapisini ve navigasyon omurgasini bastan netlestirmek.

Hedef:
- Landing ve panel karismasin
- Rol bazli navigasyon tasarimi net olsun
- Sonradan ekranlar "rastgele" eklenmesin
- Premium/modern UX yonu IA seviyesinde desteklensin (kalabalik muhasebe paneli hissi olmasin)

## 2. Domain Ayrimi

Public site (landing):
- `neredeservis.app`

Panel:
- `app.neredeservis.app`

Kural:
- Public marketing route'lari panel app icine tasinmaz (MVP'de ayrik deploy)
- Panel auth route'lari landing app'e gomulmez (gerekirse landing sadece CTA -> panel login)

## 3. Landing IA (MVP -> Faz 8)

### Faz 1 (skeleton)
- `/` Home (basit tanitim + CTA)
- `/giris` -> panel login'e yonlendirme veya bilgi sayfasi
- `/iletisim` (placeholder olabilir)
- `/gizlilik` (placeholder/temel)
- `/kvkk` (placeholder/temel)

### Faz 8 (final marketing)
- `/` conversion-optimized home
- `/cozumler/firma`
- `/cozumler/bireysel-sofor`
- `/ozellikler`
- `/fiyatlandirma` (billing fazindan sonra)
- `/sss`
- `/iletisim`
- `/gizlilik`
- `/kvkk`
- `/kullanim-kosullari`

## 4. Panel IA (MVP)

### 4.1 Public/Auth Routes

- `/login`
- `/register` (karar verilirse)
- `/forgot-password`
- `/logout` (route veya action)
- `/auth/callback` (gerekirse provider callback)

### 4.2 Post-login Bootstrap Routes

- `/select-mode` (individual vs company)
- `/select-company` (birden cok firma uyeligi varsa)
- `/forbidden`

### 4.3 Individual Driver Mode Routes

Prefix onerisi:
- `/d/*`

Ornekler:
- `/d/dashboard`
- `/d/routes`
- `/d/routes/[routeId]`
- `/d/routes/[routeId]/stops`
- `/d/trips`
- `/d/trips/[tripId]`
- `/d/vehicles`
- `/d/profile`

### 4.4 Company Panel Mode Routes

Prefix onerisi:
- `/c/[companyId]/*`

Ornekler:
- `/c/[companyId]/dashboard`
- `/c/[companyId]/drivers`
- `/c/[companyId]/drivers/[driverId]`
- `/c/[companyId]/vehicles`
- `/c/[companyId]/vehicles/[vehicleId]`
- `/c/[companyId]/routes`
- `/c/[companyId]/routes/[routeId]`
- `/c/[companyId]/routes/[routeId]/stops`
- `/c/[companyId]/live-ops`
- `/c/[companyId]/members`
- `/c/[companyId]/audit`
- `/c/[companyId]/settings`

Not:
- Route path'lerinde `companyId` acik tutmak tenant context hata riskini azaltir.

## 5. Role-Based Navigation (Company Mode)

### owner/admin
- Dashboard
- Soforler
- Araclar
- Rotalar
- Canli Operasyon
- Uyeler
- Audit
- Ayarlar

### dispatcher
- Dashboard
- Soforler (read + operational actions)
- Araclar
- Rotalar
- Canli Operasyon
- (Uyeler yok / Audit kisitli)

### viewer
- Dashboard
- Soforler (read-only)
- Araclar (read-only)
- Rotalar (read-only)
- Canli Operasyon (read-only)
- (Uyeler yok)

## 6. Navigation UX Kurallari

1. Global nav role'a gore sadeleşir
2. Tenant context her sayfada gorunur (firma adi + env badge)
3. Bireysel mod / firma modu arasi gecis acik olmalı
4. Yetkisiz route'larda 403 UX temiz olmali

## 7. Breadcrumb / Context Kurali

Panelde derin sayfalarda breadcrumb kullan:
- Ozellikle route/stop/driver detay ekranlarinda

Neden:
- operasyon kullanicisi kaybolmaz
- support ekran goruntusunden context hizli anlasilir

## 8. Faz 1'de Bilerek Placeholder Kalacaklar

- audit detay ekranı
- advanced reporting nav
- billing nav
- internal admin nav

## 9. Faz 2/3 IA Revizyon Kriteri

Asagidakiler olursa IA revizyonu yap:
- menude 8+ ana item ve karmasa
- role bazli nav farklari cok buyurse
- canli operasyon ekrani altinda cok modul birikirse
