# Stitch Prompts Pack (Faz 1) - Login, Mode Selector, Panel Shell

Tarih: 2026-02-24
Durum: V1 (Founder execution pack)

## 1. Amac

Bu dokuman, Faz 1 tasarim baslangici icin Google Stitch'te kullanilacak ilk promptlari hazir verir.

Hedef:
- hizli baslamak
- dogru yone gitmek
- premium/panel karakterini erken oturtmak

Referanslar:
- `37_visual_design_direction_apple_like_modern.md`
- `44_design_tokens_v1_numeric_table.md`
- `49_shell_auth_design_scope_freeze.md`
- `50_stitch_first_prompting_and_freeze_workflow.md`

## 2. Kullanım Talimati (kisa)

Her ekran icin:
1. Ana prompt ile basla
2. 2-4 varyasyon al
3. En iyi varyasyonu sec
4. Revizyon promptlari ile sadeleştir / iyilestir
5. Freeze export al

Kural:
- Ilk varyasyonda "mukemmel" bekleme
- 2-3 revizyon turu normaldir
- Zayif/generic sonuc alirsan referansli prompt moduna gec

## 2.1 Referansli Kullanim (onerilen)

Stitch sonucu guzel degilse veya template hissi veriyorsa, her ekran promptuna referans blogu ekle.

Prompta eklenecek blok:

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

Not:
- Referans verirken sadece link/gorsel degil, "neyi begendigini" de yaz.
- 2 basarisiz turdan sonra referansli moda gecmek standart davranis.

## 3. Prompt 01 - Login Screen (Web, Premium, Google Sign-In dahil)

### 3.1 Ana Prompt (EN - onerilen)

```text
Design a modern premium login screen for a transportation/service operations SaaS web app.

Product context:
- Turkey-first SaaS for service companies and individual drivers
- Users can log in as company operators or individual drivers
- This is a web app, not a mobile app

Style direction:
- Apple-like quality feel (clean, spacious, disciplined) but not copying Apple UI
- Premium, trustworthy, modern
- Light theme first
- Professional SaaS look, not ERP/accounting dashboard style

Layout requirements:
- Desktop-first (1440px)
- Email and password login form
- Google sign-in button integrated elegantly
- "Forgot password" and "Sign in" primary CTA
- Optional subtle brand/visual panel on one side (calm, minimal, not noisy)
- Clean headline and subtext

Visual requirements:
- Spacious layout with strong typography hierarchy
- Minimal but premium card/surface treatment
- Soft shadows, subtle borders
- Clear focus states for inputs/buttons

Avoid:
- Generic bootstrap login card look
- Heavy gradients, neon effects, glassmorphism spam
- Dense text blocks
- Tiny fonts
- Too many form elements

Output:
- Include empty/default state
- Suggest loading and error state variations
```

### 3.1.1 Login icin Referans Notu (prompta ekle)

Referans verirken sunlari ayir:
- Referans A: sayfa kompozisyonu (sol/sag panel dengesi)
- Referans B: form card spacing / input hiyerarsisi
- Referans C: premium ama sade his (renk degil, ritim)

### 3.2 Revizyon Promptlari (Login)

#### A. Daha premium ve sade

```text
Refine this login screen to feel more premium and calm.
Increase whitespace, simplify the visual panel, reduce clutter, and strengthen typography hierarchy.
Keep it modern and trustworthy.
```

#### B. ERP hissini kes

```text
This still feels too enterprise/ERP. Redesign it to feel more modern consumer-grade premium SaaS.
Use fewer boxed sections, cleaner spacing, and a more elegant composition.
```

#### C. Google butonunu entegre et

```text
Integrate the Google sign-in button more naturally into the layout.
It should follow brand guidelines but still match the premium visual style of the page.
```

### 3.3 Login Freeze Kontrolu

Freeze etmeden kontrol et:
- Tek ana CTA net mi?
- Google sign-in butonu siritiyor mu?
- Fontlar yeterince buyuk mu?
- Form alanlari rahat mi?
- "Template login" hissi kaldı mi?

## 4. Prompt 02 - Mode Selector (Company vs Individual Driver)

### 4.1 Ana Prompt (EN - onerilen)

```text
Design a modern premium mode selection screen for a transportation/service operations SaaS web app.

Screen goal:
- After login, users choose between two modes:
  1) Company Mode
  2) Individual Driver Mode

Product context:
- Company mode is for company owners/admins/dispatchers to manage drivers, vehicles, routes, and live operations
- Individual driver mode is for independent drivers managing their own routes and trips

Style direction:
- Apple-like quality feel (clean, spacious, disciplined), not copied
- Premium, modern, calm, professional
- Light theme first
- Not an ERP/accounting dashboard

Layout requirements:
- Desktop-first (1440px)
- Strong page title and short explanatory subtitle
- Two prominent mode cards with clear hierarchy and quick decision UX (under 3 seconds)
- Each card should include:
  - title
  - short description
  - key benefits / capabilities
  - CTA (Select / Continue)
- Optional "last used mode" subtle indicator

Visual requirements:
- Spacious composition
- Minimal premium cards
- Clear active/hover states
- Strong typography hierarchy

Avoid:
- Equal-weight cluttered cards with too much text
- Loud colors
- Generic dashboard card grid style

Output:
- Include default, hover, selected, disabled/loading ideas
```

