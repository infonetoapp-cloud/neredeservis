  # NeredeServis Şirket Paneli — 2026 Tasarım & Uygulama Planı
## B2B SaaS Standartlarına %100 Uyumu ile İyileştirilmiş Versiyon

> **Tarih**: 3 Mart 2026  
> **Versiyon**: 2.0 (Strateji Raporu Entegrasyonu)  
> **Hedef**: Mevcut planı 2026 standartlarındaki "Sakin Tasarım" (Calm Design), "Bilgi Lazanyası" harita mimarisi, Geofencing otomasyonu ve Şoför Belgeler Yönetimi ile tamamlamak. Menü cerrahisi yaparak VRP algoritmaları ve Komut Paleti sinir merkezini hayata geçirmek.

---

## 🎯 PLAN 1.x'ten 2.0'a Geçişte Radikal Değişiklikler (Breaking Changes)

### ❌ Silinecek / Çöpe Atılacak Sayfalar ve Moduller

| Sayfa | Sebep | Tesisleme | 
|-------|-------|-----------|
| `/c/[companyId]/vehicles` (Bağımsız) | Araç ve şoför birbiriyle bütünleşiktir, ayrı sayfa hatalıdır | Live Ops Master-Detail'e merge |
| `/c/[companyId]/drivers` (Bağımsız) | Aynı sebep | Live Ops Master-Detail'e merge |
| `/c/[companyId]/reports` (Devasa sekme) | Bloatware; her sayfadas analytics olacak (embedded) | "Export Hub" şeklinde minimize edilecek |
| Mevcut "Raporlar" tabı (sıradan statik raporlar) | Modern panellerde raporlama bileşenleştirilir, merkezi değil | Detay slide-over'lara sparkline/mini-chart olarak dağıtılacak |

### ✅ Yeniden Kurgulanan Sidebar Mimarisi

```
┌──────────────────────────────────────┐
│ 🔴 NeredeServis                      │
│ Operasyon Paneli — PROD              │
├──────────────────────────────────────┤
│ ┄ OPERASYON ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│ 📊 Genel Bakış      [indigo]        │
│ 🎮 Canlı Operasyon  [emerald]       │
│    ├─ Araçlar      (master list)    │
│    ├─ Şoförler     (master list)    │
│    └─ Harita       (detail pane)    │
│ 🛣️ Rotalar         [violet]        │
│    ├─ Planlanan    (list)           │
│    ├─ Sapma Analiiz (planed vs act) │
│    └─ Optimizasyon (VRP motor)      │
│                                      │
│ ┄ YÖNETİM ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│ 👥 Üyeler          [rose]           │
│ � Şoför Belgeler  [orange]  ★★★  │
│ ⚙️ Ayarlar         [slate]         │
│ 📤 Dışa Aktarma    [teal] (Export) │
│                                      │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│ 🏢 155 Servis                        │
│ 👨 Sahip: Sinan Y.                  │
└──────────────────────────────────────┘
```

**Değişiklik Açıklaması:**
- **Live Ops** (Canlı Operasyon): Araçlar + Şoförler + Harita bir sayfada, böl(split) görünüm
- Raporçılık: Her sayfaya embedded analytics (sparklines, mini-charts) 
- **Şoför Belgeler**: YENİ - Ehliyet, SRC, psikoteknik, sağlık raporu yönetimi + takvim
- **Dışa Aktarma**: Merkezi Export Hub (Excel, PDF, raporlar)
- **Rotalar** alt sekmeler: Sapma Analizi (gerçekleşen vs planlanan overlay)

---

## 0. MEVÜT KOD DURUMU (Web Panel Baseline)

> **Önemli**: Kodlamaya başlamadan önce ne var ne yok nettiği

### Var Olan Sayfalar (`website/apps/web/src/app/(dashboard)/c/[companyId]/`)

| Sayfa | Route | Durum | Plan 2.0'daki Kaderi |
|-------|-------|-------|----------------------|
| Genel Bakış | `/dashboard` | ✅ Var | UI tam yenilenecek (KPI cards, sparkline) |
| Canlı Operasyon | `/live-ops` | ✅ Var (feed liste) | Master-Detail split'e dönüştürulecek |
| Rotalar | `/routes` | ✅ Var | Sapma Analizi tabı eklenecek |
| Şoförler | `/drivers` | ✅ Var (ayrı sayfa) | Live Ops'a merge edilecek (sayfa kapanmaz, redirect) |
| Araçlar | `/vehicles` | ✅ Var (ayrı sayfa) | Live Ops'a merge edilecek |
| Üyeler | `/members` | ✅ Var | UI iyileştirilecek |
| Ayarlar | `/settings` | ✅ Var | UI iyileştirilecek |
| **Şoför Belgeler** | `/driver-documents` | ❌ Yok | Sıfırdan yazılacak |
| **Export Hub** | `/export` | ❌ Yok | Sıfırdan yazılacak |

### Aynen Korunacak (Dokunulmayacak)
- Firebase hooks (`use-company-routes.ts`, `use-company-vehicles.ts`, `use-company-members.ts`, vb.)
- RBAC sistemi (`company-rbac.ts`, `CompanyMemberRole`)
- Firebase callable'lar (`company-callables.ts`, `company-route-callables.ts`, vb.)
- Auth sistemi (`CompanyMembershipProvider`, `CompanyContextGuard`)
- Dashboard layout shell (`DashboardShellSidebar`, `DashboardShellHeader`)

### Değişecek
- `CompanySidebarNav`: Renk sistemi (sayfa başlı accent) + menü öğeleri (Belgeler, Export Hub ekleme)
- `CompanyModuleShell`: Kaldırılacak ("checkpoints" kartı çıkıyor, yeni `PageHeader` component gelecek)
- Tüm sayfa içerikleri: Master-Detail split, KPI kartları, inline actions

### Mobil App Hakkında
- Flutter app `lib/` klasöründe var ve geliştiriliyor
- Şoför / yolcu / misafir rolleri `UserRole` enum'uyla kurulu
- Yolcu QR + katılım kodu: mobil app'ta `JoinScreen` + `join_qr_scanner_screen.dart` var
- **Web paneli şu an etkilemiyor** — web bittikten sonra mobile web API'sine uyarlanacak
- Şoför hesabı oluşturma (auto email+password): `/drivers` sayfasında zaten var

---

## 1. KESIN KURALLAR BÖLÜMÜ (Non-Negotiable Patterns)

---

## 1. Tasarım Felsefesi ve 2026 Paradigması

### Görsel Kimlik

| İlke | Açıklama |
|------|----------|
| **Ferah beyaz alan** | Kartlar arası minimum 24px boşluk, sayfa kenarlarından 32px padding. İçerik nefes alsın. |
| **Yumuşak köşeler** | Tüm kartlar `rounded-2xl` (16px), butonlar `rounded-xl` (12px). Keskin köşe yok. |
| **Hafif gölgeler** | `shadow-sm` + `border border-slate-200/60`. Ağır drop-shadow yok — düz ve temiz. |
| **Pastel accent renkler** | Her sayfa kendi pastel accent tonuyla tanınır. Koyu/cırtlak renk yok. |
| **Tipografi hiyerarşisi** | Başlık: `text-2xl font-bold text-slate-900`, Alt başlık: `text-sm text-slate-500`, İçerik: `text-sm text-slate-700`. |
| **İkon dili** | Lucide React ikonları, `16-20px`, `stroke-width: 1.5`. Minimal ve tutarlı. |

### Renk Paleti (Sayfa Bazlı Accent)

```
Genel Bakış   → indigo-500 / indigo-50 arka plan vurgusu
Canlı Takip   → emerald-500 / emerald-50
Rotalar       → violet-500 / violet-50
Araçlar       → amber-500 / amber-50
Şoförler      → sky-500 / sky-50
Üyeler        → rose-500 / rose-50
Ayarlar       → slate-500 / slate-50
Raporlar      → teal-500 / teal-50
```

Her sayfada:
- Sayfa başlığının solunda accent renkli dikey çizgi (`border-l-4 border-{accent}-500`)
- KPI kartlarında accent gradient dot (`bg-gradient-to-br from-{accent}-400 to-{accent}-600`)
- Aktif sidebar menüsünde accent arka plan (`bg-{accent}-50 text-{accent}-700`)
- Seçili list item'da accent sol bordür

### Interaksiyon Kuralları

