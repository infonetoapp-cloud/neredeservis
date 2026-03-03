# Ekran Bazlı IA ve Kabul Kriterleri

Tarih: 2026-03-02
Durum: AKTİF
Kapsam: Platform Owner (Web), Şirket (Web), Şoför (Mobil), Yolcu/Misafir (Mobil)

---

## Bölüm A — Platform Owner Web Ekranları

---

### A1 — Platform Login

**Amaç:** SaaS Sahibi'nin platform paneline kimlik doğrulaması ile girmesi.

**Giriş Verisi:** E-posta adresi, şifre.

**Ana Aksiyonlar:**
- "Giriş Yap" → Firebase Auth doğrulama → `users/{uid}.role` membership kontrolü → Şirketler Listesine yönlendirme.
- "Şifremi Unuttum" link → Şifre Sıfırlama sayfasına yönlendirme.

**Boş Durum:** Yok (login ekranı her zaman form gösterir).

**Hata Durumu:**
- Yanlış e-posta/şifre: "E-posta veya şifre hatalı."
- Yanlış rol ile giriş: "Bu hesap platform paneline erişemez."
- Ağ hatası: "Bağlantı kurulamadı, tekrar deneyin."

**Kabul Kriterleri:**
- [ ] Doğru platform_owner kimliğiyle giriş yapıldığında Şirketler Listesi açılır.
- [ ] Yanlış rol (company_user) ile giriş denendiğinde erişim reddedilir ve hata mesajı görünür.
- [ ] "Şifremi Unuttum" linki şifre sıfırlama sayfasına yönlendiriyor.
- [ ] Başarısız 5 denemede kullanıcı bilgilendirilir (Firebase rate limit devrelenir).

---

### A2 — Şirketler Listesi

**Amaç:** Sistemdeki tüm şirketlerin özet görünümü; yeni şirket oluşturma başlangıcı.

**Giriş Verisi:** Firestore `companies` koleksiyonu (platform_owner tüm belgeler).

**Ana Aksiyonlar:**
- "Yeni Şirket Oluştur" butonu → Şirket Oluştur formuna yönlendirme.
- Şirket satırına tıklama → Şirket Detay sayfasına yönlendirme.
- Durum toggle (aktif/pasif) → Inline güncelleme.

**Görüntülenen Alanlar:**
- Şirket adı, araç limiti, aktif kullanıcı sayısı, durum (aktif/pasif), oluşturulma tarihi.

**Boş Durum:** "Henüz şirket eklenmemiş. Yeni şirket oluşturun."

**Hata Durumu:** Firestore okuma hatası → "Şirketler yüklenemedi, sayfayı yenileyin."

**Kabul Kriterleri:**
- [ ] Tüm companies listesi yükleniyor; her şirketin adı, limiti ve durumu görünüyor.
- [ ] "Yeni Şirket Oluştur" tıklandığında form açılıyor.
- [ ] Aktif/pasif toggle değiştirildiğinde Firestore güncelleniyor, sayfa yenilemesi gerekmeden yansıyor.

---

### A3 — Şirket Oluştur Formu

**Amaç:** Yeni tenant (şirket) oluşturma.

**Giriş Verisi:** Form input: Şirket adı (zorunlu), iletişim e-postası (zorunlu), araç limiti (zorunlu, min 1).

**Ana Aksiyonlar:**
- "Kaydet" → Firestore'a `companies` belgesi yazılır, şirket `active` durumunda oluşturulur.
- "İptal" → Şirketler listesine dönüş, kayıt yok.

**Boş Durum:** Form sıfır dolu açılır (yeni kayıt).

**Hata Durumu:**
- Zorunlu alan boş: her alan için "Bu alan zorunludur."
- Araç limiti < 1: "Limit en az 1 olmalıdır."
- Aynı isimde şirket varsa: "Bu isimde bir şirket zaten mevcut."
- Kayıt hatası: "Kaydedilemedi, tekrar deneyin."

**Kabul Kriterleri:**
- [ ] Tüm alanlar dolu ve geçerliyken "Kaydet" tıklandığında Firestore'da şirket belgesi oluşturuluyor.
- [ ] Araç limiti 0 girildiğinde form kaydedilmiyor, validasyon hatası gösteriliyor.
- [ ] Kayıt sonrası Şirket Detay sayfasına yönlendirme yapılıyor.

---

### A4 — Şirket Detayı

**Amaç:** Seçili şirketin yönetimi: kullanıcılar, araç limiti, durum.

