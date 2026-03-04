# Strateji Raporu Entegrasyonu — Plan 2.0 Özeti

## 📋 Yapılan Değişiklikler

### 1️⃣ Menü Cerrahisi (Breaking Changes)

**Silinecek:**
- ❌ `/c/[companyId]/vehicles` (bağımsız sayfa)
- ❌ `/c/[companyId]/drivers` (bağımsız sayfa)
- ❌ `/c/[companyId]/reports` (devasa bloatware)

**Yenilenen:**
- ✅ `/c/[companyId]/live-ops` → **MEGA PAGE**
  - Master panel: Araçlar & Şoförler toggle
  - Detail panel: Seçili item'ın harita + info
  - Modes: List / Grid / Fullscreen Map / Timeline
  - Harita: Bilgi Lazanyası (5 layer) + Dynamic Clustering + Smart Selection Popups

- ✅ `/c/[companyId]/routes` → Yeni sekme ekleme:
  - Tab 1: Rota Listesi (Plan 1.x)
  - **Tab 2: Sapma Analizi (YENİ!)** — Planlanan vs Gerçekleşen overlay harita + tablo
  - Tab 3: Optimizasyon (VRP motor)

- ✅ Export Hub (Minimize Raporlar):
  - Dışa Aktarma merkezi (Excel, PDF, resmi belgeler)
  - Ayrı detay panellerine Embedded Analytics (sparkline, mini-chart)

- ✅ **YENİ SAYFA**: `/c/[companyId]/driver-documents`
  - 📄 Şoför Belgeler Yönetimi (Ehliyet, SRC, psikoteknik, sağlık raporu)
  - MVP operasyon zorunluluğu: geçersiz belgeli şoför rota atanamaz

---

### 2️⃣ Harita Mimarisi (Bilgi Lazanyası)

```
Layer 5: Kontrol Arayüzü (zoom, layer toggle, filter)
Layer 4: İnteraktif Objeler (araç pinleri, durak markers)
Layer 3: Veri Katmanları (rota polylines, geofence poligonlar)
Layer 2: Alt Veri (yol ağları, binalar)
Layer 1: Zemin Haritası (Mapbox/Google özel stil, POI kapalı)
```

**Ekler:**
- 🎯 **Dinamik Kümeleme**: Aynı lokasyonda 5+ araç → Küme pini (zoom bağımlı açılma)
- 🎯 **Akıllı Seçim**: Çakışan araçlar için pop-up seçim menüsü
- 🎯 **Nabız Animations**: Araç pinleri pulsating (yeşil/sarı/kırmızı veri tazeliğine göre)
- 🎯 **Geofence Visualization**: Sanal sınırlar haritada (kesintili çizgi, tıklanabilir)

---

### 3️⃣ Geofencing Rule Engine (Otomatik Puantaj)

**KURAL 1: Otomatik Arrival/Departure Kaydı**
```
IF [Araç] enters [Durak_Geofence]
THEN → timestamp kaydet, durak_giriş event
       Şoför: [📍 Durağa Geldim] butonu hazır

IF [Araç] exits [Durak_Geofence]
THEN → dwell_time hesapla, puantaj satırı ekle
       QR scan / yazılı teyit kontrol et
       Yolcu sayısı kayıt et
```

**KURAL 2: Gecikme Uyarısı (Deterministic)**
```
IF [PlannedStartTime] = 07:00
   AND current_time = 07:45
   AND [Vehicle] still in depot_geofence
THEN → Dispeçer: RED BANNER "Araç halen depoda!"
       Alternatif araç listesi sun
       15dk sonra ceza göster
```

**KURAL 3: Bölge İhlali (Security)**
```
IF [Vehicle] exits [Approved_Region]
THEN → RED PIN on map, "Hırsızlık uyarısı"
       Dispeçer push, müşteri SMS, şoför uyarısı
```

---

### 4️⃣ Komut Paleti (Command Palette) — Sinir Merkezi

**Mimarı**: `Ctrl+K` → Intent-driven action engine