### 4.1.1 Mode Selector icin Referans Notu (prompta ekle)

Referans verirken sunlari ayir:
- Referans A: iki secim kartinin hiyerarsisi
- Referans B: sakin premium card/surface hissi
- Referans C: hizli karar UX'i (3 saniyede anlasilabilir)

### 4.2 Revizyon Promptlari (Mode Selector)

#### A. Karari hizlandir

```text
Refine this mode selector so the decision feels obvious in under 3 seconds.
Increase hierarchy, reduce text, and make the two choices more distinct without using loud colors.
```

#### B. Daha premium kartlar

```text
Make the mode cards feel more premium and less like generic dashboard tiles.
Use cleaner spacing, better typography hierarchy, and subtle surface depth.
```

#### C. Son kullanilan mod vurgusu

```text
Add a subtle "last used mode" indication that helps returning users without dominating the screen.
```

### 4.3 Mode Selector Freeze Kontrolu

Freeze etmeden kontrol et:
- 2 mod arasindaki fark 3 saniyede anlasiliyor mu?
- Kartlar "dashboard tile" gibi mi duruyor?
- Fazla metin var mi?
- Hover/selected state yeterince belirgin mi?

## 5. Prompt 03 - Panel Shell (Sidebar + Topbar + Page Header + Canvas)

### 5.1 Ana Prompt (EN - onerilen)

```text
Design a modern premium web app shell layout for a transportation/service operations SaaS admin panel.

Screen goal:
- Establish the core panel layout system used across all pages
- Include sidebar navigation, top bar, page header area, and content canvas

Product context:
- Multi-tenant SaaS for service companies and individual drivers
- Company users manage drivers, vehicles, routes, stops, and live operations
- The panel should feel premium and modern, not legacy enterprise ERP

Style direction:
- Apple-like quality feel (clean, disciplined, spacious), not copied
- Light theme first
- Professional and operational
- Strong information hierarchy

Layout requirements:
- Desktop-first (1440px)
- Left sidebar or nav rail with clear active states
- Top bar with user/account area and context actions
- Page header region (title, subtitle, primary action, optional filters)
- Large flexible content canvas area
- Example placeholder content blocks to show layout rhythm

Visual requirements:
- Premium navigation feel (not heavy enterprise)
- Spacious spacing system
- Clear surfaces and subtle borders/shadows
- Strong typography hierarchy for page title and labels
- Reusable shell pattern suitable for dashboards, tables, forms, and live ops pages

Avoid:
- Overly dense nav
- Too many icons
- Dark-mode-only aesthetic
- Old-fashioned enterprise admin panel look
- Excessive gradients or flashy effects

Output:
- Show default shell state
- Suggest compact/tablet shell variant idea
- Include active nav item and page action examples
```

### 5.1.1 Panel Shell icin Referans Notu (prompta ekle)

Referans verirken sunlari ayir:
- Referans A: sidebar spacing + active state kalitesi
- Referans B: topbar/page header hiyerarsisi
- Referans C: content canvas ritmi / premium admin shell hissi

### 5.2 Revizyon Promptlari (Panel Shell)

#### A. Nav'i premiumlestir

```text
Refine the navigation to feel more premium and modern.
Reduce visual noise, improve spacing, and make active/hover states elegant and clear.
```

#### B. Canvas ritmini iyilestir

```text
Improve the content canvas rhythm with better spacing and clearer page header hierarchy.
It should feel calm, structured, and ready for complex operational screens.
```

#### C. ERP hissini azalt

```text
This still feels too enterprise admin/ERP.
Redesign the shell with fewer harsh separators, cleaner surfaces, and a more modern premium layout composition.
```

### 5.3 Panel Shell Freeze Kontrolu

Freeze etmeden kontrol et:
- Sidebar kalabalik mi?
- Active nav state premium mi, yoksa fazla sert mi?
- Page header alaninda hiyerarsi net mi?
- Canvas "sikisik admin panel" gibi duruyor mu?
- Bu shell ustune dashboard/table/form koymak kolay gorunuyor mu?

## 6. Prompt Kullanirken Ek Teknik Notlar

- Stitch bazen fazla generic UI verir; normal.
- "premium", "spacious", "not ERP/accounting", "clean hierarchy" ifadelerini tekrar etmek faydali.
- 1440px desktop isteyip sonra 1280 varyasyon istemek daha iyi sonuc verir.
- Referansli promptta en onemli kisim "what to borrow" aciklamasidir.

## 7. Sana Ozel Ilk Calisma Sirasi (bugun)

1. Login Screen (2-4 varyasyon)
2. Mode Selector (2 varyasyon)
3. Panel Shell (3 varyasyon)

Sonra bana getir:
- her ekran icin 1 secilen varyasyon
- hangi noktalari sevmedigini 2-3 madde

Ben sana revizyon promptlarini ozellestiririm.
