# NeredeServis Firebase Platform Blueprint (Long-Lived)

## 1) Amac
- Firebase/GCP temelini 2-3 yil bakim kolayligi, guvenlik ve maliyet kontrolu ile kurmak.
- Tek kisilik ekipten cok kisili ekibe geciste yeniden mimari zorunlulugunu azaltmak.
- `dev/staging/prod` ayrimini teknik, operasyonel ve policy seviyesinde kesinlestirmek.

## 2) Ortam ve Isimlendirme Standardi

### 2.1 Proje adlari (onayli kok: `neredeservis`)
- Display name:
  - `NeredeServis Dev`
  - `NeredeServis Staging`
  - `NeredeServis Prod`
- Project ID hedefi:
  - `neredeservis-dev`
  - `neredeservis-stg`
  - `neredeservis-prod`
- Eger ID doluysa kontrollu fallback:
  - `neredeservis-dev-01`
  - `neredeservis-stg-01`
  - `neredeservis-prod-01`

### 2.2 Region standardi
- Firestore: `europe-west3`
- RTDB: `europe-west3`
- Cloud Functions Gen2: `europe-west3`
- Cloud Storage default lokasyon: `eu`

### 2.3 Ayrim prensibi
- Dev: hizli gelistirme, debug izinleri kontrollu.
- Staging: production benzeri, release oncesi tum policy testleri.
- Prod: en kisitli IAM, App Check enforce, debug token yok.

## 3) IAM ve Erisim Modeli (Least Privilege)

### 3.1 Ekip gruplari (onerilen)
- `nsv-admins@...`: platform admin (2FA zorunlu)
- `nsv-engineers@...`: gelistirici
- `nsv-release@...`: release/deploy yetkisi
- `nsv-readonly@...`: sadece log/metric okuma

### 3.2 Servis hesaplari
- `nsv-ci-deployer@<project>.iam.gserviceaccount.com`
  - CI/CD deploy icin.
- `nsv-functions-runtime@<project>.iam.gserviceaccount.com`
  - Functions runtime icin minimum gerekli yetkiler.
- `nsv-scheduler@<project>.iam.gserviceaccount.com`
  - scheduled job/cost-report/backups.

### 3.3 Ana guvenlik kurallari
- Uzun omurlu service account key dosyasi uretilmez (keyless/WIF tercih).
- Prod ortaminda "Owner" rolunu insan hesabi yerine sinirli admin grubuna ver.
- MFA zorunlulugu: admin ve release rollerinde.

## 4) Firebase Servis Konfig Baseline

### 4.1 Authentication
- Provider: Google + Email/Password + Anonymous (guest akisi)
- Anonymous sadece `createGuestSession` akisinda kullanilir.
- Non-anonymous endpointlerde server tarafi kontrol zorunlu.

### 4.2 Firestore
- Native mode
- Rules: direct client write kapali, callable server-authoritative
- Composite indexler repo ile versiyonlu tasinir (`firestore.indexes.json`)

### 4.3 Realtime Database
- Sadece live location
- Rules:
  - route writer grant zorunlu
  - timestamp penceresi dar (`now-30000 .. now+5000`)
  - guest read TTL ile sinirli

### 4.4 Cloud Functions Gen2
- Runtime: Node.js 20
- Region: `europe-west3`
- Varsayilan timeout: 30s
- Idempotency + transition lock zorunlu endpointlerde enforced
- Secret kullanimlari sadece Secret Manager uzerinden

### 4.5 App Check
- Dev/Staging: debug token kontrollu
- Prod:
  - Android: Play Integrity
  - iOS: DeviceCheck/App Attest (asama planina gore)
  - Firestore/RTDB/Functions icin enforce

## 5) Secret ve Config Yonetimi

### 5.1 Secret Manager zorunlu gizliler
- `MAPBOX_SECRET_TOKEN`
- `SENTRY_DSN` (kullaniyorsak)
- `REVENUECAT_API_KEY` (V1.1 acildiginda)
- webhook secretlari

### 5.2 Config ayrimi
- Runtime feature flags: Remote Config (`docs/feature_flags.md` ile birebir)
- Build-time env: `.env.dev/.env.staging/.env.prod`
- Policy: `.env` dosyalari repo'ya girmez.

## 6) Maliyet Dayaniklilik Tasarimi

### 6.1 Budget ve alarm (her ortam ayri)
- Dev: dusuk limit + erken alarm
- Staging: orta limit
- Prod: hedeflenen aylik cap + 50/75/90/100 alarm esikleri

### 6.2 Mapbox maliyet korumasi
- `directions_enabled` varsayilan kapali
- `map_matching_enabled` remote flag ile kontrollu
- kota asiminda fallback zorunlu

### 6.3 Firebase maliyet korumasi
- Firestore/RTDB read-write metrikleri icin log-based alert
- Anormal artis durumunda kill-switch proseduru:
  - `tracking_enabled`
  - `announcement_enabled`
  - `guest_tracking_enabled`

## 7) Operasyon, Gozlemlenebilirlik ve Olay Yonetimi