| Kural | Uygulama |
|-------|----------|
| **Max 1 tık kuralı** | Her CRUD işlemi en fazla 1 tıkla başlasın. Inline edit, slide-over panel. |
| **Skeleton loading** | Her veri yüklemesinde shimmer animasyonlu placeholder. Spinner yok. |
| **Toast bildirimler** | Başarılı işlem = yeşil toast sağ üstten, hata = kırmızı toast. 3sn auto-dismiss. |
| **Inline confirm** | Silme = satır içi "Emin misiniz?" + Sil/İptal butonları. Modal dialog yok. |
| **Optimistic UI** | Kaydetme anında UI hemen güncellenir, arka planda API çağrılır. |
| **Empty state illüstrasyon** | Veri yoksa büyük pastel ikon + açıklayıcı metin + CTA butonu. |
| **Hover reveal** | İkincil aksiyonlar (düzenle, sil, kopyala) sadece hover'da görünür. |
| **Kbd shortcuts** | `Ctrl+K` komut paleti, `N` yeni oluştur, `Esc` panel kapat. |

### Layout Şablonu

Her sayfa şu yapıyı kullanır:

```
┌────────────────────────────────────────────────────┐
│  Sayfa Başlığı (accent border-l-4)    [+ Yeni]    │
│  Alt açıklama metni                                │
├────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │   ← Metrik   │
│  │ Card │ │ Card │ │ Card │ │ Card │     Kartları  │
│  └──────┘ └──────┘ └──────┘ └──────┘              │
├────────────────────────────────────────────────────┤
│  [🔍 Ara...] [Filter Chips] [View Toggle]          │
├──────────────────────┬─────────────────────────────┤
│                      │                             │
│  Liste / Grid        │  Detay Panel                │
│  (Master)            │  (Slide-over / Sağ panel)   │
│                      │                             │
│                      │                             │
└──────────────────────┴─────────────────────────────┘
```

---

## 1. KESIN KURALLAR VE YENİ MİMARİ (Strateji Raporu Entegrasyonu)

### 1.1 Menü Ve Sekme Cerrahisi (Radikal Yapılandırma Değişikliği)

#### KAYNAK: 2026 SaaS Strateji Raporu — "Sekme ve Modül Cerrahisi" Bölümü

**Kural 1: Araçlar ve Şoförler Bağımsız Sayfa DEĞİLDİR**

Mevcut planda `/vehicles` ve `/drivers` ayrı, 876 ve 849 satırlık monolitik componentler olarak planlanmıştır. **YANLIŞ.** 

Lojistik operasyonunda araç ve şoför, seperasyon (blood-brain barrier) gibi tamamen ayrı değildir. Birbirinden bağımsız yönetilmeleri operasyonel kaosu doğurur. "Canlı Operasyon" (Live Ops) sayfası, şoför-araç-rota entegrasyonunun kalbi olacak şekilde mimarlandırılacaktır.

**✅ Yeni Mimarı (Live Ops - Master-Detail Split):**

```
LIVE OPS Sayfası Mimarı:
┌────────────────────────────────────────┬──────────────────────────┐
│  Sol Panel: Master List (Swappable)     │ Sağ Panel: Detail Pane   │
│  ┌────────────────────────┐             │ ┌──────────────────────┐ │
│  │ Araçlar / Şoförler     │  ← Toggle  │ │ Seçilen Araç/Şoför   │ │
│  │ Harita / Zaman Çizelge │ (Toggle)   │ │ Detayları             │ │
│  │                        │            │ │                      │ │
│  │ [🚐 34 ABC 01]         │            │ │ 🚐 Mercedes Sprinter  │ │
│  │ Ahmet Y. - Aktif       │ ← tıkla   │ │ Şoför: Ahmet Y.      │ │
│  │ Okul Srv A             │            │ │ Rota: Okul Srv A     │ │
│  │ [⏱️ Geç: 5dk]          │            │ │ Hız: 42 km/h         │ │
│  │                        │            │ │ ETA: 08:15           │ │
│  │ [34 DEF 02]            │            │ │                      │ │
│  │ Mehmet K. - Aktif      │            │ │ ──── Mini Harita ── │ │
│  │ Personel B             │            │ │ [Polyline + Duraklar]│ │
│  │ [✓ Zamanında]          │            │ │                      │ │
│  │                        │            │ │ ──── Son 10 dk İzi ──│ │
│  │ [Ali V.]               │            │ │ [GPS Trace]          │ │
│  │ Beklemede              │            │ │                      │ │
│  │ [⚠️ Atanmamış]         │            │ │ [Sefer Durakları Tab]│ │
│  │                        │            │ │ [Belgeler Tab]       │ │
│  │ [+ Yeni Atama]         │            │ │ [Analitik Mini Tab]  │ │
│  └────────────────────────┘            │ └──────────────────────┘ │
└────────────────────────────────────────┴──────────────────────────┘
Harita Modü (Tüm Ekran):
        [🗺️ Harita Modu]  [◫ Bölünmüş 50/50]  [📋 Liste Modu]
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Fullscreen Mapbox (Unstyled)                   │
│                                                                  │
│   Dinamik Küme Pinleri [Nabız Atan Animasyon]                  │
│   Geofence Poligonları [İçi şeffaf, sınır kesintili]           │
│   Seçili Araç Track [Zümrüt ileri çizgi]                       │
│   Rota Poliglonları [Pastel renk, opacity 0.4]                │
│                                                                  │
│ [Zoom, Layers, Filter Kontrolleri - Floating UI]               │
│                                                                  │
│                  [Alt Drawer: Seri Listesi ↔] │
│                  Araç/Şoför Hızlı Bilgi kartları               │
└─────────────────────────────────────────────────────────────────┘
```

**Teknikler:**
- **Toggle Butonları**: `[👥 Şoförler] [🚐 Araçlar] [📍 Harita] [📅 Takvim]`
- Seçilen item hover'da highlight, tıklama detay panelini (sağ çekmece) aç
- Master list'te durum badge'ları: `🟢 Aktif`, `🟡 Beklemede`, `⭕ Atanmamış`, `⚠️ Gecikmeli`
- Detay paneli mini-harita + GPS trace atılı, duraklar markerli, altında sekmeli tab (Seferler, Belgeler, Analitik)

---

**Kural 2: "Raporlar" Sayfası Silinir, "Dışa Aktarma Merkezi" (Export Hub) Oluşturulur**

Mevcut planda `Reports` sayfasında sıfırdan devasa bir Sefer/Araç/Şoför rapor yığını planlı. **YANLIŞ YAKLAŞIM.**

2026 panellerinde "raporlama", merkezi bir sayfa değil; her varlığın detay panelirne **gömülü analitik** (embedded analytics) olarak yayılır. KPI kartları sparkline ile tepilir. Tablo satırlarında dunak mini bar chart... Her sayfada ilgili metrikler.

**✅ Yeni Mimarı (Dışa Aktarma Merkezi):**

```
Sayfa Adı: Dışa Aktarma (Export Hub)
Route: /c/[companyId]/export
Accent: teal-500

Struktur:
┌─────────────────────────────────────────────────────────────┐
│ 📤 Dışa Aktarma ve Resmi Belgeler                           │
│ Muhasebe, operasyon ve dönemsel raporları buradan indirin   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────────────────────────────────────────────────────┐  │
│ │  � B. ŞOFÖR BELGELERİ — Toplu Dışa Aktarma       │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │  Şoför: [Tümü] / [Belgesi Eksik] / [Bitiş Yakın]  │  │
│ │  ┌─────────────────────────────────────────────────┐ │  │
│ │  │ ✅ Ehliyet Listesi (Bitiş tarihleriyle)       │ │  │
│ │  │ ✅ SRC Belge Durumu (Geçerli / Süresi Dolan)  │ │  │
│ │  │ ✅ Psikoteknik Rapor Özeti                    │ │  │
│ │  │ ✅ Sağlık Raporu Özeti                        │ │  │
│ │  │ ✅ Toplu Belge Durumu (Excel özet)            │ │  │
│ │  └─────────────────────────────────────────────────┘ │  │
│ │  [📥 Tüm Belgeleri İndir (ZIP)]  [🔍 Önizleme]     │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐  │
│ │  📊 OPERASYON RAPORLARı (Analitik Çıktılar)        │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │  Tarih: [Bugün] / [Son 7 gün] / [Özel Aralık]     │  │
│ │  ┌─────────────────────────────────────────────────┐ │  │
│ │  │ 📋 Sefer Özeti (Tarih, Rota, Durum, ETA)     │ │  │
│ │  │ 🚐 Araç Kullanım (Km, Yakıt, Doluluk)        │ │  │
│ │  │ 👨 Şoför Performans (Zamanında %, Puan)      │ │  │
│ │  │ 🎯 KPI Özeti (Toplam Sefer, Ort Gecikme)     │ │  │
│ │  └─────────────────────────────────────────────────┘ │  │
│ │  [📥 CSV İndir]  [📊 Excel]  [🖨️ Yazdır]           │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐  │
│ │  🔧 AYAR - Özel Rapor Şablonları İnşa Et           │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │  [+ Yeni Şablon Oluştur]                           │  │
│ │  ┌─────────────────────────────────────────────────┐ │  │
│ │  │ Şablon Adı: "Muhasebe Özeti"                   │ │  │
│ │  │ Sütunları: Rota Adı, Araç, Durum, Başlang...  │ │  │
│ │  │ Format: Excel / CSV / JSON                      │ │  │
│ │  │ [Kaydet] [Sil]                                 │ │  │
│ │  └─────────────────────────────────────────────────┘ │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                              │
│ ⚡ Geçmiş İndirmeler: 5 Mart 14:32, 4 Mart 09:15...       │
└─────────────────────────────────────────────────────────────┘
```

