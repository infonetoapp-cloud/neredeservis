# Faz 0 Icra Checklist (Simdi Ne Yapacagiz?)

Tarih: 2026-02-24
Durum: Uygulama oncesi checklist

## Hedef

Web sistemi tam mimariyle baslatmak icin kurulum sirasini netlestirmek.

## A. Karar Kilidi (bugun)

- [ ] Web-first kararini kilitle
- [ ] Frontend hosting = Azure Static Web Apps
- [ ] Backend = Firebase
- [ ] DNS = Cloudflare
- [ ] Domain yapisi = `neredeservis.app` + `app.neredeservis.app`
- [ ] MVP kapsami = billing/internal admin UI yok (ama internal admin kontrol altyapisi/policy/runbook planli)

## B. Azure Tarafi (student hesabinda)

- [ ] Subscription adini/etiketini netlestir (`NeredeServis-Student-Dev`)
- [ ] Resource naming convention dokumani yaz
- [ ] Azure Static Web Apps icin region/plan karari (Free ile baslangic)
- [ ] Cost Management budget olustur (dusuk esiklerle)
- [ ] Billing alert/esiklerini kur

## C. Domain ve DNS

- [ ] `neredeservis.app` nameserver'i Cloudflare'a al (veya mevcutsa bagla)
- [ ] DNS kayit planini olustur:
  - apex/root
  - `www`
  - `app`
- [ ] SSL/TLS policy (Full/Strict) karari
- [ ] Canonical domain karari dokumani

## D. GitHub / Repo Hazirlik

- [ ] Web gelistirme branch stratejisi belirle
- [ ] `website/` klasoru icin issue/board baslat
- [ ] CI temel kurallari tanimla (lint/test/build)
- [ ] Secrets/env yonetim listesini cikar

## E. Web Teknik Tasarim (koddan once)

- [ ] Yetki matrisi (firma + bireysel + firma bagli sofor)
- [ ] Veri modeli (Company, CompanyMember, Vehicle, Assignment, Permission)
- [ ] Web API listesi (mevcut callables + yeni endpointler)
- [ ] Canli takip read modeli (MVP company-level RTDB + projection ihtiyaci) karari
- [ ] Audit log event listesi

## F. Azure SWA + Firebase Entegrasyon Hazirligi

- [ ] Web environment listesi: `dev`, `prod`
- [ ] Firebase project mapping (web-dev -> firebase-dev/stg, web-prod -> firebase-prod)
- [ ] Web env var listesi (public/non-public)
- [ ] CORS/origin allow-list plani (web panel domainleri)

## G. Kodlama Baslangic Gate (bu checklist bitmeden kod yok)

- [ ] Yetki matrisi dokumani onaylandi
- [ ] Veri modeli V0 onaylandi
- [ ] Hosting/domain checklist onaylandi
- [ ] Cost guard stratejisi onaylandi

## H. Bir Sonraki Adim (hemen)

Bu checklistten sonra ilk yazilacak plan dokumanlari:
1. Yetki matrisi (`07_permissions_matrix.md`)
2. Veri modeli (`08_domain_model_company_rbac.md`)
3. DNS/Deployment checklist (`09_dns_azure_firebase_deploy.md`)
