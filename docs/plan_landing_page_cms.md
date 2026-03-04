# Landing Page v2 — Aydınlık Tema + Admin CMS Planı

> **Tarih:** 4 Mart 2026  
> **Durum:** Plan aşaması — onay sonrası kodlamaya geçilecek  
> **Kapsam:** Ana sayfa light redesign + Platform admin panelinden tüm içeriğin düzenlenebilmesi

---

## 1. Genel Bakış

### 1.1 Mevcut Durum
- Ana sayfa (`(marketing)/page.tsx`) 625 satır — **koyu (zinc-950) tema**, tüm içerik hardcoded
- CMS yok — metin, fiyat, görsel değişikliği deploy gerektirir
- Platform admin paneli (`/platform`) sadece şirket CRUD yapıyor
- Storage'da yalnızca `profile_photos/` ve `company_logos/` var

### 1.2 Hedef
| Alan | Hedef |
|------|-------|
| **Tema** | Aydınlık, ferah, profesyonel — beyaz/gri zemin, marka rengi teal vurgu |
| **CMS** | Platform admin panelinden tüm bölümler düzenlenebilir |
| **Medya** | Hero görseli, ürün screenshot'u, logo, OG image — hepsi uploadable |
| **Fiyatlandırma** | Planlar, fiyatlar, özellik listeleri admin'den yönetilir |
| **SEO** | Title, description, OG bilgileri admin'den değiştirilebilir |
| **Performans** | Firestore'dan tek `doc.get()` + Next.js ISR/cache → sayfa hızı korunur |

---

## 2. Veri Mimarisi

### 2.1 Firestore Koleksiyonu

```
Koleksiyon: site_config
Doküman ID: landing_page
```

### 2.2 Doküman Şeması (`LandingPageConfig`)