**Giriş Verisi:** `companies/{company_id}` belgesi; `users` koleksiyonundan şirkete ait kullanıcılar.

**Ana Aksiyonlar:**
- "Kullanıcı Ekle" → Kullanıcı Oluştur modal/sayfasına.
- Araç Limiti düzenleme (inline veya modal).
- Kullanıcı deaktif etme.
- Şirketi Aktif/Pasif yapma.
- Geri → Şirket Listesi.

**Görüntülenen Alanlar:**
- Şirket adı, araç limiti, durum; kullanıcı listesi (ad, e-posta, durum).

**Boş Durum — Kullanıcı Listesi:** "Bu şirkete henüz kullanıcı eklenmemiş."

**Hata Durumu:** Kullanıcı yüklenemezse: "Kullanıcılar yüklenemedi."

**Kabul Kriterleri:**
- [ ] Şirkete ait tüm kullanıcılar listede görünüyor.
- [ ] "Kullanıcı Ekle" ile kullanıcı oluşturulduğunda liste güncelleniyor.
- [ ] Araç limiti güncellenince Firestore'da değişiyor.
- [ ] Kullanıcı deaktif edilince o kullanıcı giriş yapamıyor.

---

### A5 — Kullanıcı Oluştur (Şirket Paneli Kullanıcısı)

**Amaç:** Şirkete web paneli erişimi olan kullanıcı açmak.

**Giriş Verisi:** E-posta (zorunlu).

**Ana Aksiyonlar:**
- "Davet Et" → `inviteCompanyMember` callable çağrılır → davet e-postası gönderilir → Firestore membership kaydı oluşturulur.
- "İptal" → Modal kapat.

**Hata Durumu:**
- E-posta zaten kayıtlı: "Bu e-posta zaten kullanımda."
- Geçersiz e-posta: "Geçerli bir e-posta adresi giriniz."

**Kabul Kriterleri:**
- [ ] Davet edilen kullanıcı `companies/{cId}/members/{uid}` subcollection'a yazılıyor.
- [ ] Kullanıcı davet e-postasından kendi şifresini belirleyerek giriş yapabiliyor.
- [ ] Oluşturulan kullanıcı Şirket Detay listesinde görünüyor.

---

## Bölüm B — Şirket Web Ekranları

---

### B1 — Şirket Login

**Amaç:** Şirket kullanıcısının şirket paneline girmesi.

**Giriş Verisi:** E-posta + şifre, veya Google Sign-In, veya Microsoft Sign-In.

**Ana Aksiyonlar:**
- "Giriş Yap" → Firebase Auth → `companies/{cId}/members/{uid}` üyelik kontrolü → şirket aktif kontrolü → Fleet Setup'a yönlendirme.
- "Google ile Giriş" / "Microsoft ile Giriş" → aynı kontrol akışı.
- "Şifremi Unuttum" → Şifre sıfırlama e-postası.

**Hata Durumu:**
- Şirket pasifse: "Hesabınız askıya alınmıştır. Destek için iletişime geçin."
- Yanlış kimlik: "E-posta veya şifre hatalı."
- Üyelik bulunamazsa: "Bu hesapla ilişkili şirket bulunamadı."

**Kabul Kriterleri:**
- [ ] E-posta+şifre ile giriş yapıldığında doğru şirket paneline yönlendirme yapılıyor.
- [ ] Google/Microsoft Sign-In ile giriş çalışıyor.
- [ ] Pasif şirket kullanıcısı giriş yapamıyor.

---

### B2 — Fleet Setup — Şoförler Listesi + Şoför Oluştur/Düzenle

**Amaç:** Şirketteki şoförleri yönetmek.

**Giriş Verisi:** Firestore `drivers` koleksiyonu, company_id filtreli.

**Ana Aksiyonlar:**
- "Şoför Davet Et" → Form modal: ad, soyad, telefon, e-posta → davet e-postası gönderilir.
- Şoför satırına tıkla → Düzenleme modu.
- Şoför deaktif et.

**Görüntülenen Alanlar:** Ad soyad, telefon, durum (aktif/pasif/seferde), atanmış araç.

**Boş Durum:** "Henüz şoför eklenmemiş. İlk şoförünüzü ekleyin."

**Hata Durumu:** Aynı e-posta ile iki şoför: "Bu e-posta zaten kayıtlı."

