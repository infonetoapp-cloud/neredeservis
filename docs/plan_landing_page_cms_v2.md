# Landing Page v2 — Mühendislik Planı

> **Tarih:** 4 Mart 2026  
> **Durum:** Plan aşaması — "başla" komutuyla kodlamaya geçilecek  
> **Mimari Kararı:** Mevcut client-side callable yapısı korunur. Firebase Admin eklenmez. ISR kullanılmaz.

---

## Mimari Prensipler

| Prensip | Uygulama |
|---------|----------|
| **Mevcut pattern'e sadakat** | Tüm platform sayfaları `"use client"` + callable — aynı kalır |
| **Tek dosya ≤ 200 satır** | Her section ayrı dosya, her CMS formu ayrı dosya |
| **Type-first** | Shared tip dosyası, backend + frontend aynı kontratı kullanır |
| **Fallback-first render** | Config yüklenene kadar hardcoded default gösterilir — flash yok |
| **Backend mutation only** | Firestore rules `write: if false` — tüm yazma callable üzerinden |
| **Bağımsız deploy** | Her faz sonunda çalışan, deploy edilebilir, önceki fazları bozmayan kod |

---

## FAZ 0 — Shared Tipler + Fallback Config
**Bağımlılık:** Yok  
**Deploy:** Gerekmez (sadece dosya oluşturma)  
**Amaç:** Tüm fazların paylaşacağı tek kaynak tip dosyası ve varsayılan config

### Dosyalar

| # | Dosya | Satır | Açıklama |
|---|-------|-------|----------|
| 0.1 | `src/components/marketing/landing-config-types.ts` | ~100 | `LandingPageConfig` interface — tüm bölümler için tip tanımı |
| 0.2 | `src/components/marketing/landing-default-config.ts` | ~180 | `DEFAULT_LANDING_CONFIG` sabiti — hardcoded Türkçe içerik |
| 0.3 | `src/components/marketing/landing-icon-map.ts` | ~40 | Lucide ikon adı → component mapping (tree-shake safe, ~30 ikon) |

### Tasarım Kararları

**Tip dosyası neden tek?**
- Backend Zod şeması bu tipi referans alır
- Frontend section'lar bu tipi referans alır
- CMS formları bu tipi referans alır
- Tek kaynak = senkronizasyon sorunu yok

**Fallback config neden ayrı dosya?**
- `page.tsx` ilk render'da bunu kullanır (Firestore sorgusu bitmeden)
- CMS'de "Sıfırla" butonu bunu kullanır
- Test'lerde fixture olarak kullanılır

**İkon map neden var?**
- `import * as LucideIcons` → bundle'ı 400KB+ şişirir
- Whitelist map: sadece 30 transport/business ikonunu tutar
- Admin'de ikon seçici bu listeyi döner, frontend bu map'ten render eder

---

## FAZ 1 — Landing Page Light Redesign (Statik)
**Bağımlılık:** Faz 0  
**Deploy:** Evet — aydınlık tema canlıya alınır  
**Amaç:** Mevcut koyu sayfayı aydınlık temaya çevirmek. Henüz CMS yok, `DEFAULT_LANDING_CONFIG` kullanılır.

### Tasarım Sistemi — Aydınlık Tema

| Token | Renk | Kullanım |
|-------|------|----------|
| Sayfa zemini | `white` / `slate-50` (alternating) | Ana arka plan |
| Kart | `white` + `border-slate-200` | Feature/pricing kartları |
| Başlık | `slate-900` | H1, H2, H3 |
| Paragraf | `slate-600` | Body text |
| Soluk | `slate-400` | Label, helper text |
| Kenar | `slate-200` | Border, divider |
| Marka | `teal-600` | CTA, ikon, vurgu |
| Marka açık | `teal-50` / `teal-100` | İkon background bubble |
| CTA gradient | `teal-600 → teal-700` | Primary butonlar |
| CTA bölümü | `teal-700 → teal-900` | Bottom CTA bandı (koyu kontrast) |
| Footer | `slate-900` | Footer zemini (koyu kontrast) |

### Dosyalar — Her Section Ayrı Component

