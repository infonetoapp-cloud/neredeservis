# Panel User Flows + Wireflow Plan (MVP -> Faz 3)

Tarih: 2026-02-24
Durum: V0 / plan

## 1. Amac

Panelde hangi kullanici hangi akista nasil ilerleyecek sorusunu ekrana dokmeden netlestirmek.

Bu dokuman:
- user flow
- wireflow dugumleri
- state/hata dallari
icerir.

## 2. Aktorler

- `individual_driver`
- `company_owner`
- `company_admin`
- `company_dispatcher`
- `company_viewer`

## 3. Global Baslangic Akisi (tum kullanicilar)

### Flow G-01: Login -> Session Bootstrap

1. `/login`
2. Email/Password veya Google login
3. auth success
4. session bootstrap
5. role/membership resolution
6. mode selection veya direct redirect

Dallar:
- login fail -> error state
- no role/profile -> onboarding placeholder
- no company membership but driver profile -> individual mode
- multiple companies -> company selector

Wireflow dugumleri:
- Login Screen
- Loading Overlay
- Session Bootstrap Gate
- Mode Selector
- Company Selector
- Forbidden/No Access

## 4. Bireysel Sofor Ana Akislari

### Flow D-01: Individual Driver Daily Entry

1. Login
2. Individual mode
3. `/d/dashboard`
4. bugun aktif rota/sefer durumu
5. detay ekranina gecis

Wireflow:
- Individual Dashboard
- Routes List
- Route Detail
- Trips List

### Flow D-02: Route Create/Edit (MVP)

1. `/d/routes`
2. "Yeni Rota"
3. route form (ad, saat, baslangic/bitis)
4. stop editor
5. map preview (opsiyonel panel)
6. save
7. success -> route detail

Hata/edge:
- validation errors
- authz deny (beklenmez ama handle edilir)
- network fail -> retry state

Wireflow dugumleri:
- Route List
- Route Form Shell
- Stop Editor Panel
- Map Preview Panel
- Save Confirmation/Toast

### Flow D-03: Active Trip View

1. `/d/trips` veya dashboard CTA
2. active trip detail
3. canli durum / son konum
4. seferi bitir (izin varsa)

## 5. Firma Owner/Admin Ana Akislari

### Flow C-01: Company Mode Entry

1. Login
2. Mode selector -> Company
3. Company selector (tek firma ise skip)
4. `/c/[companyId]/dashboard`

Wireflow:
- Mode Selector
- Company Selector
- Company Dashboard

### Flow C-02: Member Management (owner/admin)

1. `/c/[companyId]/members`
2. uye listesi
3. "Davet et"
4. invite form (email, role)
5. save
6. pending invite state

Ek akış:
- rol degistirme
- suspend/remove

Dallar:
- self role change deny
- owner role escalation restrictions

### Flow C-03: Driver + Vehicle Setup

1. `/c/[companyId]/drivers`
2. driver add/bagla
3. driver detail
4. `/vehicles`
5. vehicle create
6. assign vehicle -> driver

## 6. Dispatcher Ana Akislari (MVP/Faz 3)

### Flow O-01: Daily Operations Dashboard

1. `/c/[companyId]/dashboard`
2. aktif sefer ozet kartlari
3. gecikme/uyari chipleri (faz 4+)
4. "Canli Operasyon" CTA

### Flow O-02: Live Ops Map (kritik)

1. `/c/[companyId]/live-ops`
2. route/driver filters
3. active trips list + map
4. trip detail drawer
5. driver/route detail navigation

State'ler:
- no active trips
- stale location
- permission denied
- map load fallback

Wireflow dugumleri:
- Live Ops Shell
- Left List Pane
- Map Canvas
- Trip Detail Drawer
- Filter Bar

### Flow O-03: Company Route Operations

1. `/c/[companyId]/routes`
2. route create/edit
3. stop editor
4. authorized driver assign
5. route permission grant (faz 3)
6. save + audit

## 7. Viewer Akislari

### Flow V-01: Read-Only Monitoring

1. `/dashboard`
2. `/routes`
3. `/live-ops`
4. detail read-only

Kural:
- Mutasyon CTA'lari ya gizli ya disabled + tooltip

## 8. Cross-Cutting UX State Plan

Tum kritik ekranlarda standart state seti:
- loading
- empty
- error
- forbidden
- offline/degraded (opsiyonel MVP)

Not:
- Bu standard, spagetti UI branching'i azaltir.

## 9. Faz 1 Wireflow Scope (ilk cizilecekler)

Faz 1 icin yeterli wireflow seti:
- G-01 Login + Session Bootstrap
- C-01 Company Mode Entry (placeholder)
- D-01 Individual Dashboard skeleton
- Panel shell nav states

## 10. Faz 2/3 Wireflow Scope

Faz 2:
- D-02 Route Create/Edit
- D-03 Active Trip View

Faz 3:
- C-02 Member Management
- C-03 Driver + Vehicle Setup
- O-02 Live Ops Map

## 11. Tasarim Yonune Baglanti

Bu flowlarin gorsel dili:
- modern/premium
- hafif ama operasyonel
- "muhasebe ERP" hissinden uzak

Detaylar:
- `37_visual_design_direction_apple_like_modern.md`