### 7.1 Monitoring
- Cloud Monitoring dashboard:
  - function error rate
  - p95/p99 latency
  - RTDB write rate
  - Firestore read/write
  - push fail ratio
- Sentry + breadcrumb (PII redaction ile)

### 7.2 Logging politikasi
- Yapilandirilmis log (`requestId`, `uidHash`, `routeId`, `tripId`)
- Ham telefon/email loglama yasak
- Log retention policy ortama gore tanimlanir

### 7.3 Incident modeli
- P0: canli takip bozuk / guvenlik riski / policy ihlali
- P1: degrade ama servis devam
- Rollback tatbikati staging->prod cikisindan once zorunlu

## 8) Yedekleme ve Felaket Kurtarma (DR)

### 8.1 Firestore
- Gunluk export (scheduled) -> GCS bucket (`eu`) 
- Saklama:
  - dev 7 gun
  - staging 14 gun
  - prod 35 gun

### 8.2 RTDB
- RTDB verisi canli-son-durum oldugu icin source of truth degil.
- Tarihce ve audit Firestore `location_history` ve trip loglarinda tutulur.

### 8.3 RPO/RTO hedefleri
- RPO: <= 24 saat (gunluk export bazli)
- RTO: <= 4 saat (kritik servisler icin)

## 9) CI/CD Entegrasyon Modeli
- Deploy yolu: `feature/* -> develop -> main`
- Staging deploy otomatik, prod deploy manuel onayli
- CI kimligi icin Workload Identity Federation tercih edilir (key dosyasi yok)
- Her deploy oncesi zorunlu:
  - rules test
  - function test
  - mobile smoke gate

## 10) Ilk Kurulum Sirasi (Execution Order)
1. Proje ID kilidi ve org/folder karari
2. `dev/staging/prod` Firebase projelerini olusturma
3. Billing baglama (staging/prod zorunlu)
4. Firestore + RTDB + Functions + Auth baseline acilimi
5. IAM gruplari/rolleri ve service accountlar
6. App Check provider ayarlari
7. Secrets/Remote Config baseline
8. Budget + monitoring + alarm
9. Emulator + rules + callable smoke
10. Iz kaydina kapanis notu ve bir sonraki gate onayi

## 11) Bu Adimda Kullanici Tarafindan Gerekli Onaylar
- Organization/Folder var mi, yoksa personal hesap altinda mi acilacak
- Billing account secimi
- Project ID fallback politikasinin onayi (`-01` suffix)
- Region kilidi onayi (`europe-west3`)

## 12) Single Source Referanslari
- Teknik plan: `docs/NeredeServis_Teknik_Plan.md`
- Runbook: `docs/NeredeServis_Cursor_Amber_Runbook.md`
- Security gate: `docs/security_gate.md`
- Feature flags: `docs/feature_flags.md`
- Iz kaydi: `docs/proje_uygulama_iz_kaydi.md`

## 13) Spark-First Modu (Billing Sonra)
- Eger billing account henuz bagli degilse kurulum `Spark-first` modunda ilerler.
- Spark-first modunda:
  - Auth/Firestore/RTDB temel kurulum ve emulator tabanli gelistirme devam eder.
  - Cloud Functions deploy ve scheduler tabanli otomasyonlar billing acilana kadar staging/prod'da acilmaz.
  - Release pipeline "billing gate" nedeniyle production deploy vermez.
- Billing acildiginda yapilacak minimum gecis:
  1) Staging + prod projelerine billing bagla
  2) Functions Gen2 deploy smoke
  3) Scheduler/backup isleri aktif et
  4) Budget alarm esiklerini tekrar dogrula

## 14) Mevcut Karar Snapshot (2026-02-17)
- Proje koku: `neredeservis`
- Proje sahipligi: personal account
- Billing: kullanici beyanina gore Blaze aktif; CLI tarafinda dogrudan billing API dogrulamasi (gcloud) bu makinede beklemede
- Region: `europe-west3` standardi
- Project ID fallback: `-01` suffix politikasina hazir

## 15) Cloud API Enable Checklist (Non-Negotiable)
- Sinan, bu adim zorunlu; atlanirsa Functions/CI/CD/cron zinciri kirilir.
- Her ortam (`dev/staging/prod`) icin proje olusur olusmaz asagidaki API'ler acilir:
  - `cloudfunctions.googleapis.com`
  - `run.googleapis.com`
  - `cloudbuild.googleapis.com`
  - `artifactregistry.googleapis.com`
  - `eventarc.googleapis.com`
  - `pubsub.googleapis.com`
  - `cloudscheduler.googleapis.com`
  - `secretmanager.googleapis.com`
  - `firestore.googleapis.com`
  - `firebasedatabase.googleapis.com`
  - `identitytoolkit.googleapis.com`
- Opsiyonel/ileri asama:
  - `fcm.googleapis.com`
  - `firebaseappcheck.googleapis.com`
- Zorunlu dogrulama:
  - `gcloud services list --enabled` ile liste kaniti alinmadan sonraki faza gecilmez.