| # | Dosya | Satır | Props | Açıklama |
|---|-------|-------|-------|----------|
| 1.1 | `src/components/marketing/sections/landing-navbar.tsx` | ~70 | `navbar: NavbarConfig` | Fixed navbar, logo + linkler + CTA |
| 1.2 | `src/components/marketing/sections/landing-hero.tsx` | ~80 | `hero: HeroConfig` | Badge, headline, subtitle, CTA'lar |
| 1.3 | `src/components/marketing/sections/landing-stats.tsx` | ~35 | `stats: StatItem[]` | Stat bar — 4'lü grid |
| 1.4 | `src/components/marketing/sections/landing-product-preview.tsx` | ~50 | `preview: ProductPreviewConfig` | Browser mockup + screenshot |
| 1.5 | `src/components/marketing/sections/landing-features.tsx` | ~65 | `features: FeaturesConfig` | 6 kart, 3×2 grid, ikon + açıklama |
| 1.6 | `src/components/marketing/sections/landing-how-it-works.tsx` | ~55 | `howItWorks: HowItWorksConfig` | 3 adım, ikon + açıklama |
| 1.7 | `src/components/marketing/sections/landing-pricing.tsx` | ~90 | `pricing: PricingConfig` | 3 plan kartı, özellik listeleri |
| 1.8 | `src/components/marketing/sections/landing-bottom-cta.tsx` | ~50 | `bottomCta: BottomCtaConfig` | Koyu CTA bandı |
| 1.9 | `src/components/marketing/sections/landing-footer.tsx` | ~70 | `footer: FooterConfig` | 4 sütun footer |
| 1.10 | `src/components/marketing/landing-page-renderer.tsx` | ~50 | `config: LandingPageConfig` | Tüm section'ları sırayla render eder |
| 1.11 | `src/app/(marketing)/page.tsx` | ~30 | — | Server component: metadata + renderer |

**Toplam: 11 dosya, ~645 satır**

### Neden bu yapı?

```
page.tsx (30 satır)
  └─ metadata export (SEO — statik, DEFAULT_CONFIG'ten)
  └─ <LandingPageRenderer config={DEFAULT_LANDING_CONFIG} />
       ├─ <LandingNavbar navbar={config.navbar} />
       ├─ <LandingHero hero={config.hero} />
       ├─ <LandingStats stats={config.stats} />
       ├─ <LandingProductPreview preview={config.productPreview} />
       ├─ <LandingFeatures features={config.features} />
       ├─ <LandingHowItWorks howItWorks={config.howItWorks} />
       ├─ <LandingPricing pricing={config.pricing} />
       ├─ <LandingBottomCta bottomCta={config.bottomCta} />
       └─ <LandingFooter footer={config.footer} />
```

- Her section 35-90 satır — bakımı kolay
- Section eklemek/silmek renderer'dan tek satır
- Her section sadece kendi config dilimini alır — gereksiz re-render yok
- CMS bağlantısı gelince (Faz 3) sadece `page.tsx` değişir: `DEFAULT` yerine Firestore verisi

### Deploy Sonucu
Ziyaretçiler aydınlık, profesyonel, ferah bir ana sayfa görür. İçerik hâlâ hardcoded ama modüler yapıda.

---

## FAZ 2 — Backend CMS API
**Bağımlılık:** Faz 0 (tip dosyası)  
**Deploy:** Evet — fonksiyonlar + rules Firebase'e deploy edilir  
**Amaç:** Admin panelinin kullanacağı okuma/yazma API + Storage kuralları

### Dosyalar

| # | Dosya | Satır | Açıklama |
|---|-------|-------|----------|
| 2.1 | `functions/src/schemas/landing_config_schema.ts` | ~80 | Zod validation — `LandingPageConfig` için |
| 2.2 | `functions/src/callables/platform_landing_callables.ts` | ~70 | `platformGetLandingConfig` + `platformUpdateLandingConfig` |
| 2.3 | `functions/src/index.ts` | +8 satır | Yeni callable'ları register et |
| 2.4 | `firestore.rules` | +5 satır | `site_config/{docId}` → read: true, write: false |
| 2.5 | `storage.rules` | +8 satır | `site_media/{allPaths=**}` → read: true, write: platform owner |

**Toplam: 3 yeni dosya + 2 güncelleme, ~171 satır**

### Callable Detayları

#### `platformGetLandingConfig`
```
Guard:   requireAuth → requireNonAnonymous → requirePlatformOwner
Input:   {} (boş)
İş:      db.doc("site_config/landing_page").get()
Output:  apiOk({ exists: boolean, config: LandingPageConfig | null })
```