```typescript
interface LandingPageConfig {
  // ─── META & SEO ───
  seo: {
    title: string;           // "NeredeServis — Kurumsal Servis Yönetim Platformu"
    description: string;     // Meta description
    ogImageUrl: string;      // Upload edilen OG image URL'i
  };

  // ─── NAVBAR ───
  navbar: {
    logoUrl: string;         // Upload edilen logo URL
    ctaText: string;         // "Ücretsiz Başla"
    ctaLink: string;         // "/login"
    links: Array<{
      label: string;         // "Özellikler"
      href: string;          // "#features"
    }>;
  };

  // ─── HERO ───
  hero: {
    badgeText: string;       // "Şimdi canlı — tüm modüller aktif"
    badgeVisible: boolean;   // Badge göster/gizle
    headlineLine1: string;   // "Servis operasyonunuz"
    headlineLine2: string;   // "artık tek panelde."
    subtitle: string;        // Alt açıklama paragrafı
    primaryCta: {
      text: string;          // "Ücretsiz demo başlat"
      link: string;          // "/login"
    };
    secondaryCta: {
      text: string;          // "Bize ulaşın"
      link: string;          // "/iletisim"
    };
    heroImageUrl: string;    // Hero bölümü arka plan/ürün görseli (opsiyonel)
  };

  // ─── SOSYAL KANIT / STATS BAR ───
  stats: Array<{
    value: string;           // "99.9%"
    label: string;           // "Uptime SLA"
  }>;                        // Maks 4-6 adet

  // ─── ÜRÜN ÖNİZLEME ───
  productPreview: {
    visible: boolean;        // Bölümü göster/gizle
    screenshotUrl: string;   // Dashboard screenshot görseli
    caption: string;         // Opsiyonel alt yazı
  };

  // ─── ÖZELLİKLER ───
  features: {
    sectionTitle: string;    // "Operasyonun her adımı kontrol altında"
    sectionSubtitle: string; // Alt açıklama
    items: Array<{
      icon: string;          // Lucide icon adı: "MapPin", "Route", "Car", vb.
      title: string;         // "Canlı Takip"
      description: string;   // Açıklama
      color: string;         // Tailwind renk kodu: "teal", "sky", "amber" vb.
    }>;                      // 3-9 adet, 3'lü grid'e uygun
  };

  // ─── NASIL ÇALIŞIR ───
  howItWorks: {
    sectionTitle: string;    // "3 adımda operasyona başlayın"
    steps: Array<{
      icon: string;          // Lucide icon adı
      title: string;         // "Şirketinizi oluşturun"
      description: string;   // Açıklama
    }>;                      // Genellikle 3 adım
  };

  // ─── FİYATLANDIRMA ───
  pricing: {
    sectionTitle: string;    // "İhtiyacınıza göre esnek planlar"
    sectionSubtitle: string; // Alt açıklama
    plans: Array<{
      name: string;          // "Başlangıç"
      price: string;         // "Ücretsiz" veya "₺1.490"
      priceSuffix: string;   // "" veya "/ay"
      description: string;   // "Küçük filolar için."
      features: string[];    // ["5 araç", "2 rota", ...]
      highlighted: boolean;  // Vurgulu kart mı?
      ctaText: string;       // "Hemen Başla"
      ctaLink: string;       // "/login"
    }>;                      // 2-4 plan
  };

  // ─── ALT CTA BÖLÜMÜ ───
  bottomCta: {
    headlineLine1: string;   // "Operasyonunuzu dijitalleştirmeye"
    headlineLine2: string;   // "bugün başlayın."
    subtitle: string;        // Alt açıklama
    primaryCta: {
      text: string;
      link: string;
    };
    secondaryCta: {
      text: string;
      link: string;
    };
  };

  // ─── FOOTER ───
  footer: {
    brandDescription: string; // Marka açıklaması
    columns: Array<{
      title: string;          // "Platform"
      links: Array<{
        label: string;        // "Özellikler"
        href: string;         // "#features"
      }>;
    }>;
    copyrightText: string;    // "© 2026 NeredeServis. Tüm hakları saklıdır."
  };

  // ─── MÜŞTERİ LOGOLARI (Opsiyonel gelecek bölümü) ───
  trustedBy: {
    visible: boolean;
    title: string;            // "Güvenilen kurumlarca tercih ediliyor"
    logos: Array<{
      name: string;
      imageUrl: string;
    }>;
  };

  // ─── TESTIMONIALS (Opsiyonel gelecek bölümü) ───
  testimonials: {
    visible: boolean;
    title: string;
    items: Array<{
      quote: string;
      authorName: string;
      authorRole: string;
      authorImageUrl: string;
    }>;
  };

  // ─── SİSTEM ───
  updatedAt: Timestamp;       // Son güncelleme zamanı
  updatedBy: string;          // Güncelleyen kullanıcı UID
  version: number;            // Opsiyonel: config versiyonu (audit trail)
}
```

### 2.3 Default Config

İlk deploy'da `site_config/landing_page` dokümanı yoksa, frontend **hardcoded fallback config** kullanır.
Admin panelinde "Kaydet" yapıldığında Firestore'a yazılır ve artık o versiyon kullanılır.

---

## 3. Firebase Storage — Yeni Medya Klasörleri

### 3.1 Yol Yapısı

```
/site_media/landing/hero/{fileName}        → Hero görseli
/site_media/landing/product/{fileName}     → Ürün screenshot
/site_media/landing/og/{fileName}          → OG image
/site_media/landing/logo/{fileName}        → Site logosu
/site_media/landing/trusted/{fileName}     → Müşteri logoları
/site_media/landing/testimonials/{fileName}→ Testimonial fotoları
```

### 3.2 Storage Rules Güncellemesi

```rules
match /site_media/{allPaths=**} {
  allow read: if true;                        // Herkes görebilmeli (public site)
  allow write: if request.auth != null
    && request.auth.uid == PLATFORM_OWNER_UID  // Sadece platform sahibi yükler
    && request.resource.size < 5 * 1024 * 1024 // Maks 5MB
    && request.resource.contentType.matches('image/.*');
}
```

> **Not:** `PLATFORM_OWNER_UID` Storage Rules'da env variable değil — ya hardcode edilir ya da Custom Claims ile `request.auth.token.platformOwner == true` kontrolü yapılır. **Önerilen:** Custom Claim yaklaşımı.

### 3.3 Custom Claim Ekleme (Tek seferlik)

Mevcut `PLATFORM_OWNER_UID` kullanan kullanıcıya Firebase Auth Custom Claims eklenir:

