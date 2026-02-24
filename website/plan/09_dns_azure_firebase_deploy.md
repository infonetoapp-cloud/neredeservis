# DNS + Azure SWA + Firebase Deploy Checklist (MVP-Cut Revision)

Tarih: 2026-02-24
Durum: Plan / uygulama checklist

Not:
- Domain registrar: `name.com`
- DNS yonetimi: `Cloudflare` (bagli)

## 1. Hedef Domain Yapisi (MVP)

MVP domainleri:
- `neredeservis.app` -> marketing/landing (aynı Next.js app icinde)
- `www.neredeservis.app` -> root redirect
- `app.neredeservis.app` -> panel (aynı SWA + same app, route-level handling)

Opsiyonel/faz sonrasi:
- `r.neredeservis.app` -> share landing
- `api.neredeservis.app` -> HTTP admin API proxy/public edge

## 2. Cloudflare Tarafi (DNS + SSL)

### 2.1 Zone temel ayarlari
- [ ] Cloudflare zone aktif
- [ ] SSL/TLS mode = `Full (strict)` (hedef)
- [ ] Always Use HTTPS = on
- [ ] Automatic HTTPS Rewrites = on

### 2.2 DNS kayit plani (MVP, tek SWA)
- [ ] `@` (apex/root) -> Azure SWA custom domain yonlendirme talimatina gore
- [ ] `www` -> root'a redirect (Cloudflare rule)
- [ ] `app` -> ayni Azure SWA custom domain kaydi (panel host alias)

Not:
- Azure SWA dogrulama icin TXT/CNAME isteyebilir; Azure ekranindaki degerler esas alinacak.
- Hem `@` hem `app` ayni SWA'ya baglanabilir; route/auth davranisi uygulama icinde yonetilir.

### 2.3 Cloudflare guvenlik (MVP)
- [ ] WAF managed rules (basic)
- [ ] Bot Fight Mode (ihtiyaca gore)
- [ ] Security Level = Medium (baslangic)
- [ ] Caching kurallari sadece static varliklar icin

## 3. Azure Static Web Apps Kurulum Stratejisi (revize)

### 3.1 Proje modeli (MVP default)

Secenek A (MVP onerilen):
- Tek SWA Project: `neredeservis-web`
- Tek Next.js app: marketing + dashboard route groups

Neden:
- solo-founder delivery hizi
- tek CI/CD pipeline
- tek env seti / daha az drift riski
- preview/prod ayrimi SWA ile zaten mevcut

Secenek B (post-pilot split):
- landing ve panel ayri SWA'lara ayrilir

Triggerler:
- deploy cadence ayrisir
- marketing release'leri paneli bozuyor
- build/bundle complexity artiyor

## 3.2 Plan seviyesi

Dev/staging/demo:
- [ ] Azure Student subscription + SWA Free

Production (pilot acilmadan once):
- [ ] Pay-As-You-Go subscription + SWA Standard

## 3.3 Ortamlar (tek SWA)

- [ ] preview (generated domains)
- [ ] production

Not:
- staging disiplini icin once SWA preview domainleri kullan
- custom staging domain ancak net ihtiyac olursa ac

## 4. GitHub Entegrasyon (Deploy)

- [ ] GitHub repo baglanti
- [ ] Branch strategy:
  - `main` -> prod deploy
  - `develop` (opsiyonel) -> preview/staging workflow
- [ ] Build command tanimi
- [ ] Output path tanimi (frameworke gore)
- [ ] Required secrets/env tanimi

## 5. Firebase Backend Entegrasyon (Web)

## 5.1 Firebase environment mapping
- [ ] web-dev/preview -> firebase dev
- [ ] web-staging preview (gerekiyorsa) -> firebase stg
- [ ] web-prod -> firebase prod

## 5.2 Web env vars (taslak)

Public vars:
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- [ ] `NEXT_PUBLIC_MAPBOX_TOKEN`
- [ ] `NEXT_PUBLIC_APP_ENV`

Server-only vars (web server/route handlers kullanilirsa):
- [ ] admin API base URL / secrets (gerekirse)
- [ ] signing secrets (gerekirse)

## 5.3 CORS / origin allow-list

- [ ] `https://neredeservis.app`
- [ ] `https://app.neredeservis.app`
- [ ] preview domainleri (Azure SWA generated domains) - sadece dev/stg

## 5.4 Region uyumu (kritik, review sonrasi ek)

- [ ] Azure SWA region secimi Firebase backend regionlarina yakin secildi (EU odakli)
- [ ] Firebase Functions/Firestore region listesi not edildi
- [ ] Cross-region latency smoke olcum plani var

Kural:
- "premium hiz" hedefi icin region uyumu plansiz birakilmaz

## 6. Share Link / Canonical Domain Gecis Plani

Mevcut durumda backendde eski domain hard-code alanlari var (plan notu).

Yapilacak:
- [ ] canonical web domain config degeri tanimla
- [ ] `nerede.servis` hard-code -> config tabanli hale getir
- [ ] share link ve route preview URL'lerini yeni domain stratejisine tasiyacak migration plani yaz

MVP icin gecici karar:
- [ ] `neredeservis.app/r/{srvCode}` kullan

## 7. Maliyet Guvenlik Agi (ilk gunden)

Azure:
- [ ] Cost budget (dusuk limit)
- [ ] 50% / 80% / 100% alert

Firebase:
- [ ] Billing budget alert
- [ ] Functions/RTDB/Firestore basic monitoring

Mapbox:
- [ ] usage dashboard kontrol rutini
- [ ] monthly cap / rate-limit aktiflik dogrulamasi

## 8. Canliya Cikmadan Once Gate (web MVP)

- [ ] custom domainler calisiyor
- [ ] HTTPS dogru
- [ ] login akisi calisiyor
- [ ] panel authz policy smoke test
- [ ] canli takip ekrani read modeli dogrulandi
- [ ] rota/durak mutasyon audit kaydi dogrulandi
- [ ] cost alerts aktif
- [ ] region latency smoke kabul edilebilir

## 9. Sonraki Dokuman Baglantisi

Bu checklistten sonra teknik uygulama planina gecilecek:
- web app repo yapisi
- endpoint backlog
- UI information architecture