#### `platformUpdateLandingConfig`
```
Guard:   requireAuth → requireNonAnonymous → requirePlatformOwner
Input:   { config: Partial<LandingPageConfig> }
Valid:   Zod schema ile doğrula (string max length, array max size, URL format)
İş:      db.doc("site_config/landing_page").set({
           ...validatedConfig,
           updatedAt: serverTimestamp(),
           updatedBy: auth.uid
         }, { merge: true })
Output:  apiOk({ success: true })
```

### Zod Validation Kuralları
- Tüm string alanlar `.max(500)` — XSS ve abuse önlenir
- URL alanlar `.url().or(z.literal(""))` — boş veya geçerli URL
- `features.items` → `.max(12)` — sonsuz kart ekleme yok
- `pricing.plans` → `.max(6)` — makul plan sayısı
- `stats` → `.max(8)`
- `howItWorks.steps` → `.max(6)`
- `footer.columns` → `.max(5)`
- `navbar.links` → `.max(8)`

### Storage Kuralı
```
/site_media/{allPaths=**}
  read:  if true                              // Public site görselleri
  write: if request.auth != null
      && request.auth.uid == "PLATFORM_OWNER_UID_BURAYA"
      && request.resource.size < 5 * 1024 * 1024
      && request.resource.contentType.matches('image/.*')
```

### Deploy Komutu
```bash
npx firebase deploy --only functions:platformGetLandingConfig,functions:platformUpdateLandingConfig,firestore:rules,storage
```

### Deploy Sonucu
Backend hazır, CMS formları API'yi çağırabilir. Landing page henüz statik config kullanmaya devam eder.

---

## FAZ 3 — Landing Page → Firestore Bağlantısı
**Bağımlılık:** Faz 1 + Faz 2  
**Deploy:** Evet — landing page artık Firestore'dan dinamik içerik gösterir  
**Amaç:** `page.tsx`'i Firestore'a bağlamak — config varsa onu kullan, yoksa fallback

### Dosyalar

| # | Dosya | Satır | Açıklama |
|---|-------|-------|----------|
| 3.1 | `src/features/platform/platform-landing-client.ts` | ~30 | `fetchLandingConfig()` + `saveLandingConfig()` callable wrapper'ları |
| 3.2 | `src/components/marketing/landing-page-live.tsx` | ~55 | Client component: Firestore'dan fetch + merge + render |
| 3.3 | `src/app/(marketing)/page.tsx` | güncelleme | Server metadata korunur, body `<LandingPageLive />` olur |

**Toplam: 2 yeni dosya + 1 güncelleme, ~85 satır**

### Veri Akışı

```
page.tsx (server component)
  ├─ export metadata (SEO — statik DEFAULT'tan)
  └─ <LandingPageLive />  (client component)
       │
       ├─ useState: config = DEFAULT_LANDING_CONFIG  ← İlk render (anında)
       ├─ useEffect: fetchLandingConfig()
       │     ├─ Başarılı → setState(firestoreConfig)  ← Dinamik içerik
       │     └─ Hata/boş → config olduğu gibi kalır   ← Fallback
       │
       └─ <LandingPageRenderer config={config} />
              ├─ <LandingNavbar />
              ├─ <LandingHero />
              ├─ ... (tüm section'lar)
              └─ <LandingFooter />
```

### Neden client-side fetch?
1. **Mevcut mimari** — projenin hiçbir yerinde Firebase Admin yok
2. **Complexity budget** — Admin SDK + service account + env var eklenmez
3. **Performans** — Fallback anında render olur, Firestore verisi ~200ms'de gelir
4. **SEO** — Metadata zaten statik export, Google botu title/description'ı görür
5. **Tutarlılık** — Platform sayfaları da aynı pattern: client fetch + loading state

### Deploy Sonucu
Admin henüz CMS yapmamışsa → ziyaretçi default (hardcoded) içeriği görür.  
Admin Firestore'a config yazdıysa → ziyaretçi dinamik içeriği görür.  
Sayfa her iki durumda da çalışır — zero-downtime geçiş.

---

## FAZ 4 — Admin CMS: Ortak Bileşenler
**Bağımlılık:** Faz 0  
**Deploy:** Gerekmez (henüz sayfa yok, sadece component dosyaları)  
**Amaç:** CMS form bölümlerinin paylaşacağı reusable bileşenler

### Dosyalar

