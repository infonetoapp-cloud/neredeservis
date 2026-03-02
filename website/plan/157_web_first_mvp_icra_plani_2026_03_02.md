# Web-First MVP Icra Plani v1

Tarih: 2026-03-02
Durum: Draft -> Onay bekliyor
Referans commit: 4047536

## 1. Amac
MVP'yi teknik duzeltme odakli degil, ozellik odakli ve kullanici akisi odakli sekilde kilitlemek.
Ilk hedef: Web panelde yoneticinin operasyonu tek baglamda hizli yurutmesi.

## 2. Ust Seviye Kararlar
- Web once tamamlanir, mobil sonra web kontratina hizalanir.
- Yeni sekme artirmak yerine mevcut operasyon sekmeleri birlestirilir.
- P0 iki ana calisma alani:
  - Fleet Setup Workspace
  - Live Ops Workspace

## 3. MVP Ozellik Kapsami (P0)
- Company context + RBAC
  - Company olusturma/secme
  - owner/admin/dispatcher/viewer rol kurallari
- Fleet Setup Workspace
  - Sofor, arac, rota olusturma/duzenleme
  - Atama islemleri (sofor-arac-rota)
  - Sekme degistirmeden drawer/yan panel ile tamamlama
- Live Ops Workspace
  - Aktif sefer listesi
  - Harita uzerinde canli takip
  - Risk kuyrugu (critical/warning/stale)
  - Secili sefer detayinda aksiyonlar
  - Harita odak/tam ekran modu
- Driver App MVP
  - Atanmis rota goruntuleme
  - Sefer baslat/bitir
  - Konum yayinlama
- Passenger App MVP
  - Rota/sefer canli takip
  - Temel duyuru goruntuleme

## 4. Bilgi Mimarisi Plani
## 4.1 Fleet Setup birlestirme
- Mevcut Drivers/Vehicles/Routes sayfalari tek "Fleet Setup" calisma alanina cekilir.
- Sol liste + merkez is alani + sag detay cekmece deseni standartlastirilir.
- Her olusturma islemi ayni sayfada tamamlanir.

## 4.2 Live Ops sadeleştirme
- Live Ops ayri workspace olarak kalir.
- Liste/Harita/Detay uc panel yapisi korunur.
- Harita buyutme ve tekrar normal duzene donme tek tikla olur.

## 5. Harita Stratejisi (Feature-level)
- Token ve style kaynagi teklestirilir (env kontrollu).
- Kamera davranisi:
  - Kullanici manuel pan/zoom yaptiysa zorla reset yok.
  - Takip modu acik/kapali secilebilir.
  - "Haritaya sigdir" manuel aksiyon olarak korunur.
- Stale/offline/online marker semantigi sabitlenir.

## 6. Fazlama
1. Faz A - Scope ve IA kilidi
   - MVP kapsam listesi son hali
   - Fleet Setup + Live Ops wire akislari
2. Faz B - Web bilgi mimarisi uygulama
   - Fleet Setup birlestirme
   - Live Ops layout sadeleştirme
3. Faz C - Web operasyon akislari
   - create/edit/assign/islem tamamlama
4. Faz D - Harita deneyimi
   - kamera kontrolu, odak modu, style/token dogrulama
5. Faz E - Mobil hizalama
   - Driver app callable/parity
   - Passenger app callable/parity

## 7. Basari Kriterleri (MVP Exit)
- Yonetici bir rota + arac + sofor atamasini tek workspace'te tamamlar.
- Live Ops'ta riskli sefere 10 saniye altinda odaklanir.
- Surucu sefer baslat/bitir akisi stabil calisir.
- Yolcu canli konumu anlamli ve gecikmesiz gorur.

## 8. Temizlik ve Sureklilik
- Plan dosyalari icin "tek aktif + archive" kurali uygulanir.
- Snapshot patlamasi engellenir.
- Her faz kapanisinda tek ozet rapor uretilir.

## 9. Acik Onaylar (Senden Beklenen)
1. Fleet Setup ismi onayli mi?
2. Live Ops uc panel yapisi korunup sadece sadeleştirilsin mi?
3. Mobilde once Driver App, sonra Passenger App sirasi onayli mi?
