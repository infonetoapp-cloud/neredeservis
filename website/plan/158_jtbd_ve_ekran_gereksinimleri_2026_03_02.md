# JTBD ve Ekran Gereksinimleri v1

Tarih: 2026-03-02
Durum: Draft (MVP Scope Lock ile hizali)
Referans: 155_mvp_scope_lock_2026_03_02.md, 157_web_first_mvp_icra_plani_2026_03_02.md

## 1. Amac
Bu dokuman, sirket kullanicisinin panelde hangi isi cozecegini netlestirir.
Odak: "fix" degil "ozellik ve akisin degeri".

## 2. Sirketin 10 Ana Isi (Jobs-to-be-done)

## 2.1 JTBD-01 - Sirket calisma alanini hazirlamak
- Job: "Paneli actigimda dogru sirket baglaminda calismak istiyorum."
- Problem: Yanlis tenantta islem yapma riski.
- Cozum: Aktif company context, net chip/uyari, hizli company switch.
- Basari cikti: Kullanici 1 tikla dogru companyye gecer.

## 2.2 JTBD-02 - Sofor kaydi acmak
- Job: "Yeni soforu hizlica sisteme eklemek istiyorum."
- Problem: Formlar daginik, sayfa gezme fazla.
- Cozum: Fleet Setup icinde inline create + drawer edit.
- Basari cikti: Sofor kaydi 1 akis icinde tamamlanir.

## 2.3 JTBD-03 - Arac kaydi acmak
- Job: "Arac envanterini eksiksiz ve hizli olusturmak istiyorum."
- Problem: Farkli ekranlarda tekrarli veri girisi.
- Cozum: Fleet Setup icinde arac kartlari + hizli create.
- Basari cikti: Arac kaydi tek oturumda biter.

## 2.4 JTBD-04 - Rota olusturmak ve duraklari tanimlamak
- Job: "Rota ve duraklarini tek baglamda kurmak istiyorum."
- Problem: Durak duzenleme karmasik.
- Cozum: Rota detay drawer, durak listesi, sira degistirme, harita onizleme.
- Basari cikti: Rota ilk kurulum suresi belirgin kisalir.

## 2.5 JTBD-05 - Sofor + Arac + Rota atamak
- Job: "Atamayi sekme degistirmeden bitirmek istiyorum."
- Problem: Drivers/Vehicles/Routes arasinda gecis yuku.
- Cozum: Fleet Setup birlesik atama paneli.
- Basari cikti: Atama tek yerde tamamlanir.

## 2.6 JTBD-06 - Gunluk operasyon hazirligini kontrol etmek
- Job: "Seferden once eksik var mi tek bakista gormek istiyorum."
- Problem: Hazirlik listesi daginik.
- Cozum: Fleet Setup readiness ozeti (eksik sofor/arac/rota baglantilari).
- Basari cikti: "ready/not ready" listesi aninda gorulur.

## 2.7 JTBD-07 - Canli operasyonda riskli seferi erken yakalamak
- Job: "Kritik sefere hizli odaklanmak istiyorum."
- Problem: Tum araclar ayni onemde gorunuyor.
- Cozum: Live Ops risk kuyrugu (critical/warning/stale), klavye gezisi.
- Basari cikti: Riskli sefer secim suresi saniyelere iner.

## 2.8 JTBD-08 - Soforle aninda iletisim kurmak
- Job: "Sorun oldugunda tek tikla sofore ulasmak istiyorum."
- Problem: Kopyalama/mesaj hazirlama zaman kaybi.
- Cozum: Sefer ozeti kopyala, WhatsApp ac, hizli dispatch mesajlari.
- Basari cikti: Iletisim akisi panelden cikmadan tamamlanir.

## 2.9 JTBD-09 - Operasyonel sapmalari yonetmek
- Job: "Sinyal gecikmesi/offline durumlarinda ne oldugunu anlamak istiyorum."
- Problem: Durumlar belirsiz ve gecikmeli yorumlaniyor.
- Cozum: Stream telemetry, stale nedeni, reconnect bilgisi, net mikro-kopya.
- Basari cikti: Operator dogru aksiyonu beklemeden alir.

## 2.10 JTBD-10 - Gun sonu izlenebilirlik
- Job: "Ne oldu, kim ne yapti, nasil kapandi bilmek istiyorum."
- Problem: Olay gecmisi daginik.
- Cozum: Detay panelde dispatch gecmisi + denetim izleri.
- Basari cikti: Operasyon kapanisi izlenebilir olur.

## 3. Ekran Gereksinimleri (Web MVP)

## 3.1 EKRAN-A - Company Context / Mode
- Amac: Dogru company baglami secmek ve role gore alan acmak.
- Gerekli bilesenler:
  - Company switcher
  - Aktif membership chip (role + status)
  - Yetkiya gore gorunen menuler

## 3.2 EKRAN-B - Fleet Setup Workspace (BIRLESIK)
- Amac: Sofor, arac, rota ve atamalari tek alanda bitirmek.
- Layout:
  - Sol: Liste + filtre + arama (entity toggle: sofor/arac/rota)
  - Orta: Secili kaydin ana bilgileri ve iliski ozetleri
  - Sag Drawer: Create/Edit/Assign formlari
- Gerekli aksiyonlar:
  - Sofor olustur/duzenle
  - Arac olustur/duzenle
  - Rota olustur/duzenle + durak yonetimi
  - Atama: sofor<->rota, arac<->rota
- Kural:
  - Islem tamamlama icin ayri sayfaya gitme yok.

## 3.3 EKRAN-C - Live Ops Workspace
- Amac: Aktif seferi izle, riski yakala, mudahale et.
- Layout:
  - Sol: Risk kuyrugu / aktif sefer listesi
  - Orta: Harita
  - Sag: Secili sefer detay paneli
- Harita davranis gereksinimi:
  - Renkli style (siyah-beyaz degil)
  - Kullanicinin pan/zoom hareketini bozmama
  - Takip modu ac/kapat
  - Haritaya sigdir (manuel)
  - Harita odak/tam ekran modu
  - Politik/ilgisiz label ve gorsel gurultu minimum

## 3.4 EKRAN-D - Admin (Yetkili)
- Amac: Denetim, tenant state, kritik operasyon kontrolu.
- Not: MVPde cekirdek panel akislarini engellemeyen minimal kapsam.

## 4. Surtunme Azaltma Ilkeleri
- Tek baglamda is bitirme (no tab hopping)
- Her kritik islem icin tek bir "birincil buton"
- Varsayilanlarin akilli secilmesi (kullaniciya az karar)
- Klavye kisayollari ile hizli gezinme
- Bos durumlarda aksiyon onerisi (dead-end yok)

## 5. Sirket Acisindan Net Fayda
- Planlama sureleri kisalir (olusturma/atama tek yerde)
- Operasyonda gecikmeye mudahale hizlanir (risk kuyrugu)
- Ekip hatasi azalir (baglam kaybi ve sekme gecisi azalir)
- Operasyon izlenebilirligi artar (detay + gecmis + audit)

## 6. P0 Kabul Kriterleri
- Bir yonetici yeni rota + sofor + arac baglantisini tek workspace'te tamamlayabilir.
- Live Ops ekraninda riskli sefer secimi 10 saniye altinda yapilabilir.
- Harita, kullanici pan/zoom yaptiktan sonra zorla geri resetlenmez.
- Kritik aksiyonlar (kopyala/iletisim/acikla) detay panelden cikmadan yapilabilir.

## 7. Sonraki Adim
Bu dokuman onaylandiktan sonra Faz A backlog'u (IA + component contract + endpoint mapping) cikartilir.
