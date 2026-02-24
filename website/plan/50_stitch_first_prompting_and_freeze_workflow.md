# Stitch-First Prompting + Freeze Workflow (Founder Mode)

Tarih: 2026-02-24
Durum: V1 (Faz 1 tasarim uygulama rehberi)

## 1. Amac

Google Stitch kullanarak hizli ekran uretmek, ama sonucu profesyonel ve tutarli hale getirmek.

Bu dokuman:
- prompt yazma formatini
- ekran freeze kuralini
- review ve handoff disiplinini
tanimlar.

## 2. Ana Kural

Stitch hiz icin var.
Kalite ise su uc seyden gelecek:
- token disiplini (`44`)
- visual direction (`37`)
- review checklist (`41`)

Faz 1 uygulama hiz kuralı:
- Stitch kullanilacaksa mumkunse cikti formati `React functional component + Tailwind utility classes` istenir
- Saf HTML/CSS cikti yalnizca referans/ilham icin kullanilir

## 3. Stitch Prompt Format (sablon)

Her ekran promptu su parcali formatla yazilir:

1. Ekran amaci
2. Hedef kullanici
3. Bilgi hiyerarsisi (en ustte ne gorunecek?)
4. Ana CTA
5. Stil kisitlari (modern/premium/apple-like ama kopya degil)
6. Anti-patternler (ERP/muhasebe hissi yok)
7. Teknik kisitlar (web panel, map varsa split-pane vs.)
8. Cikti formati tercihi (React/Tailwind component vs. image mockup)

## 3.1 Reference-Driven Mod (onerilen)

Eger Stitch ciktisi generic veya yetersiz guzel gelirse, referans vererek promptlamak tercih edilir.

Kural:
- Referans vermek kalite aracidir.
- Referanslar yon vermek icindir, birebir kopyalama icin degil.

Pratik kullanim:
1. `2-4` referans sec
2. Her referans icin "neyi begendigini" yaz (layout / spacing / tipografi / nav / kart hissi)
3. "Neyi kopyalamayacagini" da yaz (renk, logo, branding, exact component shape)

Not:
- Stitch image reference destekliyorsa gorsel + metin aciklama birlikte kullan
- Desteklemiyorsa referansi metinle cozumleyip prompta ekle

## 3.2 Referans Aciklama Bloku (prompta eklenecek)

```text
Reference direction (do not copy directly):
- Reference A: [what to borrow]
- Reference B: [what to borrow]
- Reference C: [what to borrow]

Do not copy:
- exact colors
- exact branding
- exact component shapes
- icons/logos
```

## 4. Prompt Sablonu (copy/paste)

```text
Design a modern premium web app screen for [SCREEN NAME].

Product context:
- Transportation/service operations SaaS (Turkey-first)
- Users: [company dispatcher / company admin / individual driver]
- Style: Apple-like quality feel (clean, spacious, disciplined), but not copying Apple UI

Screen goal:
- [What the user should accomplish on this screen]

Information hierarchy:
1. [Most important block]
2. [Second block]
3. [Third block]

Primary action:
- [Main CTA]

Requirements:
- Clean typography hierarchy
- Spacious layout
- Minimal but premium cards
- Clear status badges/chips
- Professional SaaS look (not ERP/accounting dashboard)
- Light theme first

Avoid:
- Dense tables everywhere
- Rainbow cards
- Tiny text
- Generic bootstrap-style login/form look
- Too many filters

Output:
- Desktop web layout first (1440px)
- Include empty/loading/error state ideas
- If possible, output as React functional component with Tailwind-style classes (not plain HTML/CSS mockup)
```

## 4.1 Referansli Prompt Sablonu (copy/paste)