**Kabul Kriterleri:**
- [ ] Şoför oluşturulduğunda Firebase Auth + Firestore `drivers` koleksiyonu + `companies/{cId}/members/{uid}` membership kaydı yazılıyor.
- [ ] Şoför davet e-postası ile kendi şifresini belirleyerek giriş yapabiliyor.
- [ ] Aktif seferde olan şoför deaktif edilmeye çalışılırsa uyarı gösteriyor.

---

### B3 — Fleet Setup — Araçlar Listesi + Araç Oluştur/Düzenle

**Amaç:** Şirketteki araçları yönetmek.

**Giriş Verisi:** Firestore `vehicles` koleksiyonu, company_id filtreli; şirketin araç limiti.

**Ana Aksiyonlar:**
- "Araç Ekle" → Form: plaka (zorunlu), marka/model, kapasite.
- Araç düzenle.
- Araç deaktif et.

**Boş Durum:** "Henüz araç eklenmemiş."

**Hata Durumu:**
- Aynı plaka: "Bu plaka zaten kayıtlı."

**Kabul Kriterleri:**
- [ ] Araç oluşturulabiliyor (araç limiti aşım engeli P1'de, MVP'de sınırlama yok).
- [ ] Oluşturulan araç listede görünüyor.
- [ ] Aktif ataması olan araç silinemez, hata veriyor.

---

### B4 — Fleet Setup — Rotalar Listesi + Rota Oluştur/Düzenle

**Amaç:** Sefer güzergahlarını ve duraklarını tanımlamak.

**Giriş Verisi:** Firestore `routes` koleksiyonu, company_id filtreli.

**Ana Aksiyonlar:**
- "Rota Ekle" → Ad, açıklama, durak listesi (en az 2 durak).
- Rota düzenle (ad, duraklar).
- Rota sil.

**Durak Girişi:** Adres metin girişi veya haritadan seçim (MVP: metin girişi yeterli, harita seçim P1).

**Boş Durum:** "Henüz rota eklenmemiş."

**Hata Durumu:**
- Durak sayısı < 2: "Rota en az 2 durak içermelidir."
- Aktif ataması olan rota silinmeye çalışılırsa: "Bu rotada aktif atama var. Önce atamayı kaldırın."

**Kabul Kriterleri:**
- [ ] Rota en az 2 durak ile oluşturuluyor.
- [ ] Duraklar düzenlenebiliyor ve sıralanabiliyor.
- [ ] Aktif atamalı rota silme engelleniyor.

---

### B5 — Fleet Setup — Atama Ekranı

**Amaç:** Şoför + Rota ikilisini birleştiren atama yapmak. Araç plakası şoför profilinden otomatik gelir.

**Giriş Verisi:** Aktif şoför listesi, aktif rota listesi; mevcut atamalar.

**Ana Aksiyonlar:**
- Şoför seç (dropdown, aktifler listelenir; seçilen şoförün plakası otomatik gösterilir).
- Rota seç (dropdown, aktifler listelenir).
- Başlangıç tarihi/saati gir (opsiyonel MVP, varsa gösterilir).
- "Atamayı Kaydet".

**Mevcut Atamalar Listesi:** Şoför adı, plaka (profilden), rota adı, durum (planlı/aktif/tamamlandı).

**Hata Durumu:**
- Şoför zaten aktif seferde: "Bu şoför zaten aktif bir seferde. (Rota adı)"
- Eksik seçim: "Şoför ve rota seçimi zorunludur."

**Kabul Kriterleri:**
- [ ] Aynı şoföre aynı anda iki atama yapılamıyor.
- [ ] Şoför seçildiğinde plakası otomatik gösteriliyor (profilden).
- [ ] Atama kaydedildiğinde Firestore `trips` belgesinde bağlantılar yazılıyor.
- [ ] Şoförün mobil uygulamasına atama anında yansıyor (Firestore realtime).

---

### B6 — Live Ops — Aktif Seferler Listesi (Risk Kuyruğu)

**Amaç:** Tüm aktif seferleri risk önceliğine göre sıralı göstermek.

**Giriş Verisi:** Firestore `trips` koleksiyonu, status=active ve company_id filtreli, realtime listener.

**Risk Sınıflandırması:**
- `critical` (kırmızı): Son konum güncellemesi > 10 dakika önce
- `warning` (sarı): Son konum güncellemesi 5-10 dakika önce
- `normal` (yeşil): Son konum güncellemesi < 5 dakika önce