```
Arama Sonuçları:
  > Yeni Rota → Create Route wizard
  > Gecikenler → Filter + harita zoom
  > Belgeleri Bitiyor → Şoför Belgeler sayfası + filtre
  > Ahmet Yılmaz → Profil aç
  > 34 ABC 01 → Araç detay + GPS trace
  > Koyu Tema → Dark mode toggle
  > Rotaları Optimize → VRP wizard
  > Muayene Yaklaşan → Araçlar filter + vurgula
```

**Tech**: `cmdk` library + intent regex patterns + localStorage action history

---

### 5️⃣ Şoför Belgeler Yönetimi (MVP Kritik)

**Master-Detail Şon:** Expire tarihi yakın belgeler ilk sırada

**Belge Türleri:** Ehliyet, SRC, Psikoteknik, Sağlık Raporu

**Backend Callables:**
- `uploadDriverDocument(driverId, docType, file)` → Storage + Firestore
- `getDriverExpirations(companyId)` → Sıralı expiry listesi
- `sendRenewalReminder(driverId)` → Email/SMS
- `getDriverAvailability(driverId)` → `{ canAssignToRoute: boolean }`

**Faydası**: "Belgesi geçmiş şoför rota atanamaz" → trafik cezası riski sıfır

---

### 6️⃣ Sürücü Uygulaması (Flutter/RN) — Immutable Data

**Ekran 1: Rota Başı**
- 🟢 ROTAYI BAŞLAT (1 tık)
- Araç denetimi checkboxları (araç temiz, yakıt, fren)

**Ekran 2: Durak Başı**
- 🔷 QR okut (8/8 yolcu scan)
- 🟢 DURAKTAN AYRIL

**Veri Flow:**
```
Rota Başlat → Event: route_start → Durak seç
Durak Giriş → Geofence event → QR scan loop
Durak Çıkış → Dwell hesapla → Puantaj satırı oluştur
```

**API Endpoints:**
```
POST /startDriverSession → sessionId + stops
POST /enterGeofence → dwell_start
POST /exitGeofence → dwell calc + puantaj
POST /scanPassengerQR → scanned_count update
```

---

### 7️⃣ Dark Mode Mimarisi

**Setup:**
```typescript
// Tailwind config
darkMode: 'class' // <html class="dark">

// Theme Context
useTheme() → isDark state + toggle()
localStorage + system preference fallback
```

**Usage:**
```
bg-white dark:bg-slate-950
text-slate-900 dark:text-white
border-slate-200 dark:border-slate-800
```

**Komut Paleti**: `> Koyu Tema` → Instant toggle, zero flash

---

## 🎯 RAPORDAN BAŞKA ALINABİLECEKLER (Budgets/Phase 2+)

### 🔔 Zaten Entegre Edilen
✅ Sakin Tasarım (Calm Design)
✅ Harita Bilgi Lazanyası + Kümeleme
✅ Geofencing Deterministic Rules
✅ Şoför Belgeler Expiry Takibi
✅ Komut Paleti Intent Engine
✅ Dark Mode Mimarisi
✅ Mobil QR Entegrasyonu
✅ B2B Satış Psikolojisi (ROI göstergesi)

### 🚀 Gelecek Versiyonlara (Budget/Zaman)

| Özellik | MVP Mi? | Tavsiyesi |
|---------|---------|-----------|
| **Şoför Belgeler** | MVP | Ehliyet, SRC, psikoteknik, sağlık raporu expiry takibi |
| **Yapı Zeka Yerine Sistem Önerileri** | Hayır | "Rota birleştir" (VRP-bazlı), ceza uyarıları |
| **KPI Dashboard Evolution** | Hayır | Real-time vs geçen hafta karşılaştırma |
| **Sürücü Gamification** | Hayır | Puan sistemi, leaderboard, "En İyi" ödülleri |
| **B2B Müşteri Portali** | Hayır | Read-only paneli (müşteri firmaya) |
| **Hakediş Otomasyonu** | Hayır (Phase 2) | 4-adım full sistem, 4734 KIK, PDF/Excel |
| **ML Tahminleme** | Hayır | Gecikme öngörü, araç arızaları |
| **CSV/Webhook Entegrasyonu** | Hayır | Dış sistemlerle data sync |
| **Multi-tenant Hierarchy** | Hayır | Holding + yan kuruluşlar |