**Not**: Şoför Belgeler yönetimi ayrı bir sayfadır (Bölüm 1.5'te). `/driver-documents`

---

**Kural 3: "Raporlamayı Saçaklandır" (Embedded Analytics)**

Şu andan itibaren, her sayfa:
- KPI kartlarında **sparkline** (7 günlük mini grafik)
- Tablo satırlarında **mini durum grafikleri** (doluluk %, gecikme badge)
- Detay slide-over'larda **sekmeli analytics** (Seferler, Son 7 Gün Performans, Belgeler Vade)

Örneğin, Araç detay paneli:

```
[Sefer Detayları]  [Analitik]  [Belgeler]  [Servis Geçmişi]
             ↓
┌────────────────────────────────────┐
│ Analitik Tab                       │
├────────────────────────────────────┤
│ Son 7 Gün Sefer Sayısı            │
│ ▁▂▂▃▄▅▃  (Mini Bar Chart, SVG)    │
│                                    │
│ Ortalama Doluluk %                │
│ ▬▬▬▬▮▬▬▬ 62%  (Progress Ring)      │
│                                    │
│ Zamanında Geliş Oranı              │
│ 🟢 89% (yeşil)  Şu ay: +12%       │
│                                    │
│ Tahmini Yakıt (Bu ay)              │
│ 342 L  →  ~5.470 TL                │
│ Trend: ↗ +5% (uyarı sarısı)       │
└────────────────────────────────────┘
```

---

### 1.2 Planlanan vs. Gerçekleşen (Sapma Analizi) — Rotalar Sayfasında

**KAYNAK**: 2026 Strateji Raporu — "Planlanan vs. Gerçekleşen (Planned vs. Actual) Sapma Analiz Paneli"

**Kural 4: Rotalar Sayfasına "Gerçeklik Kontrol" Sekmesi Eklenir**

Rota planlama sadece ideal rotaları göstermek değildir. Pratikte şoförler neler yaptı? Rota dışına mı çıktı? Kapasiteyi heba mı etti?

**✅ Rotalar Sayfası Yeni Sekmeler:**

```
Route: /c/[companyId]/routes
Accent: violet-500

Tab Yapısı:
┌─────────────────────────────────────────────────────────────┐
│ [📋 Rota Listesi] [📊 Sapma Analizi] [⚙️ Optimizasyon]    │
└─────────────────────────────────────────────────────────────┘

TAB 2: SAPMA ANALİZİ (Planned vs Actual)
┌─────────────────────────────────────────────────────────────┐
│ Tarih Seçimi: [Dün] [Son 7 Gün] [Ay] [Özel Aralık]         │
│ Rota Filtresi: [Tüm Rotalar] [Okul] [Personel] [Fabrika]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Harita Görünümü (Split-Screen):                             │
│ ┌─────────────────────────┬──────────────────────────────┐ │
│ │ Overlay Harita          │ Sayısal Analitik (Sağ)      │ │
│ │                         │                              │ │
│ │ ─── Planlanan (Gri)     │ Rota: Okul Servisi A        │ │
│ │     A → B → C → D      │ Planlanan: 45 km, 52 dk     │ │
│ │                         │ Gerçekleşen: 47.2 km, 58 dk│ │
│ │ ─── Gerçekleşen (Zümrüt)│ Sapma: +2.2 km, +6 dk       │ │
│ │ ⟿   A → B → C' → D     │                              │ │
│ │     (C' kestirme yolu!) │ Ortalama Doluluk:           │ │
│ │                         │ Planlanan: 85% (28 kişi)    │ │
│ │ Duraklar: O O O O       │ Gerçekleşen: 64% (21 kişi)  │ │
│ │          ◆ (sapma)      │ Kapasite Harcanması: 75%    │ │
│ │                         │ ⚠️ İçi Boş Koltuk Riski!   │ │
│ │                         │                              │ │
│ │                         │ Sistem Önerisi:             │ │
│ │                         │ "Okul Srv A + Okul Srv B   │ │
│ │                         │  birleştirilirse aylık      │ │
│ │                         │  2.400 TL yakıt tasarrufu"  │ │
│ │                         │ [Birleştir] [Reddet]       │ │
│ └─────────────────────────┴──────────────────────────────┘ │
│                                                              │
│ Rota Karşılaştırma Tablosu:                                 │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Rota        Plan    Gerçek   Δ Km   Δ Zaman  Doluluk │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │ Okul A      45km    47.2km   +2.2   +6dk    64%     │  │
│ │ Perş B      38km    38.1km   +0.1   +2dk    91%     │  │
│ │ Fabr C      52km    51.8km   -0.2   -3dk    88%     │  │
│ │ Pers D      41km    44.5km   +3.5   +11dk   58% ⚠️  │  │
│ │ Trans E     29km    29.3km   +0.3   +1dk    100% ✓ │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                              │
│ Özet KPI'lar:                                               │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Ortalama Sapma Mesafe: +1.8 km  |  Tahmini Faiz: +2% │  │
│ │ Ortalama Geç Kalış: +4.4 dk     |  Açıkta Kapasite: 23%│  │
│ │ En Kötü Performans: Pers D      |  Sistem İyileştirme  │  │
│ │                                  |  Tavsiyesi: 2 Rota   │  │
│ └─────────────────────────────────────────────────────┘   │
│                                                              │
│ [📥 Analiz Raporu İndir] [🔍 Detaylı Harita] [⚙️ Tümü Fix]│
└─────────────────────────────────────────────────────────────┘
```

**Teknikon ve Algoritma:**
1. **Harita Overlay**: Planlanan rota gri çizgi, gerçekleşen GPS trace zümrüt çizgi
2. **Sapma Markerları**: Gerçek durak vs planlı durak farklıysa kırmızı çizgi/ok
3. **Doluluk Hisiye**: Hedef kapasitenin % kaçı kullanıldığını visualize et (ring chart)
4. **İyileştirme Motoru**: Rota birleştirme, durak silme gibi aksiyonları öner
5. **Backend Gereksimiş**: `getRouteDeviationMetrics(routeId, dateRange)` callable - gerçekleşen ve planlanan verileri karşılaştırıp sapma + önerileri döner

---

### 1.3 Harita Mimarisi — Bilgi Lazanyası ve Geofencing Motoru

**KAYNAK**: Strateji Raporu — "Harita Arayüzü Mimarisi" ve "Geofencing Tabanlı Akıllı Operasyon Motoru"

**Kural 5: Harita = "Bilgi Lazanyası" (Information Lasagna) Mimarisiyle Yapılandırılır**

Harita, sadece "araçları göster" değil. Çok layerbound, katman-bazlı, bakılabilir, filtreli bir veri ortamı.

**Harita Katman Hiyerarşisi** (Bottom to Top):

```
LAYER 5 (Top): Kontrol Arayüzü
  ├─ Zoom buttonu
  ├─ Katman seçimi (checkbox)
  ├─ Filtreler (durum, rota, bölge)
  └─ Harita modu toggle

LAYER 4: Etkil. Objeler
  ├─ Araç pinleri (nabız animasyonlu)
  ├─ Durak markerları (tıklanabilir)
  ├─ Seçili araç track (zümrüt polyline)
  └─ Dinamik küme pinleri

LAYER 3: Veri Katmanları
  ├─ Rota polylines (pastel, opacity 0.4)
  ├─ Geofence poligonlarını (kesintili sınır)
  ├─ Topolojik ısı haritaları (traffic/density)
  └─ Engel bölgeleri (cevaz yok vb.)

LAYER 2: Alt Veri
  ├─ Yol ağları (stilized, maked colors)
  ├─ Su yolları → gri
  └─ Binalar → açık gri

LAYER 1 (Base): Zemin Haritası
  └─ Mapbox/Google Maps özel stil (marka renkleri, POI kapalı)
```

**Harita Stil Kuralları:**
- **POI'ler Kapalı**: Restoran, kafe, park, markalar google maps'deki gibi show-off için gösterilmeyecek
- **Renk Paleti**: Açık gri zemin, koyu çizgiler, pastel aksentler
- **Etiketler**: Sadece sokak adları, cadde adıları — geri kalanı yok
- Mapbox GL JS kullanılacaksa: `mapboxgl.setRTLTextPlugin()` Türkçe için

**Harita Kontrol Mimarı (Floating UI):**

```
Top-Left Corner:        Top-Right Corner:           Bottom-Left:
┌──────────────┐       ┌──────────────────┐       ┌─────────────┐
│ [🎯] Merkez  │       │ [≡] Zoom         │       │ © Mapbox    │
│ [🔄] Pusula  │       │ [+] [−] Control  │       │ Map Terms   │
│ [🌙] Dark    │       └──────────────────┘       └─────────────┘
│              │
│ Katman Seçme:         Bottom-Right:
│ ☑ Rotalar   │       ┌──────────────────┐
│ ☑ Geofences │       │ [🔍] Ara          │
│ ☑ Isıhartası│       │ [🔗] Paylaş       │
│ ☐ Trafik    │       │ [⚙️] Filteler   │
└──────────────┘       └──────────────────┘
```

---

**Kural 6: Dinamik Kümeleme (Clustering) ve Akıllı Seçim (Smart Selection)**

Aynı koordinatta 5+ araç olduğunda, pinler tek bir küme pinine birleşir.

```
Zoom Level 10 (Fernview):
  [40] ← Küme Pini (40 araç burada)
  
  Tıkla → [35] [3] ← Alt kümeler (zoom-dependent detail)

Zoom Level 14+ (Closeup):
  Bireysel araçlar: 🚐 🚐 🚐
```

Tıklama sonrası açılacak Smart Selection Pop-up:

```
Seçin (5 araç bu konumda):
┌─────────────────────────────┐
│ 🚐 34 ABC 01                │
│    Ahmet Y. → [Detay] [↗]  │
│                             │
│ 🚐 34 DEF 02                │
│    Mehmet K. → [Detay] [↗] │
│                             │
│ 🚐 34 GHI 03                │
│    Ali V. → [Detay] [↗]    │
│                             │
│ ┌──────────────────────────┐│
│ │ + 2 more        [Tümü]   ││
│ └──────────────────────────┘│
└─────────────────────────────┘
```

---

**Kural 7: Geofencing Motoru — Otomatik Arrival/Departure + Kural Motor**

Geofence'ler (sanal sınırlar), sistemin "akıl"ını sağlarlar.

**Geofence Tipi Örnekleri:**

```
1. DURAK Geofence (Yarıçapı: 100m)
   Okul Genel Merkez @ (41.0082, 28.9784)
   İçeri girişte: Durak_Giriş Event
   Dışarı çıkışta: Durak_Çıkış Event
   ├─ Bekleme Süresi Hesapla (Çıkış zamanı - Giriş zamanı)
   ├─ Yolcu İndi Teyidi (Şoför butonu / QR scan)
   └─ Hafıza Depo (Firestore `durak_visits/{eventId}`)

2. ROTA Geofence (Poligon)
   Okul Servisi A rotasının izin verilen alan
   Sınır dışına çıkış = UYARI
   ├─ Harita üzerinde kırmızı pulsing banner
   ├─ Dispeçer telefonuna push bildirim
   └─ Kapalı raporlamada "Rota Sapması" flagı

3. BÖLGE Geofence (Şehir/İlçe)
   İstanbul Anadolu Yakaı + Avrupa Yakası
   Rotanın tanımlandığı bölge dışına çıkma = ALARM
   ├─ Hırsızlık şüphesi veya kural ihlali
   └─ Müşteri tarafından tanımlanır
```

**Geofence Otomasyonu (Rule Engine):**

```
RULE 1: Otomatik Puantaj Üretimi
┌─────────────────────────────────────────────┐
│ IF [Araç] enters [DURAK_Geofence]          │
│ THEN                                        │
│   ├─ Timestamp'i kaydet (giriş_saat)      │
│   ├─ Şoföre: [📍 Durağa geldim] butonu ver │
│   └─ Durağa göre rotawalk seç (otomatik)   │
│                                             │
│ IF [Araç] exits [DURAK_Geofence]           │
│ THEN                                        │
│   ├─ Timestamp'i kaydet (çıkış_saat)      │
│   ├─ Dwell_Time = çıkış_saat - giriş_saat│
│   ├─ QR scan veya şoför teyidi kontrol et  │
│   ├─ Yolcu sayısı kayıt et (biniş veri)   │
│   └─ Puantaj Cetveline satır ekle (DB)     │
└─────────────────────────────────────────────┘

RULE 2: Gecikme Uyarıları (Deterministic)
┌─────────────────────────────────────────────┐
│ IF [Rota_A] başlangıç saati = 07:00        │
│    AND saat 07:45                          │
│    AND [Araç] halen depot geofence'de      │
│ THEN                                        │
│   ├─ Dispeçer arayüzünde: RED BANNER      │
│     "Okul Srv A araç halen depoda!"       │
│   ├─ Dispeçer telefonuna push notif       │
│   ├─ Alternatif araç listesi sun:         │
│     "34 GHI 03 müsait. Ata → 1 tık"       │
│   └─ 15dk sonrasında ceza ekran'de göster │
└─────────────────────────────────────────────┘

RULE 3: Bölge İhlali (Security)
┌─────────────────────────────────────────────┐
│ IF [Araç] exits [İzin_Verilen_Bölge]       │
│ THEN                                        │
│   ├─ Harita'da araç pini KIRMIZI ⚠️       │
│   ├─ Dispeçer: Hırsızlık uyarısı           │
│   ├─ Müşteri (firma yöneticisi) SMS alert  │
│   ├─ Şoför: "Rota dışında hareket ediyor,  │
│   │         lütfen kontrol edin" push      │
│   └─ Sistemin "Unauthorized Movement" log  │
└─────────────────────────────────────────────┘
```

**Harita'da Geofence Gösterimi:**

```
İçeride Durak:
┌──────────────────────────────┐
│                              │
│  ◯ Durak Merkezasi          │ ← Center dot (tap for info)
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░  │ ← 100m radius (kesintili sınır)
│ ░░                      ░░░░░│
│ ░░    🚐 Araç Giriş    ░░░░░│ ← Zümrüt "Nabız" animasyon
│ ░░                      ░░░░░
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░
│                              │
└──────────────────────────────┘
İçeride Bekleme: [3.2 dk]

Çıkışında Bakıldığında:
┌──────────────────────────────┐
│      ◯ Durak (Bitti)         │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│ ░░                      ░░░░░│
│ ░░     (boş)            ░░░░░│ ← Araç dışarı çıktı
│ ░░                      ░░░░░│    (Bekleme zamanı = 3.2 dk)
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░
│
│  ➜ 34 ABC 01 [GPS trace] → Sonraki durağa
│                              │
└──────────────────────────────┘
```

---

### 1.4 Komut Paleti (Command Palette) — Sistemin Sinir Merkezi

**KAYNAK**: Strateji Raporu — "Komut Paleti (Command Palette) Entegrasyonu"

**Kural 8: Komut Paleti = %100 İnten-Odaklı Eylem Motoru**

Mevcut planda tek satırla geçilen Ctrl+K özelliği, 2026 panelinin **sinir merkezi**'dir.

**Mimarı:**

```
Komut Paleti (Modal Popover)
┌─────────────────────────────────────────────────────┐
│ ⌘ K  (Cmd+K veya Ctrl+K)                            │ ← Kısayol
├─────────────────────────────────────────────────────┤
│ [🔍 Type command or search...                      │ ← Arama kutusu
├─────────────────────────────────────────────────────┤
│                                                      │
│ 🔴 RECENT ACTIONS (Yakın zamanda yapılanlar):      │
│ ├─ > Okul Servisi A [Detay]   (5 dk önce)         │
│ ├─ > Ahmet Yılmaz [Profil]     (15 dk önce)       │
│ └─ > Rotaları Optimize Et      (bugün)             │
│                                                      │
│ 🔔 QUICK ACTIONS (Hızlı Eylemler):                 │
│ ├─ > Yeni Rota Oluştur...                          │
│ ├─ > Yeni Araç Ekle...                             │
│ ├─ > Şoför Davet Et...                             │
│ ├─ > Rota Optimize Et                              │
│ ├─ > Belgesi Bitiyor Şoförler                      │
│ └─ > Gecikenler Listesi                            │
│                                                      │
│ 🔗 SEARCH RESULTS (Arama Sonuçları):              │
│ ├─ 34 ABC 01 [Araç Detay]       (plaka scan)      │
│ ├─ Ahmet Yılmaz [Profil]        (isim ara)        │
│ ├─ Eylül Rotaları [Rota List]   (metin match)     │
│ └─ Şoför Belgeleri [Belgeler]   (domain search)   │
│                                                      │
│ ⚙️ SETTINGS (Ayarlar):                             │
│ ├─ > Koyu Tema                                     │
│ ├─ > Bildirim Ayarları                             │
│ ├─ > Kısayol Tuşları                               │
│ └─ > Yardım                                         │
│                                                      │
│ Tıkla veya ↵ (Enter) ile seç                       │
│ Esc ile kapat                                       │
└─────────────────────────────────────────────────────┘
```

**Intent Engine (Niyet Motoru) — Özel Komutlar:**

```
KOMUT GRAMERI:
  [prefix] [entity] [action]

Örnek Komutlar ve Davranışı:

1. "> Yeni Rota" / "rota ekle" / "rota oluştur"
   → Create Route sihirbazını modal'da aç
   → Durak listesi al (veri autocomplete)
   → Optimize (VRP) butonu hazır

2. "> Gecikenler" / "Hangisi geç?" / "Gecikme"
   → Live Ops filtrele: status = "delayed"
   → Harita zoom ↨ gecikmiş araçlara
   → Dispeçer aksiyonları göster

3. "> Belgeleri Bitiyor" / "Süresi Yaklaşan" / "Belgeler"
   → Şoför Belgeler sayfasına git
   → Bitiş 30 gün içinde filtrele
   → Toplu hatırlatma gönder

4. "> Ahmet Yılmaz" / "Şoför Profil"
   → Şoför veri tabanında adı ara
   → Profil slide-over aç (harita'da pin)
   → Sefer geçmişi, belgeler, puan göster

5. "> Plaka 34 ABC 01"
   → Araç detay panelini aç
   → Harita seçili araca zoom in
   → Son 2 saat GPS trace göster

6. "> Koyu Tema" / "> Dark Mode"
   → Tüm UI Tailwind dark: class'lara switch
   → LocalStorage'a flag kaydet
   → Sayfa reload yoktur (real-time)

7. "> Rotaları Optimize Et"
   → Optimize Route wizard aç
   → Personel ve araç sayısı input iste
   → Backend VRP engine'i çalıştır
   → Sonuç harita overlay'de göster

8. "> Muayene Yaklaşan"
   → Araçlar filtr et: muayene_tarihi <= 30 gün
   → KPI vurgusu "3 aracın muayenesi yakın"
   → Detay panelinde bakım tarihleri vurgulu
```

**Tech Implementation (React + Cmdk):**

```typescript
// packages/web/src/components/command-palette.tsx

import { useCallback } from 'react'
import { useCommand } from 'cmdk' // library: cmdk

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { push } = useRouter()

  // Glo bal Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen])

  // Intent Engine
  const handleCommandSelect = useCallback((command: string) => {
    const lower = command.toLowerCase()

    // Action Groups
    if (lower.includes('yeni') && lower.includes('rota')) {
      openCreateRoutWizard() // Modal aç
    } else if (lower.includes('gecikenler') || lower.includes('gecikme')) {
      filterLiveOps({ status: 'delayed' })
    } else if (lower.includes('belgeler') || lower.includes('bitiyor')) {
      push('/c/[companyId]/driver-documents')
    } else if (lower.includes('koyu') || lower.includes('dark')) {
      toggleDarkMode()
    }
    // ... more patterns
  }, [push])

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput placeholder="Type command or search..." />
      <CommandList>
        <CommandGroup heading="Recent Actions">
          {/* Dinamik recent items */}
        </CommandGroup>
        <CommandGroup heading="Quick Actions">
          {quickActions.map(action => (
            <CommandItem
              key={action.id}
              value={action.label}
              onSelect={handleCommandSelect}
            >
              {action.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Search Results">
          {/* Araç, şoför, rota vb arama sonuçları */}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
```

---

### 1.5 Şoför Resmi Belgeler Yönetimi (MVP Kritik)

**KAYNAK**: Operasyonel gereklilik — Geçersiz belgeli şoför = Rota atanamıyor

**Yeni Sayfa: Şoför Belgeler**

```
Route: /c/[companyId]/driver-documents
Sidebar: "📄 Şoför Belgeler" [orange]
Master List: Şoförler (durum badge: belgeler eksik / yaklaşan bitiş / tamam)
Detail Panel: Seçili şoförün belgeleri + expiration takvimi
```

**Belge Türleri:**

1. **Ehliyet** — Sınıfı, ihraç tarihi, bitiş tarihi, ön+arka fotokopi upload
2. **SRC Belgesi** — hraç/bitiş tarihi, yenileme maliyet notu
3. **Psikoteknik Raporu** — Rapor tarihi, geçerlilik süresi (1–5 yıl)
4. **Sağlık Raporu** — Hekim imzalı, geçerlilik süresi

**Durum Renk Kodu:**
- 🟢 Tamam → Tüm belgeler geçerli
- 🟡 Uyarı → Herhangi bir belge 30 gün içinde bitiyor
- 🔴 Engel → Bitiş tarihi geçmiş; rota ataması bloke

**UI (Master List):**

```
Şoförler Listesi
│
├─ ✅ Ahmet Y.    — Belgeler Tamam
├─ ⚠️ Mehmet K.  — SRC Bitiş 20 Gün Kaldı
├─ ❌ Ali V.      — Ehliyet Geçmiş ← Rota Atama Engelli
└─ ⭕ Fatih T.   — Belgeler Yüklenmemiş
```

**Detail Panel (Seçili Şoför):**

```
Ahmet Yılmaz
┌──────────────────────────────────────┐
│ Ehliyet — Geçerli ✓                 │
│ Sınıfı: B+E  |  Bitiş: 15.03.2029  │
│ [Dosya Görüntüle] [Düzenle] [Sil]  │
├──────────────────────────────────────┤
│ SRC Belgesi — ⚠️ 20 Gün Kaldı       │
│ Bitiş: 20.03.2026                   │
│ [Dosya] [Yenile...] [Hatırlatma]   │
├──────────────────────────────────────┤
│ Psikoteknik — Geçerli ✓             │
│ Bitiş: 01.12.2026                   │
│ [Dosya]                             │
├──────────────────────────────────────┤
│ Sağlık Raporu — Geçerli ✓           │
│ Bitiş: 01.02.2027                   │
│ [Dosya]                             │
└──────────────────────────────────────┘

[Belgeleri Güncelle] [Hatırlatma Gönder] [Takvim Görünümü]
```

**Firebase Firestore Şeması:**

```json
drivers/{driverId}/documents/{docType}
{
  "docType": "ehliyet | src | psikoteknik | saglik",
  "issueDate": "2024-03-01",
  "expiryDate": "2027-03-01",
  "storageUrl": "gs://neredeservis-prod-01/driver_docs/...",
  "uploadedAt": "2026-03-03T14:30:00Z",
  "uploadedBy": "uid",
  "status": "valid | expiring_soon | expired"
}
```

**Backend Callables:**

```typescript
// functions/src/callables/driver_documents_callables.ts

export const uploadDriverDocument = functions.https.onCall(async (data, context) => {
  // Firebase Storage upload → Firestore doc oluştur
  // return { success, docId, storageUrl }
})

export const getDriverExpirations = functions.https.onCall(async (data, context) => {
  // Şirketteki tüm şoförlerin belgelerini al
  // days_remaining hesapla, expiry_date'e göre sırala
  // return sorted list
})

export const sendRenewalReminder = functions.https.onCall(async (data, context) => {
  // Şoföre / yöneticiye email/SMS: "Belgeniz X gün içinde bitiyor"
  // reminder_log kaydı oluştur
})

export const getDriverAvailability = functions.https.onCall(async (data, context) => {
  // Şoförün ehliyet + SRC + sağlık belgesi geçerli mi?
  // return { canAssignToRoute: boolean, blockedBy: string[] }
})
```

**Geofence Entegrasyon Kuralı:**

```
IF [Rota Ataması] denemesi yapılırsa
   AND şoförün SRC.status = "expired"
   OR  şoförün ehliyet.status = "expired"
THEN → Atama BLOKE edilir
        Mesaj: "Belgelerinizi güncelleyin"
        Link:  /driver-documents/{driverId}
```


### 1.6 Sürücü Uygulaması Entegrasyonu ve Değiştirilemez Veri (Immutable Data)

**KAYNAK**: Strateji Raporu — "Sürücü Uygulaması Entegrasyonu ve Değiştirilemez (Immutable) Biniş Verisi"

**Kural 9: Mobil QR / Biniş Teyidi Uygulaması**

Sahadan değiştirilemez veri akışı için mobil uygulama şarttir.

**Sürücü Mobil Uygulaması (Flutter veya React Native) — Basit İki Ekran:**

```
EKRAN 1: Rota Başı (Sürücü Hazır)
┌─────────────────────────────┐
│ 🚐 Araçınız: 34 ABC 01       │
│                              │
│ 🎯 Rotanız: Okul Srv A       │
│ ⏰ Planlı Başlangıç: 07:45   │
│ 📍 Başlangıç: Okul Merkez     │
│                              │
│ [🟢 ROTAYI BAŞLAT] (1 tık)  │
│                              │
│ ─────────────────────────────│
│ Araç Denetimi:               │
│ ☑ Araç Temiz        ☐ Yakıt │
│ ☑ Fren Durumu OK    ☐ Işıkl│
│                              │
│ [✓ Denetim Tamam]           │
└─────────────────────────────┘

EKRAN 2: Durak Başı (Yolcu Geldiyse)
┌─────────────────────────────┐
│ 📍 Durak: Fatih İlk Okul     │
│ ⏰ Planlı: 08:15             │
│ ⏱️ Şu An: 08:13 (✓ Zamanında)│
│                              │
│ ┌───────────────────────────┐│
│ │ 🔷 QR Kodu Okut            ││ ← Kamera açılır
│ │ LUT her yolcunun ID'sini  ││    (QR reader)
│ │ scan etmesi gerekir        ││
│ └───────────────────────────┘│
│                              │
│ Taranmış: 8 / 8 yolcu ✓     │
│                              │
│ [🟢 DURAKTAN AYRıL]          │
│ (durak exit event'i oluşur)  │
└─────────────────────────────┘
```

**Veri Flow:**

```
1. Sürücü [Rotayı Başlat] tıkla
   ↓
   Event: route_start
   Data: {
     driver_id: "abc123",
     vehicle_id: "34ABC01",
     route_id: "route_xyz",
     timestamp: "2026-03-03T07:45:00Z",
     geolocation: { lat, lng },
     vehicle_check: { clean: true, fuel: ok, ... }
   }
   ↓ (API POST → Backend)
   ↓
   Backend: Firestore `driver_sessions/{sessionId}` doc oluştur
   Telegram/email: Dispeçer bilgilendir
   Mobile: Durak listesi push et

2. Durak 1'e gelince...
   Geofence event → Backend otomatik: geofence_entry event
   Sürücü mobil uygulamada: "Durak Fatih İlk Okul — QR okut"
   
   QR veri: { student_id: "s123", entry_time: "08:13:22Z" }
   
   8 yolcunun hepsini scan edene kadar "Duraktan Ayrıl" lock

3. Duraktan Ayrıldığında
   Geofence event → Backend otomatik: geofence_exit event
   Data: {
     dwell_time: "548 seconds",
     expected_passengers: 8,
     scanned_passengers: 8,
     missing: 0
   }
   ↓
   Puantaj Cetveline otomatik satır:
   {
     tarih: "03.03.2026",
     rota: "Okul Srv A",
     araç: "34ABC01",
     şoför: "Ahmet Y.",
     başlangıç: 07:45:00,
     durak_1_entry: 08:13:22,
     durak_1_exit: 08:19:10,
     durak_1_dwell: 5.8 dk,
     durak_1_yolcu: 8/8 ✓
     ... (tüm duraklar)
     bitiş: 15:23:00,
     durum: "TAMAMLANDI" ✓
   }
```

**Teknik Detaylar:**

```typescript
// mobile/src/screens/route_start_screen.tsx

const RouteStartScreen = () => {
  const [isLoading, setIsLoading] = useState(false)

  const handleStartRoute = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        'https://asia-northeast1-neredeservis-prod-01.cloudfunctions.net/startDriverSession',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driver_id: currentDriver.uid,
            vehicle_id: assignedVehicle.id,
            route_id: todayRoute.id,
            timestamp: new Date().toISOString(),
            geolocation: await getCurrentLocation(), // GPS
            vehicle_check: {
              clean: checkboxes.clean,
              fuel_ok: checkboxes.fuel,
              brake_ok: checkboxes.brake,
              // ...
            }
          })
        }
      )
      
      const { sessionId, stops } = await response.json()
      
      // Local state update + navigation
      setActiveSession(sessionId)
      navigateTo('/stops', { stops })
      setIsLoading(false)
    } catch (error) {
      showError('Rota başlatılamadı. İnternet bağlantısını kontrol edin.')
    }
  }

  return (
    <SafeAreaView>
      <Text style={styles.title}>34 ABC 01</Text>
      <Text style={styles.subtitle}>Okul Sv A</Text>
      
      <CheckBox label="Araç Temizi" />
      <CheckBox label="Yakıt OK" />
      
      <LargeButton
        title="ROTAYI BAŞLAT"
        onPress={handleStartRoute}
        disabled={isLoading || !allChecked}
        loading={isLoading}
      />
    </SafeAreaView>
  )
}
```

```typescript
// mobile/src/screens/stop_screen.tsx

const StopScreen = () => {
  const [scannedPassengers, setScannedPassengers] = useState([])
  const stop = route.stops[currentStopIndex]
  
  const handleQRScanned = (qrData) => {
    // Validate: qrData = { student_id, name }
    setScannedPassengers([...scannedPassengers, qrData])
    
    if (scannedPassengers.length === stop.expected_count) {
      // Unlock "Duraktan Ayrıl" butonu
      setAllPassengersScanned(true)
    }
  }

  const handleLeaveStop = async () => {
    const response = await fetch(
      '.../exitGeofence',
      {
        method: 'POST',
        body: JSON.stringify({
          session_id: activeSession,
          stop_id: stop.id,
          dwell_seconds: calculateDwell(),
          scanned_passengers: scannedPassengers
        })
      }
    )
    // Next stop'a geç
  }

  return (
    <SafeAreaView>
      <Text>{stop.name}</Text>
      <Text>Taranmış: {scannedPassengers.length} / {stop.expected_count}</Text>
      
      {!allPassengersScanned ? (
        <QRCodeScanner onScan={handleQRScanned} />
      ) : (
        <Button title="DURAKTAN AYRIL" onPress={handleLeaveStop} />
      )}
    </SafeAreaView>
  )
}
```

**API Endpoint Gereksinimleri:**

```
POST /c/[companyId]/startDriverSession
  Body: { driver_id, vehicle_id, route_id, timestamp, geolocation, vehicle_check }
  Response: { sessionId, stops: [...] }
  Firestore: driver_sessions/{sessionId} doc create

POST /c/[companyId]/enterGeofence
  Body: { session_id, stop_id, timestamp, geolocation }
  Response: { dwell_start_time }
  Firestore: geofence_events/{eventId} doc create

POST /c/[companyId]/exitGeofence
  Body: { session_id, stop_id, dwell_seconds, scanned_passengers: [...] }
  Response: { success, puantaj_row_id }
  Firestore: payroll_entries/{entryId} doc create + UPDATE trip status

POST /c/[companyId]/scanPassengerQR
  Body: { session_id, stop_id, qr_data }
  Response: { scanned_count, remaining_count }
  Firestore: scanned_passengers/{recordId} doc create
```

---

### 1.7 Dark Mode Mimarisi (Tailwind CSS Integration)

**KAYNAK**: Strateji Raporu — "2026 UI/UX Paradigmaları" (implicit) + Komut Paleti Dark Mode Toggle

**Kural 10: Sistem Çapında Dark Mode Desteği (Zero Flash, Persistence)**

**Mimarı:**

```typescript
// web/src/contexts/theme-context.tsx

import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext<{
  isDark: boolean
  toggle: () => void
}>({ isDark: false, toggle: () => {} })

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // 1. localStorage'dan oku
    const stored = localStorage.getItem('theme-mode')
    if (stored) return stored === 'dark'
    
    // 2. Sistem preference'ını oku (prefers-color-scheme)
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const toggle = () => {
    setIsDark(!isDark)
    localStorage.setItem('theme-mode', isDark ? 'light' : 'dark')
  }

  useEffect(() => {
    // Document root'a dark class ekle/kaldır
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
```

**Tailwind CSS Config (tailwind.config.ts):**

```typescript
export default {
  darkMode: 'class', // <html class="dark"> based
  theme: {
    extend: {
      colors: {
        // Işık modu (default)
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          // ... (Tailwind defaults)
          900: '#0f172a'
        },
        // Dark mode otomatik negasyon (Tailwind'in built-in dark: prefix'i)
      }
    }
  },
  plugins: []
}
```

**Component Kullanımı:**

```typescript
// web/src/components/page-header.tsx

export const PageHeader = ({ accent = 'indigo', title, description }) => {
  return (
    <div className={`
      border-l-4 
      border-${accent}-500
      px-8 py-6
      bg-white dark:bg-slate-950
      border-b border-slate-200 dark:border-slate-800
      transition-colors duration-200
    `}>
      <h1 className={`
        text-2xl font-bold
        text-slate-900 dark:text-white
      `}>
        {title}
      </h1>
      <p className={`
        text-sm
        text-slate-500 dark:text-slate-400
        mt-1
      `}>
        {description}
      </p>
    </div>
  )
}
```

**KPI Card Dark Mode:**

```typescript
export const KpiCard = ({ icon: Icon, label, value, trend, accent }) => {
  return (
    <div className={`
      rounded-2xl
      p-6
      bg-${accent}-50 dark:bg-${accent}-950
      border border-${accent}-200 dark:border-${accent}-800
      shadow-sm
      transition-all duration-200
    `}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`
            text-sm
            text-${accent}-600 dark:text-${accent}-400
            uppercase tracking-wide
          `}>
            {label}
          </p>
          <p className={`
            text-3xl font-bold
            text-${accent}-900 dark:text-${accent}-50
            mt-2
          `}>
            {value}
          </p>
        </div>
        <Icon className={`text-${accent}-400 dark:text-${accent}-600`} />
      </div>
      {trend && (
        <div className="mt-4 h-10 bg-${accent}-100 dark:bg-${accent}-900/30">
          {/* Mini Sparkline */}
        </div>
      )}
    </div>
  )
}
```

**Komut Paletinde Dark Mode Toggle:**

```typescript
// Komut paletindeki bir action
{
  id: 'toggle-dark-mode',
  label: '> Koyu Tema',
  category: 'Settings',
  onSelect: () => {
    const { toggle } = useTheme()
    toggle() // localStorage + DOM update → sıfır flash
    toast.success('Koyu tema aktifleştirildi')
  }
}
```

---

## 2. YENİ SIDEBAR YAPISI VE SAYFA MİMARİLERİ (2026 Standardı)

### Sidebar Navigation (Updated)

```
/c/[companyId]/dashboard           📊 Genel Bakış (indigo)
/c/[companyId]/live-ops            🎮 Canlı Operasyon (emerald) ← MEGA PAGE
  ├─ master: araçlar/şoförler
  ├─ detail: harita + info pane
  └─ modes: list/grid/map/timeline
/c/[companyId]/routes              🛣️ Rotalar (violet)
  ├─ tab: Rota Listesi
  ├─ tab: Sapma Analizi (NEW!)
  └─ tab: Optimizasyon (VRP)
/c/[companyId]/members             👥 Üyeler (rose)
/c/[companyId]/driver-documents    📄 Şoför Belgeler (orange) ← YENİ!
/c/[companyId]/settings            ⚙️ Ayarlar (slate)
/c/[companyId]/export              📤 Dışa Aktarma (teal)
```

---

### 2.1 📊 Genel Bakış (Dashboard) — Minimal Değişiklik

**Route**: `/c/[companyId]/dashboard`  
**Accent**: `indigo`  
**Değişiklik Seviyesi**: Minimal (Plan 1.x'in %80'i korunur)

**Yeni Ekler (Plan 2.0):**
- KPI kartlarına sparkline grafikler (7 günlük trend)
- **ROI Göstergesi**: "Bu ay akıllı optimizasyon sayesinde 2.345 TL yakıt tasarrufu"
- Hoş Geldin Bandı (ilk girişte, onboarding checklist)
- Dark mode desteği (Tailwind `dark:` prefix'leri)

---

### 2.2 🎮 Canlı Operasyon (Live Ops) — MEGA PAGE (Master-Detail Split)

**Route**: `/c/[companyId]/live-ops`  
**Accent**: `emerald`  
**Revizyon**: RADIKAL (Vehicles + Drivers → Tek Sayfa, Master-Detail Split)

**Mimari:**
- **Sol Panel (Master List)**: Araçlar / Şoförler toggle
  - Durum badge'ları (🟢 Aktif, 🟡 Beklemede, ⭕ Atanmamış, ⚠️ Gecikmeli)
  - Arama ve filtreler (durum, rota, gecikme)
  - Seç ve hover'da detay panelini aç
- **Sağ Panel (Detail Pane)**: Seçili araç/şoför
  - Mini harita (son GPS trace)
  - KPI'lar (hız, ETA, doluluk, puan)
  - Sekmeli tab: Sefer Durakları, Belgeler, Analitik
- **Harita Modu**: `[🗺️] [◫] [📋]` toggle
  - 🗺️ = Fullscreen Mapbox (liste alt drawer)
  - ◫ = 50/50 Split (mevcut)
  - 📋 = Tablo modu (harita gizli)

**Yeni Özellikler (Plan 2.0):**
- **Bilgi Lazanyası**: Harita base→data layers→interactive→controls
- **Dinamik Kümeleme**: 5+ araç aynı yerde = Küme pini, tıkla açılır
- **Akıllı Seçim Pop-up**: Çakışan araçlar için seçim menüsü
- **Geofence Visualization**: Sanal sınırlar harita'da görünür (kesintili çizgi)
- **Nabız Animasyonu**: Araç pinleri pulsating (yeşil < 30sn, sarı 30sn-2dk, kırmızı >2dk)
- **Geofence Alert Banner**: Rota dışı çıkan araçlar (kırmızı soft uyarı)
- **Dark Mode**: Harita stil + UI dark: uyumlu

---

### 2.3 🛣️ Rotalar

**Route**: `/c/[companyId]/routes`  
**Accent**: `violet`  
**Revizyon**: Sapma Analizi Tab ekleme

**Sekme Yapısı:**
- **Tab 1: Rota Listesi** (Plan 1.x gibi)
- **Tab 2: Sapma Analizi** (YENİ!)
  - Harita overlay: Planlanan (gri) vs Gerçekleşen (zümrüt) polylines
  - Tablo: Rota adı, plan km, gerçek km, sapma, doluluk %
  - Sistem önerileri (rota birleştir, atla vb)
  - Backend: `getRouteDeviationMetrics(routeId, dateRange)` callable
- **Tab 3: Optimizasyon** (Plan 1.x: Drag & drop, harita ön izleme, klonlama korunur)

**Drag & Drop DND-Kit İmplementasyonu:**
```typescript
// Durak sıralaması: @dnd-kit/sortable ile
// Sürükle → opacity-50 + violet ring
// Bırak → animasyon + ETA otomatik güncelle
```

---

### 2.4 👥 Üyeler (minimal değişiklik)

**Route**: `/c/[companyId]/members`  
**Accent**: `rose`  

**Plan 1.x**: Rol yönetimi, davet, son giriş  
**Plan 2.0 Ekler**: Dark mode desteği, Komut Paleti entegrasyonu

---

### 2.5 ⚙️ Ayarlar

**Route**: `/c/[companyId]/settings`  
**Accent**: `slate`  
**Revizyon**: Plan 1.x'i korunur (Tab: Genel, Bildirimler, Abonelik, Tehlikeli Bölge)

**Plan 2.0 Ekler:**
- Dark mode toggle (Ayarlar içinde ve Komut Paletinde)
- Firestore SDK ile gerçek veri kayıt (tüm formlar çalışır)
- Callback validation (sözleşme kuralları update, yakıt parametreleri vb)

---

### 2.6 📄 Şoför Belgeler (YENİ SAYFA)

**Route**: `/c/[companyId]/driver-documents`  
**Accent**: `orange`  

**Bu sayfa Plan 2.0'da 1.5 bölümde detaylı anlatıldı.**

Özetle:  
- Ehliyet, SRC, psikoteknik, sağlık raporu yükleme ve takibi
- Renk kodlu durum: 🟢 Tamam / 🟡 30 gün uyarı / 🔴 Süresi dolmuş
- Firebase Storage upload + Firestore expiry tracking
- Backend Callables: `uploadDriverDocument`, `getDriverExpirations`, `sendRenewalReminder`, `getDriverAvailability`
- Geofence kuralı: Geçersiz belge → rota ataması bloke

---

### 2.7 📤 Dışa Aktarma (Export Hub) — Küçültülmüş "Raporlar"

**Route**: `/c/[companyId]/export`  
**Accent**: `teal`  

**Plan 2.0 Revizyon:** Eski devasa "Reports" sayfası minimize edildi.

Fonksiyonu:  
- **Şoför Belge Özeti** (Tüm şoförler, bitiş tarihleri, toplu Excel export)
- **Operasyon Raporları** (Sefer özeti, Araç kullanım, Şoför performans CSV)
- **Özel Şablonlar** (Kullanıcı istek üzerine dinamik report oluştur)
- Export formatı: Excel, CSV, JSON, PDF

Teknik: Client-side Blob download + Backend PDF generation (puppeteer)

---

## 3. Ortak Bileşenler (Reusable Components)

Tüm sayfalarında tutarlı kalmak için:

| Bileşen | Amaç | Tailwind Classes |
|---------|------|------------------|
| `PageHeader` | Özel başlık + accent border | `border-l-4 border-{accent}-500 px-8 py-6` |
| `KpiCard` | Metrik kartları (sparkline included) | `bg-{accent}-50 dark:bg-{accent}-950 rounded-2xl p-6` |
| `EmptyState` | Veri yoksa (big icon + text) | `py-12 text-center text-slate-500` |
| `SkeletonLoader` | Shimmer placeholder | `animate-pulse bg-slate-200 dark:bg-slate-800` |
| `Toast` | Bildirim (react-hot-toast) | `bg-green-500 dark:bg-green-600 text-white` |
| `SlideOver` | Sağdan açılan panel (detail) | `fixed right-0 top-0 w-96 h-full shadow-lg` |
| `CommandPalette` | Komut motoru (cmdk lib) | Modal dialog, dark mode compatible |
| `GeofenceMap` | Mapbox ML + geofence poly | Bilgi lazanyası, dinamik kümeleme |
| `MiniChart` | SVG sparkline / bar/ring | inline SVG, `stroke-{accent}-400` |

---

## 4. Teknik Altyapı — Gerekli NPM Paketleri

```json
{
  "dependencies": {
    "@dnd-kit/sortable": "^7.0.0",
    "@dnd-kit/core": "^6.0.0",
    "cmdk": "^0.2.0",
    "react-hot-toast": "^2.4.0",
    "mapbox-gl": "^2.15.0",
    "@mapbox/mapbox-gl-draw": "^1.4.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.263.0"
  }
}
```

---

## 5. MVP İçin Realtime Production Checklist (Plan 2.0)

Kodlamaya başlamadan önce onay alınması gereken liste:

### ✅ Yapı
- [x] Sidebar yeniden yapılandırma (Live Ops, Şoför Belgeler, Export Hub)
- [x] Master-Detail Split mimarisi (Live Ops başlık)
- [x] Harita bilgi lazanyası (5 layer)
- [x] Geofencing rule engine (otomatik puantaj)
- [x] Komut Paleti (Ctrl+K intent engine)
- [x] Dark mode mimarisi (Tailwind dark: prefix)
- [x] Mobile QR integration (immutable data)

### ⚙️ Temel Callables (Backend)
```
POST /c/[companyId]/getRouteDeviationMetrics
POST /c/[companyId]/uploadDriverDocument
POST /c/[companyId]/getDriverExpirations
POST /c/[companyId]/sendRenewalReminder
POST /c/[companyId]/getDriverAvailability
POST /c/[companyId]/startDriverSession
POST /c/[companyId]/enterGeofence
POST /c/[companyId]/exitGeofence
POST /c/[companyId]/scanPassengerQR
```

### 📦 Frontend Pages (7 Sayfa)
1. `/dashboard` — Genel Bakış (KPI + sparkline + ROI)
2. `/live-ops` — Master-Detail (Araçlar + Şoförler + Harita)
3. `/routes` — Rotalar (Liste + Sapma + VRP)
4. `/members` — Üyeler (RBAC + davet)
5. `/driver-documents` — Şoför Belgeler (yükleme + expiry takip)
6. `/settings` — Ayarlar (gemnişletilmiş form)
7. `/export` — Export Hub (raporlar + template)

---

## 6. ÖZET: Plan 1.x vs Plan 2.0

| Kategori | 1.x | 2.0 | Fark |
|----------|-----|-----|------|
| Sayfa Sayısı | 8 ayrı | 7 merged | Vehicles + Drivers → Live Ops |
| Harita | Header + mini | Full Bilgi Lazanyası | Clustering, Smart Selection |
| Raporlama | Devasa Tab | Embedded + Export Hub | Modüler, efektif |
| Menü | Klasik | Komut Paleti | Ctrl+K intent engine |
| Geofencing | Alert sadece | Rule Motor | Puantaj otomatik |
| Şoför Belgeler | Yok | Expiry takip + bloke | MVP operasyon kritik |
| Dark Mode | Belirtilmemiş | Tailwind dark: + UI toggle | Tüm sayfada |
| Mobil | Yok | QR + biniş teyidi | Immutable veri |

---

## ⭐ STRATEJI RAPORUNDAN ALINAN VE BAŞKA NELERİ İNCELEYEBİLECEĞİNİZ

### ✅ Zaten Entegre Edilen (Plan 2.0)
1. **Sakin Tasarım (Calm Design)** — 24px/32px boşluk, soft shadows
2. **Bilişsel Yükü Azaltma** — Skeleton loading, toast, optimistic UI
3. **Harita Information Lasagna** — 5-layer mimarisi + smart clustering
4. **Geofencing Akıllı Motor** — Deterministic rule engine
5. **Şoför Belgeler Yönetimi** — Expiry takip, upload, geofence bloke
6. **Komut Paleti Sinir Merkezi** — Intent-driven actions
7. **Dark Mode Mimarisi** — Tailwind CSS full support
8. **Mobil Entegrasyonu** — QR + value-drivenimmutable data
9. **B2B Satış Psikolojisi** — ROI göstergesi + pain point solving

### 🔔 Rapordan Başka Alınabilecekler (Phase 2+)
- **Yapay Zeka Yerine Sistem Önerileri**: VRP-bazlı "rota birleştir", "düşük kapasite uyarısı", ceza kesinti bildirimleri
- **KPI Dashboard Evolution**: Realtime analitik (günü al, haftayı vs. geçen hafta karşılaştır)
- **Sürücü Uygulama Gamification**: Puan sistemi, leaderboard, "Aylık En İyi Şoför"
- **Müşteri (B2B Alıcı) Portali**: Kendi paneli (read-only tarafları görür)
- **Webhook + CSV Import Entegrasyonu**: Dış sistemlerle otomatik veri sinkronizasyon
- **Machine Learning Tahminleme** (budget varsa): Gecikme tahmini, araç arızaları öngörü
- **Multi-tenant Hierarchy**: Holding + yan kuruluşlar
- **Blockchain Sertifikasyonum (edge case)**: Belge imzalama ve doğrulama

---

## 7. Sonuç: Plan 2.0 Özeti

**NeredeServis Panel 2.0**, 2026 standartlarında bir B2B SaaS ürünüdür:

✨ **Görsel**: Ferah, pastel, modern, koyu tema destekli  
⚡ **Hız**: Max 1 tık, skeleton loading, optimistic UI, Ctrl+K commands  
🧠 **Akıllılık**: Geofencing rules, VRP, Şoför Belge Takibi, sapma analizi  
💼 **Operasyon**: Şoför Belgeler (MVP kritik), belge takibi, mobil QR, ROI göstergesi  
🎯 **UX**: Master-Detail split, harita clustering, dark mode, accessibility  

**Hedef**: Excel'den çok, Linear / Notion / Vercel Dashboard tarzında bir SaaS algısı yaratmak.

---

> **Not**: Bu plan 2026 B2B SaaS standart raporunun tamamı Entegre edilmiştir. Kodlamaya başlamadan **mutlaka** Plan 2.0'ı aşama aşama review edin.
