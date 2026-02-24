# ADR-001: Live Ops Read Model (RTDB + Firestore + Projection Hybrid)

Tarih: 2026-02-24
Durum: Accepted (ADR-007 ile Faz 1-2 uygulama sirasi sadeleştirildi)

## 1. Problem

Web panelde canli operasyon ekrani icin:
- anlik konum stream
- rota/sefer metadata
- dashboard/ozet verileri
gerekiyor.

Tek bir kaynakla tum ihtiyaci cozmeye calismak:
- ya yetki karmasasi
- ya performans sorunu
- ya da spagetti client query mantigi
olusturabilir.

## 2. Karar

Hibrit read modeli kullanilacak:

1. Firestore:
- CRUD list/detail/business metadata
- routes, trips, drivers, vehicles, memberships, audit

2. RTDB:
- tenant-scoped canli konum streamleri (MVP default: company-level live ops path)
- dusuk gecikmeli live updates

3. Projection endpoint/snapshot (hedefli):
- dashboard aggregate veya live ops summary ihtiyaci icin
- her sey projection olmayacak, sadece gerekli yerler

Not (ADR-007):
- Faz 1-2'de projection endpointler default degil, trigger/esik tabanli acilir
- basit dashboard KPI'lar client-side aggregation ile baslayabilir

## 3. Neden Bu Karar?

- Mevcut backendde RTDB canli konum zaten var (tekrar backend yazmayi azaltir)
- Firestore business state icin dogru source-of-truth
- Dashboard/ops ekranlari icin projection endpoint performans/permission kontrolunu kolaylastirir
- MVP hizini korur, ileri olcekleme icin yol birakir

## 4. Alternatifler

### A) Tamamen RTDB

Artı:
- anlik veri guclu

Eksi:
- business state ve query ergonomisi zayif
- yetki/audit karmaşasi

### B) Tamamen Firestore

Artı:
- tek kaynak

Eksi:
- live ops gecikme/maliyet/desen sorunlari
- RTDB mevcut altyapi avantaji boşa gider

### C) Her sey projection endpoint

Artı:
- merkezi kontrol

Eksi:
- MVP delivery yavaslar
- backend isi gereksiz buyur

## 5. Uygulama Kurallari (MVP)

1. CRUD ekranlari:
- Firestore reads (strict rules)

2. Live map screen:
- active company context icin RTDB stream (MVP company-level)
- UI filtreleri route/trip bazli olabilir, authz degil UX filtresidir
- ekran kapandiginda unsubscribe zorunlu

3. Dashboard aggregate:
- gerekiyorsa `getLiveOpsSnapshot` benzeri hedefli endpoint

4. Yetki:
- live read authorization RTDB rules + access mirror + server policy ile dogrulanacak

## 6. Kritik Teknik Not (repo durumu)

Ilk planda `routeReaders` RTDB read grant modeli tanimliydi.
MVP-cut revizyonda default yaklasim company-level RTDB live access oldu.

Bu ADR'nin ilk teknik task'i:
- company-level RTDB access rules/claims/access-mirror/degraded-mode implementasyon plani
- routeReaders granular grants ihtiyacini pilot sonrasi triggera tasima

## 7. Sonuclar

Pozitif:
- hizli MVP
- performans ve yetki dengesini korur
- buyumeye acik

Negatif/Bedel:
- iki read modeli + secili projection endpoint oldugu icin dokuman disiplini gerekir

## 8. Review Zamanı

Faz 4 sonunda tekrar degerlendirilecek:
- live ops trafik
- maliyet
- yetki karmasasi
- projection ihtiyac artisina gore