| # | Dosya | Satır | Açıklama |
|---|-------|-------|----------|
| 4.1 | `src/components/platform/landing/cms-image-uploader.tsx` | ~110 | Drag-drop / click, Firebase Storage upload, progress, preview, sil |
| 4.2 | `src/components/platform/landing/cms-icon-picker.tsx` | ~90 | Lucide ikon listesi, search, seçili preview |
| 4.3 | `src/components/platform/landing/cms-sortable-list.tsx` | ~80 | Generic drag-and-drop sıralama wrapper (feature/plan/stat/link listeleri) |
| 4.4 | `src/components/platform/landing/cms-section-wrapper.tsx` | ~30 | Accordion-style bölüm container (başlık + collapse + dirty indicator) |
| 4.5 | `src/components/platform/landing/cms-char-counter-input.tsx` | ~25 | Input/textarea + karakter sayacı (SEO alanları için) |

**Toplam: 5 dosya, ~335 satır**

### Bileşen Detayları

#### `cms-image-uploader.tsx`
```
Props: { storagePath: string, currentUrl: string, onUrlChange: (url) => void,
         maxSizeMB?: number, recommendedSize?: string }

- Drag-drop zone + file input
- Client-side validasyon (boyut, format)
- Firebase Storage uploadBytes + getDownloadURL
- Progress bar (%)
- Mevcut görsel thumbnail + "Değiştir" / "Sil" butonları
- Önerilen boyut bilgisi ("1200×630px önerilir")
```

#### `cms-icon-picker.tsx`
```
Props: { value: string, onChange: (iconName) => void }

- ICON_MAP'ten (Faz 0) ikon listesi
- Search/filter input
- Grid layout — her ikon 40×40 buton
- Seçili ikonun üstünde teal border
- Kategori grupları: Ulaşım, İş, Genel
```

#### `cms-sortable-list.tsx`
```
Props: { items: T[], onReorder: (items: T[]) => void,
         renderItem: (item: T, index: number) => ReactNode,
         onAdd: () => void, onRemove: (index: number) => void,
         maxItems?: number, addLabel?: string }

- Up/Down butonları ile sıralama (react-dnd gerektirmez)
- "Ekle" butonu (maxItems kontrolü)
- "Sil" butonu her satırda
- Generic — her liste tipi için kullanılır
```

#### `cms-section-wrapper.tsx`
```
Props: { title: string, children: ReactNode, defaultOpen?: boolean }

- Başlık + chevron toggle
- Collapse/expand animasyonu
- Açık/kapalı state
```

### Deploy Sonucu
Component'ler hazır, Faz 5-6'da kullanılacak.

---

## FAZ 5 — Admin CMS: Basit Form Bölümleri
**Bağımlılık:** Faz 3 (callable wrapper) + Faz 4 (ortak bileşenler)  
**Deploy:** Evet — `/platform/landing` sayfası canlıya alınır  
**Amaç:** SEO, hero, navbar, stats, how-it-works, bottom-cta, footer formları + CMS ana sayfası

### Dosyalar

| # | Dosya | Satır | Açıklama |
|---|-------|-------|----------|
| 5.1 | `src/components/platform/landing/cms-section-seo.tsx` | ~55 | Title (70 char limit) + description (160 char) + OG image upload |
| 5.2 | `src/components/platform/landing/cms-section-navbar.tsx` | ~70 | Logo upload + CTA text/link + sortable nav linkleri |
| 5.3 | `src/components/platform/landing/cms-section-hero.tsx` | ~85 | Badge toggle/text + 2 headline + subtitle + 2 CTA + hero image |
| 5.4 | `src/components/platform/landing/cms-section-stats.tsx` | ~60 | Sortable stat listesi — value + label input'ları |
| 5.5 | `src/components/platform/landing/cms-section-how-it-works.tsx` | ~70 | Section title + sortable step listesi (ikon + title + desc) |
| 5.6 | `src/components/platform/landing/cms-section-bottom-cta.tsx` | ~55 | 2 headline + subtitle + 2 CTA |
| 5.7 | `src/components/platform/landing/cms-section-footer.tsx` | ~75 | Brand desc + sortable sütunlar (her sütun: title + sortable linkler) + copyright |
| 5.8 | `src/components/platform/landing/landing-cms-panel.tsx` | ~120 | Ana CMS container: fetch config + state yönetimi + accordion layout + Kaydet/Sıfırla |
| 5.9 | `src/app/(platform)/platform/landing/page.tsx` | ~15 | Page shell — `<LandingCmsPanel />` render eder |
| 5.10 | `src/components/platform/platform-shell-sidebar.tsx` | güncelleme | Nav items'a "Ana Sayfa" linki ekle |
| 5.11 | `src/components/platform/platform-shell-header.tsx` | güncelleme | Header meta'ya `/platform/landing` ekle |
| 5.12 | `next.config.ts` | güncelleme | `images.remotePatterns` → `firebasestorage.googleapis.com` |