**Görüntülenen Alanlar:** Şoför adı, rota adı, başlangıç saati, son konum zamanı, risk seviyesi etiketi.

**Ana Aksiyonlar:**
- Satıra tıkla → Sefer Detay Çekmecesi açılır.
- "Harita Görünümü" toggle → B7 ekranına geçiş.

**Boş Durum:** "Şu an aktif sefer bulunmuyor."

**Hata Durumu:** Firestore okuma hatası → "Seferler yüklenemedi. Sayfayı yenileyin."

**Kabul Kriterleri:**
- [ ] Critical seferler listenin üstünde görünüyor.
- [ ] Risk rengi 30 saniyede bir güncelleniyor (RTDB + Firestore realtime).
- [ ] 10 dakikadır konum gelmeyen sefer kırmızı olarak işaretleniyor.
- [ ] Satıra tıklandığında detay çekmecesi açılıyor.

---

### B7 — Live Ops — Harita Görünümü

**Amaç:** Aktif araçları harita üzerinde gerçek zamanlı izlemek.

**Giriş Verisi:** Trips koleksiyonundan aktif seferlerin son konum koordinatları.

**Ana Aksiyonlar:**
- Araç ikonuna tıkla → Sefer Detay Çekmecesi açılır.
- "Liste Görünümü" toggle → B6 ekranına geçiş.

**Boş Durum:** Harita yüklü, aktif araç ikonu yok. "Aktif araç bulunmuyor."

**Hata Durumu:** Harita yükleme hatası → "Harita yüklenemedi."

**Kabul Kriterleri:**
- [ ] Aktif seferdeki araçlar haritada ikonla gösteriliyor.
- [ ] İkon konumu RTDB `locations/{routeId}` güncellemesiyle gerçek zamanlı kayıyor.
- [ ] İkon rengi risk seviyesini yansıtıyor (kırmızı/sarı/yeşil).
- [ ] İkona tıklandığında detay çekmecesi açılıyor.

---

### B8 — Sefer Detay Çekmecesi

**Amaç:** Seçili sefer hakkında hızlı müdahale için tam bilgi sunmak.

**Giriş Verisi:** Seçili `trip` belgesi, bağlantılı driver ve vehicle belgeleri.

**Görüntülenen Alanlar:**
- Sefer ID, rota adı, başlangıç saati
- Şoför adı, telefon numarası
- Araç plaka, marka/model
- Son bilinen konum (koordinat + "X dakika önce" etiketi)
- Risk seviyesi etiketi

**Hızlı Aksiyonlar:**
- "Şoförü Ara" → `tel:` şemasıyla telefon çağrısı.
- "Takip Linkini Kopyala" → Panoya kısa takip URL'si kopyalanır.

**Kapatma:** Çekmece kapama ikonu veya arka plana tıklama.

**Hata Durumu:** Sefer verisi yüklenemezse → "Sefer detayı alınamadı."

**Kabul Kriterleri:**
- [ ] Çekmece listeden ve harita ikonundan açılıyor.
- [ ] Şoför telefon numarası görünüyor ve "Şoförü Ara" çalışıyor.
- [ ] "Takip Linkini Kopyala" çalışıyor ve geçerli URL kopyalanıyor.
- [ ] Çekmece kapatıldığında liste/harita görünümüne dönülüyor.

---

## Bölüm C — Şoför Mobil Ekranları

---

### C1 — Şoför Mobil Login

**Amaç:** Şoförün mobil uygulamaya kimlik doğrulaması ile girmesi.

**Giriş Verisi:** E-posta + şifre veya Google Sign-In.

**Ana Aksiyonlar:**
- "Giriş Yap" → Firebase Auth → `users/{uid}.role == 'driver'` kontrolü → Bugünkü Seferim ekranına.
- "Google ile Giriş" → Firebase Auth (Google Sign-In) → aynı kontrol.
- "Şifremi Unuttum" → Reset e-postası.

**Hata Durumu:**
- Yanlış kimlik: "E-posta veya şifre hatalı."
- Şirket pasif: "Hesabınız aktif değil. Yöneticinizle iletişime geçin."
- Konum izni reddedilmişse (sefer başlatılmaya çalışıldığında): "Konum izni gerekli."

**Kabul Kriterleri:**
- [ ] Doğru kimlikle giriş yapıldığında Bugünkü Seferim açılıyor.
- [ ] Google Sign-In ile giriş çalışıyor.
- [ ] Driver rolü olmayan kullanıcı ile giriş denemesi reddediliyor.