---

## ✅ Uygulamadan Önce CheckList

### Mimarı Onayları
- [ ] Live Ops Master-Detail split mimarisi uygun mu?
- [ ] Harita Bilgi Lazanyası kompleksliği makul mı?
- [ ] Geofencing rule engine logikleri doğru mu?
- [ ] Komut Paleti intent pattern'leri yeterli mi?
- [ ] Şoför Belgeler expiry mantığı ve renk kodları doğru mu?
- [ ] Dark mode toggle UX'i smooth mi?

### Backend Hazırlığı
- [ ] Hakediş callables (Phase 2'ye taşındı, MVP kapsam dışı)
- [ ] Şoför Belgeler: Firebase Storage + Firestore expiry schema
- [ ] `uploadDriverDocument`, `getDriverExpirations`, `sendRenewalReminder`
- [ ] Mapbox API keys (harita styling)
- [ ] "4734 KIK" fiyat farkı formülü (Phase 2 referansı, MVP kapsam dışı)

### Frontend Hazırlığı
- [ ] Tailwind config: dark mode + accent color utilities
- [ ] npm packages yükleme (@dnd-kit, cmdk, mapbox-gl, recharts)
- [ ] Component library setup (PageHeader, KpiCard, Toast, SlideOver vb)
- [ ] Responsive breakpoints test (mobile, tablet, desktop)

### QA Plan
- [ ] E2E test: Geofence entry → araç/şoför durum güncelleniyor mu?
- [ ] Komut Paleti: Intent pattern'leri (10+ command)
- [ ] Dark mode: Tüm sayfalarda flashing yok
- [ ] Mobile QR: Actual device'de test (camera, HTTP)
- [ ] Şoför Belgeler: Expiry renk kodları (30gün sarı, geçmiş kırmızı) doğru çalışıyor mu?
- [ ] Rota ataması: Geçersiz belgeli şoför bloke ediliyor mu?

---

## 📊 Plan 2.0 vs Plan 1.x Side-by-Side

| Boyut | 1.x | 2.0 | Değeri |
|-------|-----|-----|--------|
| **Sayfa Sayısı** | 8 bağımsız | 7 integrated | -1 sayfa, +cohesion |
| **Harita** | Header + mini | Full lazanya | Real-time nested data |
| **Raporlama** | Monolitik tab | Embedded everywhere | Agile insights |
| **Otomasyonu** | Hiç | Geofence + Şoför Belge Takibi | Operasyon güvenliği |
| **Komut** | None | Intent engine | 1 saniy context switch |
| **Theme** | Light only | Light + Dark | Modern UX |
| **Mobile** | Web view | Native QR | Immutable field data |
| **Belgeler** | Manual | Expiry takip + bloke | Trafik riski sıfır |

---

## 📝 Sonuç

**Plan 2.0**, Strateji Raporunun tamamını entegre eder. Kodlamaya başlamadan **bu dokümantasyonı** section-by-section review edin.

**Kritik Noktalar (Go/No-Go):**
1. Live Ops Master-Detail split uygun mu?
2. Geofencing kuralları deterministic ve testlenebilir mi?
3. Şoför Belgeler expiry kuralı: geçersiz belge = rota atanamıyor doğru mu?
4. Mapbox + geofence poligon rendering performance okey mi?

**Başlama tarihi**: Plan 2.0 final review ~ 2-3 gün
**Tahmini kodlama**: 6-8 hafta (full-stack, mobile dahil)
**Launch hedefi**: 2026 Nisan sonları

---

**Bu dosya = Strateji Raporu + Plan 1.x + Plan 2.0'ın tek kaynağı.**
