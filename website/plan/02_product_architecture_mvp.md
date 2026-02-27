# Web Urun + Mimari Plani (MVP odakli)

Tarih: 2026-02-24
Durum: Oneri

## 0. Web-First Karari

Yeni temel karar:
- Web panel domain modeli ve API kontratlari once tanimlanacak.
- Mobil app, gerekli yerlerde sonradan bu kontratlara uyarlanacak.

Bu karar dogru cunku:
- Kurumsal operasyon mantigi webde daha net tasarlanir.
- Mobil ekranlar sonradan ayni policy/API ile hizalanabilir.

## 1. Kullanici Tipleri (ayri tutulacak)

Mobil roller (mevcut):
- `driver`
- `passenger`
- `guest`

Web panel roller (yeni, kurumsal):
- `owner`
- `admin`
- `dispatcher`
- `viewer`

Kritik kural:
- Mobil rol ile web panel rolunu ayni alan/kolonda tutma.
- Ayni kisi hem mobil `driver`, hem web `dispatcher` olabilir.

## 2. Is Modeli (senin istegine uygun)

Iki ana operasyon tipi:

1. Bireysel Sofor
- Kendi rotalarini yonetir
- Kendi arac(lar)ini gorur
- Kendi aktif seferini takip eder
- Basit panel kullanir

2. Firma / Servis Sirketi
- Birden cok soforu yonetir
- Birden cok araci yonetir
- Rota planlar
- Hangi sofor nerede gorur
- Operasyon kullanicilarina yetki verir

## 3. Domain Model (web icin eklenecek cekirdek)

Zorunlu varliklar:
- `Company`
- `CompanyMember`
- `Vehicle`
- `DriverCompanyAssignment` (veya `Employment`)
- `Route`
- `Stop`
- `Trip`
- `TripLiveState` (RTDB/Firestore projection)
- `AuditLog`

Mevcut varliklarla iliski:
- `drivers/{uid}` (mevcut) korunur
- `routes/{routeId}` (mevcut) korunur
- `trips/{tripId}` (mevcut) korunur
- Yeni tenant/RBAC varliklari bunlara policy katmani olarak eklenir

## 4. MVP Ekranlari (faz 1-2)

Public taraf:
- Landing home (final tasarim sonra)
- Login giris noktasi (sag ust "Giris Yap")
- Auth pages (login/register/forgot password)

Web panel:
- Dashboard (ozet durum)
- Soforler
- Araclar
- Rotalar
- Rota detayi / Duraklar
- Aktif operasyon (canli harita + aktif sefer listesi)
- Kullanici ayarlari (profil)

Faz 2 ekrani:
- Firma kullanicilari / yetkilendirme
- Audit log (minimum)

## 5. MVP'de bilerek ertelenecekler (dogru karar)

Senin kararin mantikli; ben de onayliyorum:
- Abonelik satin alma web UI (ertelensin)
- Internal admin panel (ertelensin)
- Gelismis raporlama/exportlar (ertelensin)
- Full landing marketing polish (en son)

Neden dogru?
- Once operasyon cekirdegi calismali.
- Billing/admin panel erken gelirse delivery yavaslar.
- Ilk musteri feedbacki olmadan "yanlis panel" yazma riski artar.

## 6. API Stratejisi (web panel icin)

Kural:
- Kritik yazma operasyonlari browser -> Firestore direct write olmayacak.
- Server-side API (Functions callable/HTTP) uzerinden gidecek.

Ilk asama pragmatik yaklasim:
- Mevcut callables tekrar kullan
- Eksik web-admin endpointlerini yeni Functions olarak ekle

Ornek yeni endpoint ihtiyaclari:
- createCompany
- inviteCompanyMember
- acceptCompanyInvite / declineCompanyInvite
- updateCompanyMember
- removeCompanyMember
- createVehicle / updateVehicle
- assignDriverToCompany
- createRouteAsCompany (owner/dispatcher yetkisiyle)
- listRouteDriverPermissions / grantDriverRoutePermissions / revokeDriverRoutePermissions

## 7. Yetki Modeli (policy-first)

Ornek policy mantigi:
- `owner`: her sey
- `admin`: user role haric cogu yonetim
- `dispatcher`: operasyon, rota, sefer, canli takip
- `viewer`: salt okuma

Bireysel sofor paneli:
- Kurumsal RBAC olmadan kendi verisine erisir

## 8. Canli Takip Mimari Notu

Mevcut canli konum kaynagi:
- RTDB `/locations/{routeId}`

Web panelde canli takip icin gerekli:
- tenant-scoped RTDB live read modeli (MVP: company-level)
- ve/veya server projection/read proxy

Not:
- Eski `routeReaders` grant lifecycle fikri MVP default degildir; post-pilot granular access ihtiyaci icin korunur.
- Bu, web canli operasyon ekraninin ilk teknik gate maddesidir.

## 9. Frontend Mimari Oneri (kodlamaya gecince)

Tech stack (oneri):
- Next.js (App Router)
- TypeScript
- Firebase Web SDK (read/auth gereken yerlerde)
- Server Actions/Route Handlers veya backend Functions proxy
- TanStack Query (opsiyonel, veri fetch ergonomisi icin)

Neden Next.js?
- Landing + panel birlikte ama ayrik route gruplari kolay
- SEO/public sayfalar icin iyi
- Azure Static Web Apps / App Service / Container tabanli deployment secenekleri var

## 10. Baslangic klasor hedefi (ileride)

`website/` altinda ileride hedef:
- `apps/web` (marketing + dashboard route groups)
- `docs/adr`
- `packages/ui` (opsiyonel)
- `packages/contracts` (opsiyonel)

Su an sadece plan dokumanlari tutuluyor.