---

### C2 — Bugünkü Seferim (Ana Ekran)

**Amaç:** Şoförün kendisine atanmış seferi tek bakışta görmesi ve seferi başlatması.

**Giriş Verisi:** Firestore'dan `trips` koleksiyonu, `driver_id == uid` ve `status in ['assigned', 'active']` filtreli.

**Ana Aksiyonlar:**
- "Seferi Başlat" butonu (atama varsa görünür, yoksa görünmez).
- Sefer detayına git (durak listesi için sefer adına tıklama).

**Görüntülenen Alanlar:**
- Rota adı, tahmini başlangıç saati, durak sayısı.
- Şoför profilindeki araç plakası.

**Boş Durum:** "Bugün için atanmış sefer bulunmuyor."

**Hata Durumu:** Veri yüklenemezse: "Sefer bilgisi alınamadı. İnternet bağlantınızı kontrol edin."

**Kabul Kriterleri:**
- [ ] Atanmış sefer varsa "Seferi Başlat" butonu görünüyor.
- [ ] Atama yoksa boş durum mesajı görünüyor.
- [ ] Sefer adına tıklandığında C3 Sefer Detayı açılıyor.

---

### C3 — Sefer Detayı

**Amaç:** Rota ve durakların görüntülenmesi.

**Giriş Verisi:** Bağlantılı `route` belgesi, durak listesi.

**Görüntülenen Alanlar:**
- Rota adı, durak listesi (sıralı), her durak için ad/adres.

**Ana Aksiyonlar:**
- "Geri" → C2 Ana Ekrana.
- Sefer başlatılmışsa "Seferi Bitir" buradan da erişilebilir.

**Boş Durum:** Durak listesi boşsa: "Durak bilgisi bulunamadı."

**Kabul Kriterleri:**
- [ ] Duraklar doğru sırayla listeleniyor.
- [ ] Başlatılmış sefer aktif ekrana (C4) yönlendiriyor.

---

### C4 — Sefer Aktif Ekranı

**Amaç:** Sefer süresince konum akışının çalıştığını göstermek ve seferi bitirmek.

**Giriş Verisi:** Aktif trip belgesi, cihaz konum servisi.

**Görüntülenen Alanlar:**
- "Sefer Aktif" durumu göstergesi.
- Geçen süre sayacı.
- Atanmış rota adı.
- "Seferi Bitir" butonu.

**Ana Aksiyonlar:**
- "Seferi Bitir" → Onay dialogu: "Seferi bitirmek istediğinize emin misiniz?" → Evet → konum akışı durur, trip status `completed` → Tamamlandı ekranı.

**Hata Durumu:**
- Konum izni iptal edildiyse: "Konum izni gerekli. Lütfen ayarlardan etkinleştirin." + Seferi durdurma seçeneği.
- İnternet kesilirse: offline önbelleğe alım başlar, "Çevrimdışı - konum kaydediliyor" uyarısı gösterilir.

**Kabul Kriterleri:**
- [ ] Sefer başladığında RTDB `locations/{routeId}` path'ine ~1-3 saniyede bir konum yazılıyor.
- [ ] "Seferi Bitir" + onay sonrası konum akışı duruyor.
- [ ] Trip status Firestore'da `completed` oluyor, RTDB konum yazımı durduruluyor.
- [ ] Uygulama arka planda olduğunda konum akışı devam ediyor.
- [ ] Konum izni yoksa sefer başlatılamıyor.

---

### C5 — Sefer Tamamlandı

**Amaç:** Seferin başarıyla tamamlandığını onaylamak.

**Ana Aksiyonlar:** "Ana Ekrana Dön" → C2 (boş durum).

**Kabul Kriterleri:**
- [ ] "Sefer Tamamlandı" mesajı gösteriliyor.
- [ ] Ana ekrana dönüldüğünde tamamlanan sefer listede görünmüyor.

---

## Bölüm D — Yolcu/Misafir Mobil Ekranları

---

### D1 — Takip Girişi

**Amaç:** srvCode girerek, QR okutarak veya deep link ile canlı takip ekranına erişmek.

**Giriş Verisi:**
- Manuel: srvCode input (6 karakter, örn: `A3X9KP`)
- QR: Kamera ile QR kod okutma → srvCode otomatik doldurulur
- Deep link: `neredeservis.app/track/{srvCode}` formatıyla otomatik dolu

