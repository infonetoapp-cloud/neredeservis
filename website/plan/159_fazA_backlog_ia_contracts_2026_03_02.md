# Faz A Backlog (IA + Contract) v1

Tarih: 2026-03-02
Durum: Ready for execution
Referanslar:
- 155_mvp_scope_lock_2026_03_02.md
- 157_web_first_mvp_icra_plani_2026_03_02.md
- 158_jtbd_ve_ekran_gereksinimleri_2026_03_02.md

## 1. Faz A Hedefi
Kod yazmadan once bilgi mimarisi, ekran sorumluluklari ve endpoint sozlesmelerini kilitlemek.

## 2. Faz A Teslimatlari
- IA dokumani (Fleet Setup + Live Ops)
- Ekran-bilesen kontrat matrisi
- Endpoint mapping tablosu (input/output + hata semantigi)
- Rol/izin davranis matrisi
- UX akislari (happy path + failure path)

## 3. Backlog Kartlari

## A-01 Fleet Setup IA kilidi
- Hedef: Drivers/Vehicles/Routes ayrik yapisindan birlesik Fleet Setup'a gecis mimarisini netlemek.
- Cikti:
  - Sol panel (liste/filtre/arama)
  - Orta panel (secili kayit ozet)
  - Sag drawer (create/edit/assign)
- Kabul:
  - Sekme gecis zorunlulugu olmayan akis tanimi

## A-02 Live Ops IA kilidi
- Hedef: Uc panel (liste + harita + detay) davranislarini kesinlestirmek.
- Cikti:
  - Risk kuyrugu davranislari
  - Harita odak/tam ekran davranisi
  - Detay panel aksiyonlari
- Kabul:
  - Kritik sefere odak akisi adim adim yazili

## A-03 Harita davranis kontrati
- Hedef: Harita kamera/stil/token davranislarini sabitlemek.
- Cikti:
  - followSelected default
  - pan/zoom lock kurali
  - fit-to-bounds tetikleme kosullari
  - style/token env sozlesmesi
- Kabul:
  - "manuel pan sonrasi zorla reset yok" kurali test edilebilir tanimda

## A-04 Endpoint kontrat matrisi
- Hedef: Web panelde kullanilan callables icin tek kaynak sozlesme.
- Kapsam:
  - createCompany, listMyCompanies
  - listCompanyMembers, invite/update/remove member
  - listCompanyVehicles, create/update vehicle
  - listCompanyRoutes, create/update route
  - listCompanyRouteStops, upsert/delete/reorder stop
  - listActiveTripsByCompany
- Kabul:
  - Input/Output alanlari ve error reason-code map tablolu

## A-05 Rol/izin matrisi
- Hedef: owner/admin/dispatcher/viewer bazli eylem izinlerini netlemek.
- Kabul:
  - Her eylem icin "Allowed roles" tek tabloda
  - UI disable + backend deny semantigi uyumlu

## A-06 UX mikro-kopya seti
- Hedef: Operasyon dilini sade ve eylem odakli hale getirmek.
- Kapsam:
  - Empty states
  - Error states
  - Lock/Conflict states
  - Live stream states
- Kabul:
  - Kritik durumlarin hepsinde kullaniciya net bir sonraki adim var

## A-07 Command palette aksiyon kapsami
- Hedef: Surtunmeyi azaltan kisayol setini kilitlemek.
- Kapsam:
  - Arac/plaka ile hizli bulma
  - Secili sefere atlama
  - Kopyala/WhatsApp aksiyonlari
- Kabul:
  - En az 5 operasyonel kisayol tanimi

## A-08 Telemetry ve performans gozetim gereksinimleri
- Hedef: Live Ops performansinin dusmeden izlemesi.
- Kapsam:
  - Marker limiti
  - Stream lag thresholds
  - Retry backoff gostergeleri
- Kabul:
  - Gosterge adlari + esitler dokumanda sabit

## 4. Faz A Oncelik Sirasi (ic)
1. A-01
2. A-02
3. A-03
4. A-04
5. A-05
6. A-06
7. A-07
8. A-08

## 5. Faz A Cikis Kriteri
- IA, kontrat ve izin matrisi onayli
- Kodlama fazina gecis icin belirsiz kritik nokta kalmamis
- Faz B icin ekran bazli implementasyon kartlari hazir