```typescript
admin.auth().setCustomUserClaims(PLATFORM_OWNER_UID, { platformOwner: true });
```

Storage rule:
```rules
allow write: if request.auth.token.platformOwner == true && ...
```

---

## 4. Backend — Cloud Functions

### 4.1 Yeni Callable Fonksiyonlar

| Fonksiyon | Yetki | Açıklama |
|-----------|-------|----------|
| `platformGetLandingConfig` | Platform Owner | `site_config/landing_page` dokümanını döner |
| `platformUpdateLandingConfig` | Platform Owner | Tüm config'i günceller (partial merge destekli) |

### 4.2 Modül: `functions/src/callables/platform_landing_callables.ts`

```typescript
// ─── platformGetLandingConfig ───
// Guard: requirePlatformOwner()
// İş: db.doc("site_config/landing_page").get() → döndür
// Doküman yoksa: { exists: false } döner

// ─── platformUpdateLandingConfig ───
// Guard: requirePlatformOwner()
// Validation: Zod schema ile gelen payload doğrulanır
// İş: db.doc("site_config/landing_page").set(data, { merge: true })
// Ekler: updatedAt = serverTimestamp(), updatedBy = auth.uid
```

### 4.3 Zod Validation Şeması

`platformUpdateLandingConfig` için gelen veri Zod ile doğrulanır:
- Tüm string alanlar `.max(500)` → XSS-safe
- URL alanlar `.url()` veya boş string
- Array alanlar `.max(10)` → sonsuz ekleme önlenir
- `features.items` → `.max(12)`
- `pricing.plans` → `.max(6)`
- `stats` → `.max(8)`

### 4.4 index.ts Entegrasyonu

```typescript
// index.ts'ye eklenecek:
const landingCallables = createPlatformLandingCallables(db);
export const platformGetLandingConfig = landingCallables.platformGetLandingConfig;
export const platformUpdateLandingConfig = landingCallables.platformUpdateLandingConfig;
```

### 4.5 Firestore Rules Güncellemesi

```rules
match /site_config/{docId} {
  allow read: if true;          // Public site okuyabilmeli (SSR/ISR için)
  allow write: if false;        // Yazma yalnızca Cloud Functions üzerinden
}
```

> **Açıklama:** Frontend okuma yapabilmesi sadece SSR'da gerekiyor. Alternatif: callable ile oku + cache.
> Güvenlik: Yazma `if false` — mutation sadece callable üzerinden, `requirePlatformOwner()` korumalı.

---

## 5. Frontend — Landing Page Light Redesign

### 5.1 Dosya: `(marketing)/page.tsx`

Mevcut 625 satırlık sayfa tamamen yeniden yazılacak.

### 5.2 Renk Paleti — Aydınlık Tema

| Token | Değer | Kullanım |
|-------|-------|----------|
| Arka plan | `#FFFFFF` → `white` | Sayfa zemini |
| İkincil arka plan | `#F8FAFC` → `slate-50` | Alternatif bölümler (zebra) |
| Kart arka plan | `#FFFFFF` | Kart/panel zemini |
| Ana metin | `#0F172A` → `slate-900` | Başlıklar |
| İkincil metin | `#475569` → `slate-600` | Paragraflar |
| Soluk metin | `#94A3B8` → `slate-400` | Etiketler, alt metin |
| Çizgi/Kenar | `#E2E8F0` → `slate-200` | Border, divider |
| Marka ana | `#0D9488` → `teal-600` | CTA, vurgu, ikön arka plan |
| Marka açık | `#CCFBF1` → `teal-100` | İkon arka plan bubble |
| Marka gradient | `teal-500 → teal-700` | Butonlar |
| Aksan | `#F59E0B` → `amber-500` | Dikkat çekici vurgu |

### 5.3 Bölüm Tasarım Rehberi

#### Navbar
- **Zemin:** `bg-white/80 backdrop-blur-xl border-b border-slate-200`
- **Logo:** Sol — bus ikonu (teal gradient) + "NeredeServis" yazısı
- **Linkler:** Orta — slate-600, hover:teal-600
- **CTA:** Sağ — "Giriş Yap" ghost + "Ücretsiz Başla" teal filled

