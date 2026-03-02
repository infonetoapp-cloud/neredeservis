# MVP Scope Lock v1

Tarih: 2026-03-02  
Durum: LOCKED (Web-first)

## 1. Urun Tanimi
NeredeServis MVP: okul/servis operasyonunda sefer planlama, surucu-rotaya atama ve canli operasyon takibini tek panelde hizlandiran sistemdir.

## 2. Persona ve Deger Onermesi
- Surucu (Mobil App):
  - Bugun atanmis rotasini gorur.
  - Sefer baslatir/bitirir.
  - Durak akisini takip eder.
  - Operasyonla hizli iletisim kurar.
- Yolcu/Veli (Mobil App):
  - Servisin canli konumunu gorur.
  - Durak/rota bilgisini gorur.
  - Basit bildirim ve duyuru alir.
- Filo Yoneticisi/Dispatcher (Web Panel):
  - Sofor, arac, rota olusturur/duzenler.
  - Atamalari tek ekranda yapar.
  - Canli seferleri risk odakli izler ve mudahale eder.

## 3. MVP Disi (Su Asamada Yok)
- AI tahminleme/optimizasyon
- Otomatik fiyatlama/tarife motoru (UKOME dahil)
- Gelismis finans/muhasebe modulleri
- Cok adimli enterprise raporlama paketleri

## 4. Web Panel MVP Ozellikleri (P0)
- Company workspace
  - Company olusturma ve secme
  - Rol tabanli yetki (owner/admin/dispatcher/viewer)
- Fleet Setup workspace (tek baglam)
  - Rota olustur/duzenle
  - Arac olustur/duzenle
  - Sofor olustur/duzenle
  - Sofor-arac-rota iliskilendirme
  - Sayfa degistirmeden drawer/yan panel akisi
- Live Ops workspace
  - Aktif sefer listesi
  - Harita ustunde canli markerlar
  - Secili sefer detayi (ayni ekranda)
  - Risk kuyrugu (stale/critical/warning)
  - Harita buyutme/odak modu

## 5. Mobil App MVP Ozellikleri (P0)
- Surucu uygulamasi
  - Oturum acma
  - Atanmis rota goruntuleme
  - Sefer baslat/bitir
  - Canli konum gonderme
- Yolcu/veli uygulamasi
  - Rota kodu/uyelik ile takip
  - Canli konum goruntuleme
  - Temel duyuru goruntuleme

## 6. Oncelik Sirasi (Feature-first)
1. Web panel bilgi mimarisi kilidi (Fleet Setup + Live Ops)
2. Web panel ana operasyon akislari (create/edit/assign/monitor)
3. Harita kullanilabilirligi (kamera kontrolu, buyutme, style tutarliligi)
4. Mobil surucu akisi
5. Mobil yolcu akisi

## 7. Bilgi Mimarisi Karari
- Yeni sekme ekleme yerine birlestirme tercih edilir.
- Ayrik Drivers/Vehicles/Routes sayfalari, Fleet Setup altinda tek operasyon baglaminda birlestirilecektir.
- Live Ops ayri kalacak, ancak Fleet Setup ile hizli gecis/aksiyon baglantisi korunacaktir.

## 8. Harita Davranis Kilidi (MVP)
- Kullanici pan/zoom yaptiktan sonra harita zorla geri sarmaz.
- Otomatik takip davranisi acik/kapali secilebilir olur.
- Harita tam ekran/odak modu tek tikla acilir.
- Tek map token ve tek style stratejisi kullanilir (env kontrollu).

## 9. Basari Kriterleri
- Yonetici bir rota + arac + sofor atamasini sekme degistirmeden tamamlayabilmeli.
- Canli operasyonda riskli sefere 10 saniye icinde odaklanabilmeli.
- Surucu sefer baslatma ve konum gonderme akisi kesintisiz calismali.
- Yolcu canli konumu anlamli sekilde izleyebilmeli.

## 10. Uygulama Stratejisi
- Once Web panel tamamlanir.
- Mobil app kontratlari web panelde kilitlenen model ve callable semantigine gore hizalanir.