**Toplam: 9 yeni dosya + 3 güncelleme, ~605 satır**

### CMS Panel Akışı (`landing-cms-panel.tsx`)

```
┌─────────────────────────────────────────────┐
│  Ana Sayfa İçerik Yönetimi                  │
│                                             │
│  [Canlı Siteyi Aç ↗]                       │
│                                             │
│  ▾ SEO & Meta Bilgileri                     │
│    ├─ <CmsSectionSeo />                     │
│  ▸ Navbar                                   │
│  ▸ Hero Bölümü                              │
│  ▸ İstatistikler                            │
│  ▸ Nasıl Çalışır                            │
│  ▸ Alt CTA                                  │
│  ▸ Footer                                   │
│                                             │
│  ───────────────────────                    │
│  Son güncelleme: 04.03.2026 14:30           │
│                                             │
│  [💾 Tümünü Kaydet]  [↩ Varsayılana Sıfırla]│
└─────────────────────────────────────────────┘
```

### State Yönetimi

```typescript
// landing-cms-panel.tsx içinde:
const [config, setConfig] = useState<LandingPageConfig>(DEFAULT_LANDING_CONFIG);
const [savedConfig, setSavedConfig] = useState<LandingPageConfig | null>(null);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);

// Fark tespiti (dirty check):
const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig ?? DEFAULT_LANDING_CONFIG);

// Her section'a:
<CmsSectionHero
  value={config.hero}
  onChange={(hero) => setConfig(prev => ({ ...prev, hero }))}
/>

// Kaydet:
await saveLandingConfig(config);
setSavedConfig(config);

// Sıfırla:
setConfig(DEFAULT_LANDING_CONFIG);
```

### Deploy Sonucu
Admin `/platform/landing` sayfasından SEO, hero, navbar, stats, how-it-works, bottom-cta ve footer'ı düzenleyebilir.  
Özellikler ve fiyatlandırma henüz yok (Faz 6).

---

## FAZ 6 — Admin CMS: Karmaşık Form Bölümleri
**Bağımlılık:** Faz 5  
**Deploy:** Evet — CMS tam fonksiyonel  
**Amaç:** Özellik kartları, fiyatlandırma planları, ürün önizleme, müşteri logoları, testimonials

### Dosyalar

| # | Dosya | Satır | Açıklama |
|---|-------|-------|----------|
| 6.1 | `src/components/platform/landing/cms-section-product-preview.tsx` | ~55 | Toggle + screenshot upload + caption |
| 6.2 | `src/components/platform/landing/cms-section-features.tsx` | ~100 | Section title/subtitle + sortable kart listesi (ikon picker + renk seçici + title + desc) |
| 6.3 | `src/components/platform/landing/cms-section-pricing.tsx` | ~120 | Section title/subtitle + sortable plan listesi (her plan: ad + fiyat + suffix + desc + sortable özellik listesi + highlight toggle + CTA) |
| 6.4 | `src/components/platform/landing/cms-section-trusted-by.tsx` | ~60 | Toggle + title + logo listesi (ad + image upload) |
| 6.5 | `src/components/platform/landing/cms-section-testimonials.tsx` | ~80 | Toggle + title + referans listesi (quote + ad + rol + fotoğraf upload) |
| 6.6 | `src/components/marketing/sections/landing-trusted-by.tsx` | ~40 | Frontend: Logo şeridi |
| 6.7 | `src/components/marketing/sections/landing-testimonials.tsx` | ~60 | Frontend: Testimonial kartları |
| 6.8 | `src/components/marketing/landing-page-renderer.tsx` | güncelleme | Yeni section'lar eklenir |
| 6.9 | `src/components/platform/landing/landing-cms-panel.tsx` | güncelleme | Yeni CMS section'lar eklenir |

**Toplam: 7 yeni dosya + 2 güncelleme, ~515 satır**

### Özellik Kartı Formu Detay

Her kart satırı şöyle görünür:
```
┌──────────────────────────────────────────────┐
│ [↑] [↓]  🔵 MapPin  │ Canlı Takip      [🗑] │
│           ────────────────────────────────── │
│           Açıklama: [Tüm araçlarınızı...]    │
│           Renk: [teal ▼]                    │
│           İkon: [MapPin ▼ 🔍]               │
└──────────────────────────────────────────────┘
```

### Fiyatlandırma Plan Formu Detay