#### Hero
- **Zemin:** Pure white — hafif radial gradient (`slate-50` → `white`)
- **Hero görseli:** Sağ tarafta veya altta büyük ürün screenshot (admin'den upload)
- **Badge:** `bg-teal-50 text-teal-700 border border-teal-200` — pulse dot
- **Headline:** `slate-900` — bold, 7xl
- **Gradient text:** `teal-600` → `emerald-500`
- **Subtitle:** `slate-500` — relaxed
- **CTA butonları:** Teal gradient primary + slate-200 border secondary
- **Stats bar:** `bg-slate-50` rounded, içinde beyaz kutucuklar — subtle shadow

#### Product Preview
- **Browser frame mockup:** `bg-white border border-slate-200 shadow-xl rounded-2xl`
- **İçeride ürün screenshot:** Admin'den yüklenen gerçek dashboard görseli
- **Hafif perspective/tilt efekti** (CSS transform) — premium hissi

#### Features (6 kart, 3×2 grid)
- **Zemin:** Alternatif — `bg-slate-50`
- **Kartlar:** `bg-white border border-slate-200 hover:shadow-lg hover:border-teal-200 transition`
- **İkon bubble:** `bg-{color}-100` içinde `text-{color}-600` Lucide ikonu
- **Başlık:** `slate-900` semibold
- **Açıklama:** `slate-500`

#### How It Works (3 adım)
- **Zemin:** `bg-white`
- **Adım numaraları:** Teal-50 daire, içinde teal-600 ikon
- **Adımlar arası çizgi:** Dashed line veya gradient connector

#### Pricing (3 kart)
- **Zemin:** `bg-slate-50`
- **Normal kartlar:** `bg-white border border-slate-200`
- **Vurgulu kart:** `border-teal-300 ring-2 ring-teal-100 shadow-lg` + üstte "Popüler" badge
- **Fiyat:** `text-4xl font-black text-slate-900`
- **Özellik listesi:** Teal check ikonları

#### Bottom CTA
- **Zemin:** `bg-gradient-to-br from-teal-600 to-teal-800` — TAM TERSİ: aydınlık sayfada koyu CTA bandı
- **Metin:** Beyaz
- **Glow:** `bg-teal-400/20 blur-3xl` arka planda

#### Footer
- **Zemin:** `bg-slate-900` — koyu footer (kontrast)
- **Metin:** Slate-400, linkler hover:white
- **Logo:** Beyaz versiyonu

### 5.4 Veri Akışı

```
┌──────────────────────────────────────────────────┐
│  (marketing)/page.tsx — Next.js Server Component │
│                                                  │
│  1. getDoc("site_config/landing_page")           │
│     └─ Firebase Admin SDK (server-side)          │
│  2. Doküman varsa → config olarak kullan         │
│     Yoksa → FALLBACK_CONFIG kullan               │
│  3. Config'i <LandingPageClient config={...} />  │
│     prop'u olarak geçir                          │
│                                                  │
│  export const revalidate = 60; // ISR: 60 saniye │
└──────────────────────────────────────────────────┘
```

> **Alternatif (önerilen basit yol):** Firestore callable ile client-side fetch + SWR cache.
> Ama SEO için server-side render önemli → **Firebase Admin SDK + ISR** tercih edilir.

### 5.5 Firebase Admin SDK — Server-Side Okuma

Yeni dosya: `lib/firebase/admin.ts`

```typescript
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Next.js server component'larda ve API route'larda kullanılır
export function getAdminDb() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY!)),
    });
  }
  return getFirestore();
}
```

> Zaten server-side Firebase Admin varsa mevcut yapı kullanılır. Yoksa eklenir.
> `FIREBASE_ADMIN_KEY` env variable'ını Vercel'de tanımlamak gerekir.

### 5.6 Dosya Yapısı (Frontend)

```
src/
├── app/(marketing)/
│   └── page.tsx                          ← Server component, fetch + render
├── components/marketing/
│   ├── landing-page-client.tsx           ← Tüm bölümleri render eden client component
│   ├── sections/
│   │   ├── landing-navbar.tsx
│   │   ├── landing-hero.tsx
│   │   ├── landing-stats.tsx
│   │   ├── landing-product-preview.tsx
│   │   ├── landing-features.tsx
│   │   ├── landing-how-it-works.tsx
│   │   ├── landing-pricing.tsx
│   │   ├── landing-bottom-cta.tsx
│   │   └── landing-footer.tsx
│   └── landing-config-types.ts           ← LandingPageConfig TypeScript tipi
├── app/(platform)/platform/
│   └── landing/
│       └── page.tsx                      ← Admin CMS sayfası
├── components/platform/landing/
│   ├── landing-cms-panel.tsx             ← Ana CMS container
│   ├── cms-section-seo.tsx               ← SEO düzenleme formu
│   ├── cms-section-navbar.tsx            ← Navbar düzenleme formu
│   ├── cms-section-hero.tsx              ← Hero düzenleme formu
│   ├── cms-section-stats.tsx             ← Stats düzenleme formu
│   ├── cms-section-product-preview.tsx   ← Screenshot upload + preview
│   ├── cms-section-features.tsx          ← Özellik kartları CRUD
│   ├── cms-section-how-it-works.tsx      ← Adımlar düzenleme
│   ├── cms-section-pricing.tsx           ← Fiyatlandırma planları CRUD
│   ├── cms-section-bottom-cta.tsx        ← CTA düzenleme
│   ├── cms-section-footer.tsx            ← Footer düzenleme
│   ├── cms-section-trusted-by.tsx        ← Müşteri logoları (opsiyonel)
│   ├── cms-section-testimonials.tsx      ← Referanslar (opsiyonel)
│   ├── cms-image-uploader.tsx            ← Reusable image upload component
│   └── cms-icon-picker.tsx              ← Lucide ikon seçici dropdown
└── features/platform/
    └── platform-landing-client.ts        ← Callable wrapper'lar
```

---

## 6. Admin CMS Paneli — Platform Landing Sayfası

### 6.1 Erişim

- **Rota:** `/platform/landing`
- **Koruma:** `PlatformOwnerGuard` (mevcut — UID kontrolü)
- **Sidebar'a eklenir:** "Ana Sayfa CMS" linki

### 6.2 CMS Sayfa Tasarımı

```
┌─────────────────────────────────────────────────────┐
│  Platform Sidebar          │  Ana Sayfa İçerik       │
│  ─────────────             │  Yönetimi               │
│  Şirketler                 │                         │
│  Şirket Oluştur            │  ┌─ Canlı Önizleme ─┐  │
│  ⭐ Ana Sayfa CMS          │  │  (iframe/link)    │  │
│  Dashboard'a Dön           │  └───────────────────┘  │
│                            │                         │
│                            │  [Accordion Bölümler]   │
│                            │                         │
│                            │  ▸ SEO & Meta           │
│                            │  ▾ Hero Bölümü          │
│                            │    ├ Badge metni: [___] │
│                            │    ├ Başlık 1: [______] │
│                            │    ├ Başlık 2: [______] │
│                            │    ├ Alt yazı: [______] │
│                            │    ├ CTA Buton: [_] [_] │
│                            │    └ Hero Görseli: [⬆]  │
│                            │  ▸ İstatistikler        │
│                            │  ▸ Ürün Önizleme        │
│                            │  ▸ Özellikler (6 kart)  │
│                            │  ▸ Nasıl Çalışır        │
│                            │  ▸ Fiyatlandırma        │
│                            │  ▸ Alt CTA              │
│                            │  ▸ Footer               │
│                            │  ▸ Müşteri Logoları     │
│                            │  ▸ Referanslar          │
│                            │                         │
│                            │  [💾 Kaydet] [↩ Sıfırla]│
│                            │                         │
│                            │  Son güncelleme:        │
│                            │  04.03.2026 14:30       │
└─────────────────────────────────────────────────────┘
```

### 6.3 CMS Bileşen Detayları

#### SEO & Meta
- Title input (max 70 karakter, canlı sayaç)
- Description textarea (max 160 karakter, canlı sayaç)
- OG Image upload + önizleme (1200×630 önerilen boyut bildirimi)

#### Navbar
- Logo upload (SVG/PNG, maks 200KB)
- CTA buton metni ve link
- Navbar linkleri — drag-and-drop sıralanabilir liste
  - Her satır: label input + href input + sil butonu
  - "Link ekle" butonu

#### Hero
- Badge metni + toggle (göster/gizle)
- Başlık satır 1 + satır 2
- Alt açıklama (textarea)
- Primary CTA: metin + link
- Secondary CTA: metin + link  
- Hero görseli: image upload + crop + preview

#### İstatistikler
- Dinamik liste (min 2, max 6)
- Her satır: value input + label input + sil
- "İstatistik ekle" butonu
- Drag-and-drop sıralama

#### Ürün Önizleme
- Toggle: göster/gizle
- Screenshot upload (büyük — max 5MB, 16:9 önerisi)
- Alt yazı input

#### Özellikler
- Section başlık + alt başlık
- Kart listesi (min 3, max 12)
- Her kart:
  - İkon seçici (Lucide icon picker — dropdown/search)
  - Başlık input
  - Açıklama textarea
  - Renk seçici (teal/sky/amber/violet/rose/emerald/indigo/orange — 8 preset)
  - Sil butonu
- "Özellik ekle" butonu
- Drag-and-drop sıralama

#### Nasıl Çalışır
- Section başlık
- Adım listesi (genellikle 3, max 5)
- Her adım: ikon seçici + başlık + açıklama + sil
- "Adım ekle" butonu

#### Fiyatlandırma
- Section başlık + alt başlık
- Plan listesi (min 1, max 4)
- Her plan:
  - Plan adı
  - Fiyat (serbest text — "Ücretsiz", "₺1.490", "Özel")
  - Fiyat eki ("", "/ay", "/yıl")
  - Açıklama
  - Özellik listesi — her biri bir input + sil + ekle
  - Vurgulu mı? (checkbox)
  - CTA buton metni
  - CTA link
- "Plan ekle" butonu
- Drag-and-drop sıralama

#### Alt CTA
- Başlık satır 1 + satır 2
- Alt açıklama
- Primary CTA: metin + link
- Secondary CTA: metin + link

#### Footer
- Marka açıklaması (textarea)
- Sütunlar (min 1, max 4):
  - Sütun başlığı
  - Linkler listesi: label + href + sil + ekle
- Copyright metni

#### Müşteri Logoları
- Toggle: göster/gizle
- Bölüm başlığı
- Logo listesi: isim + image upload + sil + ekle

#### Referanslar (Testimonials)
- Toggle: göster/gizle
- Bölüm başlığı
- Referans listesi:
  - Alıntı (textarea)
  - Kişi adı
  - Kişi rolü
  - Kişi fotoğrafı (image upload)

### 6.4 Ortak CMS Bileşenleri

#### `cms-image-uploader.tsx`
- Drag-and-drop + click-to-select
- Mevcut resim preview + silme/değiştirme
- Upload to Firebase Storage → URL'yi state'e yaz
- Boyut limiti kontrolü (client-side + rule)
- Format kontrolü (image/png, image/jpeg, image/svg+xml, image/webp)
- Yükleme progress bar
- Önerilen boyut bilgisi (props ile)

#### `cms-icon-picker.tsx`
- Lucide icon listesinden arama + seçim
- Seçili ikonun görsel preview'ı
- ~30 önceden filtrelenmiş "önerilen" ikon (transport/business/tech temalı)
- Serbest arama tüm Lucide seti üzerinde

---

## 7. İmplementasyon Adımları (Sıralı)

### Faz A — Veri Katmanı (Backend)
| # | İş | Dosya(lar) | Tahmini Satır |
|---|-----|-----------|---------------|
| A1 | `LandingPageConfig` TypeScript tipini oluştur | `components/marketing/landing-config-types.ts` | ~120 |
| A2 | Zod validation şeması oluştur | `functions/src/schemas/landing_config_schema.ts` | ~100 |
| A3 | `platformGetLandingConfig` + `platformUpdateLandingConfig` callable'ları yaz | `functions/src/callables/platform_landing_callables.ts` | ~80 |
| A4 | `index.ts`'ye entegre et | `functions/src/index.ts` | ~10 |
| A5 | `firestore.rules`'a `site_config` koleksiyonu ekle | `firestore.rules` | ~5 |
| A6 | `storage.rules`'a `site_media` kuralı ekle | `storage.rules` | ~10 |
| A7 | Platform owner'a custom claim ekle (one-time script) | `scripts/set-platform-claims.ts` | ~20 |
| A8 | Firebase deploy (functions + rules + storage) | CLI | — |

### Faz B — Landing Page Light Redesign (Frontend)
| # | İş | Dosya(lar) | Tahmini Satır |
|---|-----|-----------|---------------|
| B1 | Fallback config sabiti oluştur | `components/marketing/landing-default-config.ts` | ~200 |
| B2 | `page.tsx` — server component, Firestore fetch + ISR | `app/(marketing)/page.tsx` | ~50 |
| B3 | Firebase Admin SDK helper (server-side) | `lib/firebase/admin.ts` | ~20 |
| B4 | `LandingPageClient` — config'i alıp section'ları render eden container | `components/marketing/landing-page-client.tsx` | ~60 |
| B5 | Landing Navbar section | `components/marketing/sections/landing-navbar.tsx` | ~80 |
| B6 | Landing Hero section | `components/marketing/sections/landing-hero.tsx` | ~100 |
| B7 | Landing Stats section | `components/marketing/sections/landing-stats.tsx` | ~40 |
| B8 | Landing Product Preview section | `components/marketing/sections/landing-product-preview.tsx` | ~50 |
| B9 | Landing Features section | `components/marketing/sections/landing-features.tsx` | ~80 |
| B10 | Landing How It Works section | `components/marketing/sections/landing-how-it-works.tsx` | ~60 |
| B11 | Landing Pricing section | `components/marketing/sections/landing-pricing.tsx` | ~100 |
| B12 | Landing Bottom CTA section | `components/marketing/sections/landing-bottom-cta.tsx` | ~60 |
| B13 | Landing Footer section | `components/marketing/sections/landing-footer.tsx` | ~80 |
| B14 | Trusted By + Testimonials sections | `components/marketing/sections/landing-trusted-by.tsx`, `landing-testimonials.tsx` | ~100 |
| B15 | Build + deploy | CLI | — |

### Faz C — Admin CMS Paneli (Frontend)
| # | İş | Dosya(lar) | Tahmini Satır |
|---|-----|-----------|---------------|
| C1 | Platform callable wrapper'lar | `features/platform/platform-landing-client.ts` | ~30 |
| C2 | CMS Image Uploader component | `components/platform/landing/cms-image-uploader.tsx` | ~120 |
| C3 | CMS Icon Picker component | `components/platform/landing/cms-icon-picker.tsx` | ~100 |
| C4 | CMS ana container + accordion layout | `components/platform/landing/landing-cms-panel.tsx` | ~150 |
| C5 | SEO section form | `components/platform/landing/cms-section-seo.tsx` | ~60 |
| C6 | Navbar section form | `components/platform/landing/cms-section-navbar.tsx` | ~80 |
| C7 | Hero section form | `components/platform/landing/cms-section-hero.tsx` | ~100 |
| C8 | Stats section form | `components/platform/landing/cms-section-stats.tsx` | ~70 |
| C9 | Product Preview section form | `components/platform/landing/cms-section-product-preview.tsx` | ~60 |
| C10 | Features section form | `components/platform/landing/cms-section-features.tsx` | ~120 |
| C11 | How It Works section form | `components/platform/landing/cms-section-how-it-works.tsx` | ~80 |
| C12 | Pricing section form | `components/platform/landing/cms-section-pricing.tsx` | ~150 |
| C13 | Bottom CTA section form | `components/platform/landing/cms-section-bottom-cta.tsx` | ~60 |
| C14 | Footer section form | `components/platform/landing/cms-section-footer.tsx` | ~80 |
| C15 | Trusted By + Testimonials forms | `components/platform/landing/cms-section-trusted-by.tsx`, `cms-section-testimonials.tsx` | ~120 |
| C16 | Platform CMS page.tsx + sidebar güncelleme | `app/(platform)/platform/landing/page.tsx` | ~30 |
| C17 | Platform sidebar'a "Ana Sayfa CMS" linki ekle | `components/platform/platform-sidebar.tsx` vb. | ~5 |
| C18 | Build + deploy | CLI | — |

### Faz D — Vercel Env + Son Dokunuşlar
| # | İş |
|---|-----|
| D1 | `FIREBASE_ADMIN_KEY` env var'ı Vercel'e ekle |
| D2 | ISR revalidation test |
| D3 | Mobile responsive test (tüm breakpoint'ler) |
| D4 | Lighthouse performance check (>90 hedefi) |
| D5 | OG image preview test (social share) |

---

## 8. Toplam Tahmin

| Faz | Dosya Sayısı | Tahmini Toplam Satır |
|-----|-------------|---------------------|
| A — Backend | 5 yeni + 3 güncelleme | ~345 |
| B — Landing Page | 12 yeni + 1 güncelleme | ~880 |
| C — Admin CMS | 17 yeni + 2 güncelleme | ~1.415 |
| **Toplam** | **~34 dosya** | **~2.640 satır** |

---

## 9. Teknik Kararlar & Notlar

### 9.1 Neden Firestore + Callable (CMS yok)?
- Mevcut tüm mimari Firebase ekosistemi üzerine kurulu
- Ek servis (Sanity, Strapi, Contentful) entegrasyonu gereksiz karmaşıklık
- Platform owner tek kişi — basit form yeterli
- Versiyon kontrolü gerekmez (tek doküman, `updatedAt` yeterli)

### 9.2 Neden ISR?
- SEO için server-side rendered HTML şart
- Her request'te Firestore'a gitmek yerine 60 saniyelik cache
- Admin config değiştiğinde `revalidateTag()` veya on-demand revalidation eklenebilir

### 9.3 İkon Yönetimi
- Admin panelinde ikon adı (string) seçilir: `"MapPin"`, `"Route"`, vb.
- Frontend'de `lucide-react`'tan dinamik render:
  ```tsx
  import * as LucideIcons from "lucide-react";
  const Icon = LucideIcons[iconName as keyof typeof LucideIcons];
  ```
- Performans: Tree-shaking bozulur → **sadece kullanılan ikonları whitelist map olarak tutmak daha iyi** (30-40 ikon)

### 9.4 Görsel Optimizasyonu
- Admin'den yüklenen görseller Firebase Storage'da tutulur
- Frontend'de `next/image` ile render → otomatik WebP/AVIF dönüşümü + lazy load
- `next.config.js`'de `images.remotePatterns`'a `firebasestorage.googleapis.com` eklenir

### 9.5 Canlı Önizleme (Opsiyonel — Faz C+)
- CMS panelinde "Önizle" butonu → yeni sekmede `/?preview=true` açar
- Preview modda Firestore'dan güncel (kaydedilmemiş) draft okunur
- **İlk sürümde yok** — kaydet + 60sn bekle yeterli

---

## 10. Risk & Bağımlılıklar

| Risk | Etki | Azaltma |
|------|------|---------|
| Firebase Admin SDK server-side eklenmemiş olabilir | ISR çalışmaz | Callable fallback ile client-side fetch + `loading` state |
| `FIREBASE_ADMIN_KEY` Vercel'de henüz yok | Build başarılı ama runtime hata | Deploy öncesi env var ekle |
| Çok büyük görsel yükleme | Sayfa yavaşlar | Client-side resize (canvas) + Storage 5MB limit |
| Lucide tüm ikon seti import | Bundle büyür | Whitelist map (~40 ikon) |
| ISR cache invalidation gecikmesi | Admin güncelleme sonrası site hemen güncellenmez | On-demand revalidation API route ekle |

---

## 11. Onay Sonrası Aksiyon

Bu plan onaylandığında şu sırayla kodlama yapılacak:

1. **Faz A** — Backend callable'lar + rules + storage  
2. **Faz B** — Landing page light redesign (fallback config ile, CMS bağımsız çalışır)  
3. **Faz C** — Admin CMS paneli  
4. **Faz D** — Env setup + test + deploy  

Her faz sonunda bağımsız deploy yapılabilir.

---

*Plan sonu — Onay bekleniyor.*
