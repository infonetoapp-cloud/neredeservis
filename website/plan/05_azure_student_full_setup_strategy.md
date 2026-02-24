# Azure Student ile Tam Kurulum Stratejisi (Eksik Kurulum Yapmadan)

Tarih: 2026-02-24
Durum: Oneri / uygulama sirasi

## 1. Ana Kural (kritik)

Ogrenci hesabini sadece "ucretlendirme modu" olarak kullanacagiz.

Eksik kurulmayacak:
- domain yapisi
- environment ayrimi
- CI/CD
- logging/alerting
- guvenlik baslangic ayarlari
- panel + landing mimarisi

Yani:
- Mimari tam kurulacak
- Gerekirse servis plan seviyesi dusuk olacak

## 2. Ne eksik yapmayacagiz?

Asla ertelenmeyecek (mimari borc yaratir):
- `neredeservis.app` / `app.neredeservis.app` domain ayrimi
- web app ile panel route ayrimi
- env ayrimi (dev/prod)
- contract-first backend extension plani
- RBAC tasarimi
- audit log tasarimi
- budget/alert mantigi

Ertelenebilir (dogru erteleme):
- billing UI
- internal admin panel
- landing marketing polish

## 3. Azure Student'in dogru kullanimi

Dogru kullanim:
- dev / staging / demo
- test deployment
- preview ortamlar
- ilk panel gelistirme

Riskli kullanim:
- tek production ortamini tamamen student credit uzerinde birakmak

## 4. Onerilen Abonelik/Ortam Stratejisi

### Simdi (student hesabin yeni kuruldu)

- Subscription A: `NeredeServis-Student-Dev`
  - amac: dev + demo + ilk panel kurulumu

### Sonra (pilot/prod oncesi)

- Subscription B: `NeredeServis-Prod` (Pay-As-You-Go)
  - amac: production

Not:
- Kod/mimari ayni kalir
- Sadece deployment hedefi / plan seviyesi degisir

## 5. Azure SWA tarafinda "tam kurulum" ne demek?

Student kullanirken bile bunlari kur:
- Azure Static Web Apps project (web)
- custom domain baglanti plani
- preview/prod environment mantigi
- GitHub action deployment
- environment variable yonetimi
- basic monitoring + diagnostics

## 6. Firebase tarafinda "tam kurulum" ne demek?

Mevcut backend korunacak ama web ihtiyaci icin planlanacak:
- yeni web/admin endpointleri (server-side)
- tenant/RBAC modeli
- audit log
- role policy testleri
- map cost cap/rate limit guardlari

## 7. Gecis Tetikleri (student -> production)

Asagidaki durumlardan biri olunca prod abonelige gecis zorunlu:
- ilk pilot musteri
- dis kullanici girisi acilmasi
- SLA beklentisi
- kredi tuketiminin hizlanmasi
- domain/panel public duyuru

## 8. Sonuc (net)

Ogrenci hesabi = "eksik kurulum" degil.

Dogru yorum:
- "Tam mimari + dusuk maliyetli baslangic + kontrollu production gecisi"