Her plan satırı şöyle görünür:
```
┌──────────────────────────────────────────────┐
│ [↑] [↓]  Profesyonel                   [🗑] │
│           ────────────────────────────────── │
│           Fiyat: [₺1.490]  Ek: [/ay]       │
│           Açıklama: [Büyüyen operasyonlar.] │
│           ☑ Vurgulu kart                    │
│           CTA: [Hemen Başla] → [/login]     │
│           ────────────────────────────────── │
│           Özellikler:                        │
│           [25 araç               ] [🗑]     │
│           [Sınırsız rota         ] [🗑]     │
│           [Şoför belge takibi    ] [🗑]     │
│           [+ Özellik ekle]                   │
└──────────────────────────────────────────────┘
```

### Deploy Sonucu
CMS %100 tamamlanmış olur. Admin her bölümü düzenleyebilir.

---

## Faz Özet Tablosu

| Faz | Kapsam | Yeni Dosya | Güncelleme | Satır | Bağımlılık | Deploy |
|-----|--------|-----------|------------|-------|------------|--------|
| 0 | Shared tipler + fallback | 3 | 0 | ~320 | — | Hayır |
| 1 | Landing page aydınlık tema | 11 | 0 | ~645 | Faz 0 | **Evet** |
| 2 | Backend CMS API + rules | 3 | 2 | ~171 | Faz 0 | **Evet** |
| 3 | Landing → Firestore bağlantısı | 2 | 1 | ~85 | Faz 1+2 | **Evet** |
| 4 | CMS ortak bileşenler | 5 | 0 | ~335 | Faz 0 | Hayır |
| 5 | CMS basit form bölümleri | 9 | 3 | ~605 | Faz 3+4 | **Evet** |
| 6 | CMS karmaşık formlar + yeni section'lar | 7 | 2 | ~515 | Faz 5 | **Evet** |
| **Toplam** | | **40** | **8** | **~2.676** | | |

### Bağımlılık Grafiği

```
Faz 0 (Tipler)
  ├── Faz 1 (Landing Page) ──┐
  ├── Faz 2 (Backend API) ───┼── Faz 3 (Firestore Bağlantısı)
  └── Faz 4 (CMS Components) ┘        │
                                       └── Faz 5 (CMS Basit)
                                              │
                                              └── Faz 6 (CMS Karmaşık)
```

**Not:** Faz 1 ve Faz 2 birbirinden bağımsız — paralel geliştirilebilir.

---

## Deploy Sırası

| Sıra | Ne deploy edilir | Komut |
|------|-----------------|-------|
| 1 | Faz 0 + 1: Aydınlık landing page | `pnpm build` → `vercel --prod` |
| 2 | Faz 2: Backend + rules | `firebase deploy --only functions,firestore:rules,storage` |
| 3 | Faz 3: Firestore bağlantısı | `pnpm build` → `vercel --prod` |
| 4 | Faz 4 + 5: CMS panel (basit) | `pnpm build` → `vercel --prod` |
| 5 | Faz 6: CMS panel (karmaşık) | `pnpm build` → `vercel --prod` |

---

## Dosya Büyüklük Denetimi

**Hiçbir dosya 200 satırı geçmez** — proje genelindeki en büyük dosya `landing-default-config.ts` (~180 satır) olacak, o da saf veri.

| Kategori | Dosya Sayısı | Ort. Satır/Dosya |
|----------|------------|-----------------|
| Tip/config | 3 | ~107 |
| Frontend section | 11 | ~56 |
| Backend callable | 3 | ~57 |
| CMS ortak bileşen | 5 | ~67 |
| CMS form bölümü | 12 | ~68 |
| Page/layout | 4 | ~22 |

---

## Risk Matrisi

| Risk | Olasılık | Etki | Azaltma |
|------|---------|------|---------|
| Firestore fetch gecikmesi (>500ms) | Düşük | Orta | Fallback config anında render — kullanıcı farkını hissetmez |
| Büyük görsel upload (>5MB) | Orta | Düşük | Client-side boyut kontrolü + Storage rule limiti |
| Icon map'te eksik ikon | Düşük | Düşük | Fallback: bilinmeyen ikon → `HelpCircle` göster |
| next.config image domain | Düşük | Yüksek | Faz 5'te eklenir — `next/image` Firebase Storage URL'lerini kabul eder |

---

*Plan tamamlandı. "Başla" komutu bekliyor — Faz 0'dan kodlamaya geçilecek.*
