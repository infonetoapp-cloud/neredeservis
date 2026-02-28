# Hosting + Domain + Ops Karari (Oneri)

Tarih: 2026-02-24
Durum: Oneri (uygulama yok)

## 1. Onerilen Topoloji

DNS Provider:
- Cloudflare (onerilen)

Frontend Hosting:
- Azure Static Web Apps (onerilen)

Backend / Data / Auth / Realtime:
- Firebase (mevcut stack)

Source Control + CI + Planlama:
- GitHub

## 2. Domain Yapisi (neredeservis.app)

Onerilen subdomainler:
- `neredeservis.app` -> marketing/landing (public site)
- `www.neredeservis.app` -> `neredeservis.app` redirect
- `app.neredeservis.app` -> web panel (firma + bireysel sofor)
- `r.neredeservis.app` -> route/share preview landing (opsiyonel; alternatif `/r/*`)
- `api.neredeservis.app` -> ileri asamada HTTP admin API reverse proxy (opsiyonel)

Not:
- Mevcut backend paylasim linkleri `nerede.servis` hard-coded gorunuyor.
- Bunu config tabanli hale getirip `neredeservis.app` veya `r.neredeservis.app`'e tasiyacagiz.

## 3. Firebase Hosting mi, Azure Static Web Apps mi?

### Azure Static Web Apps neden uygun (web frontend icin)

- Microsoft ekosistemi icinde kurumsal bir hosting secenegi.
- GitHub entegrasyonu var.
- Free/Standard plan ayrimi net.
- Custom domain + SSL + staging ortam destegi mevcut.
- Ogrenci hesabiyla dev/staging denemeleri icin avantajli olabilir.

### Firebase Hosting neden tamamen elenmedi?

- Mevcut projede zaten kullaniliyor.
- Deep link / route preview gibi statik landingler icin halen is gorebilir.
- Firebase ekosistemi ile yakindan entegre.

### Nihai karar (onerilen)

- Frontend (landing + panel): Azure Static Web Apps
- Firebase Hosting: sadece gecis/fallback veya route preview gecici kullanim (opsiyonel)

Bu karar, senin "Firebase Hosting false positive / hassasiyet" endiseni dikkate alan ve Vercel Hobby ticari kullanim kisitina takilmayan bir yol.

## 4. "Firebase Hosting phishing sayar mi?" endisesi icin pratik not

Kesin kural yok ama risk azaltma onlemleri:
- Net kurumsal icerik (iletisim, gizlilik, KVKK, kullanim kosullari)
- Supheli redirect akislarindan kacma
- Kisa link / cloaking / agresif yonlendirme kullanmama
- Domain ve marka tutarliligi
- HTTPS + dogru DNS + canonical ayarlari

Not:
- Bu risk sadece Firebase'e ozel degil; her hosting/CDN ekosisteminde abuse kontrolleri vardir.
- Ancak endisen yuksekse frontendi Vercel'e almak dogru bir tercih.

## 5. GitHub ne isimize yarar?

GitHub sadece kod depolama degil:
- issue takibi
- roadmap/project board
- PR review
- release notlari
- GitHub Actions (lint/test/build)
- dokuman ve ADR saklama

Oneri:
- Mobil repo ve web plani ayni repoda kalabilir (monorepo baslangici)
- `website/` klasoru icinde plan -> sonra `website/apps/web` gibi buyutulur

## 6. Ogrenci Avantaji (pratik kullanabileceginler)

GitHub Education / Student Pack degisebilir, ama tipik faydalar:
- GitHub Pro (daha iyi GitHub kullanimi)
- Partner kredileri/teklifleri (zamanla degisir)
- Bazi alan adlari / SSL / cloud kredi kampanyalari (donemsel)

Sana en faydali pratik kullanim:
- GitHub Pro + Actions + Codespaces (gerektiginde)
- Ogrenci kredisi gelen cloud teklifleri varsa staging/observability icin kullanmak
- Ama ana backend zaten Firebase oldugu icin "her seyi cloud krediyle tasimaya" zorlama yapma

## 7. Azure Ogrenci ve Uretim Notu (kritik)

- Azure for Students, ogrenme/gelistirme/test/demonstration icin cok faydali.
- Ticari/uretım SaaS icin ogrenci teklifine guvenme; pay-as-you-go / uretim planina gecis planli olmalı.
- Azure Static Web Apps Free plani "personal/hobby" icin uygundur; production icin Standard plan hedeflenmeli.

Pragmatik yol:
1. Dev/staging/demo -> Azure for Students + SWA Free
2. Ilk pilot musteri / production -> Azure pay-as-you-go + SWA Standard

## 8. Operasyon Temeli (ilk gunden)

- DNS kayitlari Cloudflare uzerinden
- Azure Static Web Apps environment ayrimi:
  - preview
  - production
- Firebase env ayrimi zaten var:
  - dev / stg / prod
- Web icin de ayni mantik:
  - `app-web-dev`, `app-web-prod` (Vercel project veya env)

## 9. Guvenlik / Stabilite Baslangic Standardi

- Cloudflare DNS + basic WAF kurallari
- Vercel env secret yonetimi
- Firebase Secrets/Config ayrimi
- Admin mutasyonlari server-side API uzerinden (browser direct write yok)
- Audit log zorunlu (faz 2/3)

## 10. Hangi sirayla kuracagiz? (hosting)

1. Domain DNS stratejisi (Cloudflare)
2. Vercel hesap + GitHub baglantisi
3. `neredeservis.app` ve `app.neredeservis.app` domain baglama (Azure SWA)
4. Firebase backend endpoint/base URL stratejisini netlestirme
5. Share-link canonical domain kararini uygulama
6. Preview/production deployment kurallari
