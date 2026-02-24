# Azure Static Web Apps Creation Steps (Faz 1 Hazirlik, MVP-Cut)

Tarih: 2026-02-24
Durum: Referans checklist (Azure SWA) - Azure Student region policy nedeniyle Faz 1 dev yolunda bloklu

## 1. Amac

Azure SWA kaynagini plansiz kurmayip standard adimlarla olusturmak.

Not (2026-02-25 execution revizyonu):
- Mevcut Azure Student subscription policy'sinde izinli regionler ile Azure SWA desteklenen regionler cakismadigi icin (`westeurope` izinli degil; izinli regionlerde SWA yok), Faz 1 dev deploy yolu Vercel'e alinmistir.
- Bu dokuman silinmez; future PayG / farkli subscription durumunda referans olarak kalir.

MVP kapsami (revize):
- tek SWA (`web`) 
- tek Next.js app (marketing + dashboard route groups)
- dev/preview baslangici

## 2. Naming Convention (onerilen)

Resource Group (student/dev):
- `rg-nsv-web-dev`

SWA resource (MVP):
- `swa-nsv-web-dev`

Prod icin ayni pattern:
- `rg-nsv-web-prod`
- `swa-nsv-web-prod`

Not:
- `nsv` = NeredeServis kisaltmasi
- Post-pilot split olursa `landing/panel` resource'lari ayrilabilir

## 3. On Hazirlik

- [ ] Azure Student subscription aktif
- [ ] Resource group naming karari onayli
- [ ] GitHub repo/branch stratejisi net
- [ ] Cloudflare DNS aktif
- [ ] Domain/subdomain plani net
- [ ] Firebase regionlari not edildi (region alignment icin)

## 4. Web SWA Olusturma (Dev)

Portal adimlari (ust seviye):
1. Azure Portal -> Create Resource
2. `Static Web App` sec
3. Subscription: Student
4. Resource Group: `rg-nsv-web-dev`
5. Name: `swa-nsv-web-dev`
6. Hosting Plan:
   - ilk asama `Free`
7. Region: Firebase backend regionlarina yakin (EU odakli) sec
8. Deployment source: GitHub
9. Repo ve branch secimi
10. Build preset / custom build config gir (`website/apps/web`)

Kurulum sonrasi:
- [ ] generated domain not al
- [ ] deployment status kontrol et
- [ ] preview environment davranisini dogrula
- [ ] App Router deep-link refresh smoke (`/login`, `/panel`, nested route) yap
- [ ] SWA fallback/staticwebapp config routing cakismasi basic smoke ile kontrol et

## 5. Build/Deploy Config Kararlari (kurulum sirasinda)

Web app:
- app location (`website/apps/web` veya son repo yapisi)
- output location
- build command

Kural:
- Marketing ve panel ayni app oldugu icin route-level bundle discipline code tarafinda saglanir

## 6. Domain Baglama Sirasi (Devde zorunlu degil)

Dev/Faz 1:
- generated preview domains yeterli

Daha sonra (prod):
- `neredeservis.app` -> web SWA
- `app.neredeservis.app` -> ayni web SWA (panel host alias)

Opsiyonel (sonra):
- `stg-app.neredeservis.app` yalnizca generated preview domainler yetersiz kalirsa

## 7. Azure Uzerinde Ilk Gun Kurulacak Guvenlik/Maliyet Ayarlari

- [ ] Cost budget (dusuk)
- [ ] 50/80/100 alert
- [ ] Resource tags:
  - `project=neredeservis`
  - `env=dev`
  - `owner=<sen>`
  - `cost-center=student`

## 8. Region / Latency Check (review sonrasi ek)

- [ ] Firebase Functions/Firestore regionlari ile Azure region uyumu not edildi
- [ ] Login + temel data read icin preview ortaminda latency smoke olcumu yapildi
- [ ] Gozle gorulur gecikme varsa region karari tekrar acilir

## 9. Prod Gecisinde Neler Degismeyecek?

Degismeyecek:
- repo yapisi (MVP tek app)
- app route gruplari mantigi
- env isimleri mantigi
- deployment pipeline mantigi

Degisecek:
- subscription / plan seviyesi
- custom domain baglantilari
- prod env vars

## 10. Kurulum Sonrasi Kanit Kaydi (onerilen)

Web SWA icin bir not:
- resource name
- generated URL
- plan type
- branch
- build config
- region
- olusturma tarihi
- routing smoke sonucu (pass/fail + not)

Bu not `website/plan` veya ops runbook'a eklenir.

## 11. Post-Pilot Split Trigger Notu

Landing/panel ayrik SWA'ya gecis ancak su durumlarda degerlendirilir:
- deploy cadence ayrisiyor
- build/bundle complexity artiyor
- rollback ihtiyaci ayrisiyor
- farkli edge/runtime ihtiyaclari olusuyor