**Ana Aksiyonlar:**
- "Takibi Başlat" → `getActiveTrip(srvCode)` callable → D2 ekranına yönlendirme.

**Hata Durumu:**
- Geçersiz kod: "Bu takip kodu bulunamadı. Kodu kontrol edin veya şirketten yeni kod isteyin."
- Sefer tamamlandıysa: "Bu sefer tamamlanmıştır."
- Sefer henüz başlamadıysa: "Sefer henüz başlamadı. Tahmini başlangıç: [saat]" (saat bilgisi varsa).

**Kabul Kriterleri:**
- [ ] Geçerli ve aktif srvCode ile D2 açılıyor.
- [ ] QR kod okutma ile srvCode otomatik dolduruluyor.
- [ ] Geçersiz kod hata mesajı gösteriyor.
- [ ] Deep link uygulamayı açıp kodu otomatik dolduruyor.

---

### D2 — Canlı Takip

**Amaç:** Aracın canlı konumunu harita üzerinde izlemek.

**Giriş Verisi:** Seçili trip belgesi (RTDB realtime listener `locations/{routeId}`); konum koordinatları.

**Görüntülenen Alanlar:**
- Harita + araç ikonu (gerçek zamanlı)
- Sefer bilgisi paneli (rota adı, son güncelleme zamanı)
- Opsiyonel: basit "X durak kaldı" gösterimi (gerçek ETA hesaplaması P2)

**Ana Aksiyonlar:**
- "Duyurular" sekmesine geçiş → D3.
- Uygulama kapatma (anonymous oturum, veri tutulmaz).

**Boş Durum:** Araç henüz hareket etmediyse: "Araç henüz hareket etmedi."

**Hata Durumu:**
- Konum 5 dakikadır gelmiyorsa: "Son güncelleme: X dakika önce. Bağlantı sorunu yaşanıyor olabilir."
- Sefer tamamlandıysa (realtime güncelleme): "Bu sefer tamamlanmıştır."

**Kabul Kriterleri:**
- [ ] Araç ikonu konum güncellemesiyle haritada kayıyor.
- [ ] "Son güncelleme" zamanı gösteriliyor.
- [ ] Sefer bittiğinde ekran "Sefer Tamamlandı" durumuna geçiyor.

---

### D3 — Duyurular

**Amaç:** Şirketin yayımladığı bildirimleri listelemek.

**Giriş Verisi:** Firestore `announcements` koleksiyonu, trip veya company bazlı (MVP: company bazlı yeterli).

**Görüntülenen Alanlar:** Duyuru başlığı, içerik, yayım tarihi.

**Boş Durum:** "Şu an yayımlanan duyuru bulunmuyor."

**Kabul Kriterleri:**
- [ ] Şirketin eklediği duyurular listede görünüyor.
- [ ] Duyuru yoksa boş durum mesajı görünüyor.

---

## Yönetici Özeti

**En Kritik 10 Karar:**
1. A5 ekranı (Kullanıcı Davet) Platform Owner akışındadır; şirket panelinden kullanıcı oluşturma ekranı yoktur.
2. B5 Atama ekranında şoför çakışması sistem tarafından engellenir, uyarıyla geçilemez. Atama = Şoför + Rota (ikili); araç plakası profilden gelir.
3. C4 Sefer Aktif Ekranı'nda konum izni yoksa sefer başlatılamaz — bu kesin kural.
4. C4 arka plan konum çalışması zorunludur; uygulama kapatılsa konum akışı devam eder. Konum RTDB'ye yazılır.
5. Tüm listelerde boş durum ekranları zorunludur; boş liste = hata değil.
6. Şirket paneline giriş sonrası ilk ekran: kullanıcı daha önce sefer kurmuşsa Live Ops, ilk kez giriyorsa Fleet Setup.
7. D1 deep link formatı `neredeservis.app/track/{srvCode}` olarak sabitlendi. QR kod okutma da desteklenir.
8. B8 Çekmece "Şoförü Ara" butonu `tel:` şemasıyla telefon uygulamasını açar.
9. Tüm hata durumları kullanıcıya Türkçe okunabilir mesajla gösterilir; teknik hata kodu gösterilmez.
10. Sefer tamamlandığında (C5 → C2) atama bilgisi korunur ama "aktif sefer" olmaktan çıkar.

> **Not:** Bu dosyanın tüm açık soruları `10_KESINLESTIRILMIS_MVP_KARAR_SETI_2026-03-02.md` dosyasında kesin karara bağlanmıştır.