```text
Design a modern premium web app screen for [SCREEN NAME].

Product context:
- Transportation/service operations SaaS (Turkey-first)
- Users: [company dispatcher / company admin / individual driver]
- Style: Apple-like quality feel (clean, spacious, disciplined), but not copying Apple UI

Screen goal:
- [What the user should accomplish on this screen]

Information hierarchy:
1. [Most important block]
2. [Second block]
3. [Third block]

Primary action:
- [Main CTA]

Reference direction (do not copy directly):
- Reference A: [what to borrow]
- Reference B: [what to borrow]
- Reference C: [what to borrow]

Do not copy:
- exact colors
- exact branding
- exact component shapes
- icons/logos

Requirements:
- Clean typography hierarchy
- Spacious layout
- Minimal but premium cards
- Clear status badges/chips
- Professional SaaS look (not ERP/accounting dashboard)
- Light theme first

Avoid:
- Dense tables everywhere
- Rainbow cards
- Tiny text
- Generic bootstrap-style login/form look
- Too many filters

Output:
- Desktop web layout first (1440px)
- Include empty/loading/error state ideas
- If possible, output as React functional component with Tailwind-style classes (not plain HTML/CSS mockup)
```

## 5. Ekran Bazli Prompt Baslangiclari (Faz 1)

### 5.1 Login Screen

Ek not ekle:
- Include email/password and Google sign-in
- Premium but calm composition
- Trustworthy and modern
- One side visual/brand panel is allowed, but keep it subtle

### 5.2 Mode Selector

Ek not ekle:
- Two mode cards: Company Mode / Individual Driver Mode
- Strong hierarchy, easy decision in under 3 seconds

### 5.3 Company Selector

Ek not ekle:
- Company list cards or clean table/list hybrid
- Search and quick select
- Last used company highlighted

### 5.4 Panel Shell

Ek not ekle:
- Sidebar navigation, top bar, page header region, content canvas
- Navigation should feel premium, not enterprise-legacy

### 5.5 Company Dashboard Shell

Ek not ekle:
- KPI cards + activity summary + quick actions
- No finance/accounting vibe

### 5.6 Individual Driver Dashboard Shell

Ek not ekle:
- Today's route/trip status
- Next action and route summary
- Simpler than company dashboard

## 6. Stitch Sonrasi Temizleme (zorunlu)

Stitch sonucu geldiginde hemen sunlari kontrol et:
1. Tek ana CTA var mi?
2. Fontlar cok kucuk mu?
3. Kart sayisi gereksiz fazla mi?
4. Renkler fazla mi?
5. Header/nav kalabalik mi?
6. ERP/muhasebe hissi var mi?

Varsa:
- yeniden promptla
- veya elde sadelestir (freeze notuna isle)

Ek kural:
- 2 tur sonunda kalite dusukse referansli prompt moduna gec (zorunlu)

## 7. Freeze Artifact Kurali

Kodlamaya gecmeden once her ekran icin su dosyalar hazir:
- final export image (`PNG`)
- notlar (`MD` veya Figma notes)
- state listesi (loading/empty/error)
- token sapma notu (varsa)

Onerilen adlandirma:
- `F1-LOGIN-v01.png`
- `F1-LOGIN-v01-notes.md`
- `F1-SHELL-v02.png`

## 8. Figma Ne Zaman Gerekir?

Asagidaki durumlarda Figma'ya gecis siddetle onerilir:
- component tekrar sayisi artarsa
- ekipte ikinci kisi UI'ya dokunacaksa
- handoff karmasiklasirsa
- responsive varyantlar artarsa
- live ops map/drawer patternleri cogalirsa

## 9. Faz 1 Basari Kriteri

Faz 1 tasarim basarili sayilirsa:
- 6 temel ekran freeze edildi
- token uyumsuzluklari not edildi
- review checklistten gecti
- kodlamaya hazir shell/auth UI omurgasi cikti

## 10. Referanslar

- `37_visual_design_direction_apple_like_modern.md`
- `41_design_quality_review_and_handoff_checklist.md`
- `44_design_tokens_v1_numeric_table.md`
- `49_shell_auth_design_scope_freeze.md`
- `52_reference_collection_and_reference_driven_prompting.md`
