# Rol Bazlı Detaylı Yetki ve İş Akışları

Tarih: 2026-03-02
Durum: AKTİF
Bağımlılık: 01, 02, 03 dokümanları

---

## ROL 1 — SaaS Sahibi (Platform Owner)

### 1.1 Rol Tanımı
Platformun sahibi ve teknik/ticari operatörüdür. Şirketleri (tenant) sisteme alır, kapasite ve kullanıcılarını tanımlar, platform durumunu izler. Bu rol NeredeServis'i bir SaaS ürünü olarak pazarlar ve müşteri şirketlere teslim eder.

Giriş kanalı: **Yalnızca web (Platform Panel)**. Mobil erişim yoktur, olmamalıdır.

### 1.2 Çözdüğü İşler (JTBD)
1. Satış sonrası müşteri şirketi sisteme hızlı almak.
2. Şirket başına araç kapasitesini sözleşmeye göre kilitlemek.
3. Şirket kullanıcılarını standart bir akışla oluşturmak.
4. Platform genelinde tüm tenant durumunu tek ekranda görmek.
5. Sorunlu veya ödeme aşılan şirketi hızla dondurmak.

### 1.3 Çözdüğü Somut Problemler
- Şirket açılışı maillerin/telefonların arasında kayboluyordu → Panel üzerinden tek akış.
- Araç hakkı sözlü kayıt ediliyordu → Sayısal limit tanımlama ve aşım uyarısı.
- Hangi şirketin hangi durumda olduğu bilinmiyordu → Şirket listesinde durum sütunu.
- Yanlış kullanıcıya erişim veriliyordu → Kullanıcı oluşturma yetki SaaS Sahibi'nde, şirkette değil.

### 1.4 Ürünün Bu Problemlere Cevabı
| Problem | Çözüm |
|---|---|
| Şirket açılış süreci dağınık | `Şirket Oluştur` formu: ad, e-posta, araç limiti, durum |
| Kapasite yönetimi subjektif | Her şirkete sayısal `vehicle_limit` alanı, aşım kilitlemesi |
| Kullanıcı açılışı standartsız | `Kullanıcı Davet` akışı: e-posta davet linki → kullanıcı kendi şifresini belirler |
| Tenant durumu izlenemez | Şirketler listesi: ad, vehicle_limit, aktif kullanıcı sayısı, durum (aktif/pasif) |
| Sorunlu tenant etkisiz bırakılamaz | `Aktif/Pasif` toggle → pasif şirket kullanıcıları giriş yapamaz |

### 1.5 Erişeceği Ekranlar
1. **Platform Login** — platform paneline giriş
2. **Şirketler Listesi** — tüm tenant'ların özet görünümü
3. **Şirket Oluştur** — yeni tenant forma girişi
4. **Şirket Detayı** — seçili şirketin kullanıcı listesi, limiti, durumu
5. **Kullanıcı Oluştur** — şirket kullanıcısı açma (şirket detayı içinden)
6. **Platform Ayarları** — platform seviyesinde global konfigürasyon (MVP'de minimal)

### 1.6 Yapabileceği İşlemler
- Yeni şirket oluşturmak (ad, araç limiti, iletişim bilgisi)
- Şirkete kullanıcı davet etmek (e-posta ile davet linki → kullanıcı kendi şifresini belirler)
- Şirketin araç limitini düzenlemek
- Şirketi aktif/pasif yapmak
- Şirket detayını görüntülemek
- Şirket kullanıcısını deaktif etmek

### 1.7 Yapamayacağı İşlemler (KESİN SINIR)
- Şirketin şoförlerine, araçlarına, rotalarına, seferlerine **doğrudan erişemez ve düzenleyemez** (denetim/destek senaryosu MVP dışı).
- Başka bir Platform Owner hesabı oluşturamaz (superadmin tek).
- Şoför veya yolcu mobil ekranlarına erişemez.
- Fatura, muhasebe, ödeme işlemi yapamaz (MVP dışı).

### 1.8 Günlük Kullanım Akışı
1. Platform paneline e-posta + şifre ile giriş yap.
2. Şirketler listesini aç → yeni müşteri varsa `Şirket Oluştur` tıkla.
3. Şirket adı, araç limiti, iletişim e-postasını gir → oluştur.
4. Şirket detayına git → `Kullanıcı Davet Et` ile ilk kullanıcı e-postasını gir → davet linki gönderilir.
5. Şirketi `Aktif` durumuna al.
6. Gerekirse listeye dön, pasif şirketler varsa durum sütununda gör.

### 1.9 Başarı Metrikleri
- Yeni şirket açılışından aktifleşmeye kadar geçen süre (hedef: < 10 dakika)
- Kapasite aşımı olay sayısı (hedef: 0)
- SaaS Sahibi'nin manuel müdahale sayısı / şirket (hedef: azalan)

### 1.10 Kritik İstisna ve Hata Senaryoları
| Senaryo | Beklenen Davranış |
|---|---|
| Aynı e-posta ile ikinci kullanıcı oluşturma | Form hata verir: "Bu e-posta zaten kullanımda" |
| Araç limiti 0 girilirse | Form validasyon hatası: "Limit en az 1 olmalıdır" |
| Pasif şirket kullanıcısı giriş yaparsa | Giriş engellenir: "Hesabınız askıya alınmış, yöneticinizle iletişime geçin" |
| Platform paneli oturumu düşerse | Login sayfasına yönlendirilir, işlem kaydedilmez |

---

## ROL 2 — Şirket (Web)

### 2.1 Rol Tanımı
Kendi şirketinin tüm operasyonunu yöneten tek roldür. İç rol ayrımı (admin/viewer/dispatcher) yoktur. Bu kullanıcı hem kurulum hem de canlı operasyon sorumlusudur.

Giriş kanalı: **Yalnızca web (Şirket Paneli)**. Mobil erişim yoktur.

### 2.2 Çözdüğü İşler (JTBD)
1. Şoför, araç, rota kaydını hızlı tamamlamak.
2. Şoför-rota atamasını tek yerde bitirmek.
3. Canlı operasyonda riskli seferi erkenden tespit etmek.
4. Riskli sefere hızlı aksiyon almak.

### 2.3 Çözdüğü Somut Problemler
- Şoför/araç/rota kayıtları farklı sistemlerde dağınıktı → Fleet Setup tek çalışma alanı.
- Atama hatası sefer başlamadan fark edilemiyordu → Atama formu: şoförsüz sefer oluşturulamaz.
- Saha sorunları geç fark ediliyordu → Risk kuyruğu (critical/warning/stale) otomatik sıralıyor.
- Sorun anında iletişim bilgisi bulunamıyordu → Detay çekmecesinde şoför iletişim bilgisi anlık erişilebilir.

### 2.4 Ürünün Bu Problemlere Cevabı
| Problem | Çözüm |
|---|---|
| Kurulum dağınık | Fleet Setup: şoför + araç + rota CRUD tek sayfada |
| Atama hatalı | Atama formu: şoför seç → rota seç → kaydet (ikisi zorunlu; araç plakası şoför profilinden gelir) |
| Risk geç görülüyor | Live Ops risk kuyruğu: critical (kırmızı) > warning (sarı) > stale (gri) |
| Müdahale yavaş | Detay çekmece: şoför adı, tel, sefer durumu, son konum, hızlı aksiyon butonları |

### 2.5 Erişeceği Ekranlar
**Fleet Setup:**
1. Şoförler listesi + Şoför Oluştur/Düzenle
2. Araçlar listesi + Araç Oluştur/Düzenle
3. Rotalar listesi + Rota Oluştur/Düzenle
4. Atama ekranı (şoför+rota birleştiren form; araç plakası şoför profilinden otomatik gelir)

**Live Ops:**
5. Aktif Seferler listesi (risk kuyruğu sıralı)
6. Harita görünümü (aktif araçlar gerçek zamanlı)
7. Sefer Detay Çekmecesi (harita veya listeden açılır)

**Ortak:**
8. Şirket Ayarları (temel şirket bilgileri, bildirim tercihi — MVP'de minimal)

### 2.6 Yapabileceği İşlemler
- Şoför oluşturmak, düzenlemek, deaktif etmek
- Araç oluşturmak, düzenlemek, deaktif etmek
- Rota oluşturmak (duraklar dahil), düzenlemek, silmek
- Şoför-rota ataması yapmak ve güncellemek
- Aktif seferleri listelemek ve haritada izlemek
- Risk sıralamasına göre kritik seferlere öncelik vermek
- Sefer detay çekmecesini açmak
- Hızlı aksiyonlar: şoförü aramak, sefer linkini kopyalamak

### 2.7 Yapamayacağı İşlemler (KESİN SINIR)
- Başka şirketlerin verilerine **hiçbir şekilde erişemez**.
- Platform seviyesinde ayar yapamaz (araç limiti, şirket durumu vs.).
- Kendi şirketine yeni kullanıcı davet edemez (bu yetki SaaS Sahibi'nde).
- Şoför veya yolcu mobil ekranlarına erişemez.
- Geçmiş seferlerin konum geçmişini export edemez (MVP dışı).

### 2.8 Günlük Kullanım Akışı
**Kurulum günü (tek sefer):**
1. Web panele giriş → Fleet Setup'ı aç.
2. Şoför ekle (ad, telefon, plaka, giriş e-postası).
3. Rota ekle (ad, duraklar, güzergah bilgisi).
4. Atama yap: şoförü seç → rotayı seç → kaydet (araç plakası şoför profilinden otomatik gelir).

**Operasyon günü (her gün):**
1. Web panele giriş → Live Ops'u aç.
2. Risk kuyruğunu tara: kırmızı (critical) varsa detay çekmecesini aç.
3. Şoförle iletişime geç veya gerekli aksiyonu al.
4. Harita görünümünde tüm araçların pozisyonunu gör.
5. Seferler tamamlandıkça listeden çıktığını doğrula.

### 2.9 Başarı Metrikleri
- Fleet Setup tamamlama süresi: şoför+rota+atama (hedef: < 15 dakika)
- Riskli sefere ilk müdahale süresi (hedef: < 3 dakika)
- Günlük operasyonda yanlış atama sayısı (hedef: 0)

### 2.10 Kritik İstisna ve Hata Senaryoları
| Senaryo | Beklenen Davranış |
|---|---|
| Aynı şoföre aynı anda iki atama | Sistem ikinci atamayı engeller: "Bu şoför zaten aktif seferde" |
| Araç limiti aşılırsa araç eklemeye çalışmak | P1'de: Form hata verir: "Araç limitinize ulaştınız." (MVP'de limit enforcement yok) |
| Live Ops'ta konum gelmeyen araç | Sefer "stale" olarak işaretlenir, risk kuyruğuna alınır |
| Oturum süresi dolarsa | Mevcut işlem kaydedilmez, login sayfasına yönlendirilir |
| Rota silinmek istenirken aktif ataması varsa | Silme engellenir: "Bu rotada aktif atama var, önce atamayı kaldırın" |

---

## ROL 3 — Şoför (Mobil)

### 3.1 Rol Tanımı
Kendisine atanmış seferi sahada icra eden mobil kullanıcıdır. Atama ve yetkilendirme tamamen şirket tarafından yapılır; şoförün yapmadığı atamanın hiçbir parçasına erişimi yoktur.

Giriş kanalı: **Yalnızca mobil uygulama**. Web erişimi yoktur, verilmeyecektir.

### 3.2 Çözdüğü İşler (JTBD)
1. "Bugün hangi rota bende?" sorusunu anında yanıtlamak.
2. Seferi doğru adımlarla başlatmak.
3. Sefer süresince operasyon merkezine durum bildirmek.
4. Seferi doğru adımlarla bitirmek.

### 3.3 Çözdüğü Somut Problemler
- Şoförler sabah kime soracaklarını bilmiyordu → Ekran açılışında atanmış sefer direkt görünür.
- Sefer başlatma/bitirme adımları karmaşıktı → Tek büyük buton: "Seferi Başlat", "Seferi Bitir".
- Operasyon merkezi araçların nerede olduğunu bilemiyordu → Sefer başlar başlamaz konum akışı otomatik başlar.

### 3.4 Ürünün Bu Problemlere Cevabı
| Problem | Çözüm |
|---|---|
| Hangi rota bende belirsiz | `Bugünkü Seferim` ekranı: rota adı, duraklar, başlangıç saati |
| Başlatma adımları karmaşık | Ana ekranda tek buton: "Seferi Başlat" (atama yoksa buton gözükmez) |
| Konum bildirimi unutulur | Sefer başladığında arka planda konum push otomatik devreye girer |
| Bitiş onayı yok | Sefer bitir butonu + onay dialogu: "Seferi bitirmek istediğinize emin misiniz?" |

### 3.5 Erişeceği Ekranlar
1. **Mobil Login** — e-posta + şifre veya Google Sign-In
2. **Bugünkü Seferim** — atanmış rota/sefer özeti (ana ekran)
3. **Sefer Detayı** — rota durakları, güzergah, başlangıç saati
4. **Sefer Aktif Ekranı** — konum akışı aktif, "Seferi Bitir" butonu

### 3.6 Yapabileceği İşlemler
- Mobil uygulamaya giriş yapmak
- Atanmış seferin detayını görüntülemek
- Seferi başlatmak
- Sefer süresince konum akışı göndermek (otomatik, arka planda)
- Seferi bitirmek

### 3.7 Yapamayacağı İşlemler (KESİN SINIR)
- Atanmadığı rotaları veya seferleri **görüntüleyemez**.
- Kendi profilini düzenleyemez (bu yetki şirkette).
- Başka şoförlerin sefer bilgilerine erişemez.
- Web paneline hiçbir şekilde erişemez.
- Konum akışını manuel olarak durduramaz (sefer bitirme tek çıkış yoludur).
- Şirket ayarlarını, araç bilgilerini, rota tanımlarını göremez.

### 3.8 Günlük Kullanım Akışı
1. Mobil uygulamayı aç.
2. E-posta + şifre ile giriş yap.
3. Ana ekranda `Bugünkü Seferim` görünür: rota adı, başlangıç saati, durak listesi.
4. Hazır olduğunda `Seferi Başlat` butonuna bas.
5. Uygulama arka planda konum akışı başlatır.
6. Rota boyunca durakları takip et.
7. Son durağa ulaşınca `Seferi Bitir` butonuna bas → onay dialogunda onayla.
8. Ekran "Sefer Tamamlandı" mesajı gösterir, butonlar kaybolur.

### 3.9 Başarı Metrikleri
- Sefer başlatma tamamlanma oranı (hedef: > %95)
- Sefer bitirme tamamlanma oranı (hedef: > %95)
- Konum akışı kopma oranı (hedef: < %5)
- "Seferim nerede?" için şirkete gelen şoför çağrısı sayısı (hedef: 0)

### 3.10 Kritik İstisna ve Hata Senaryoları
| Senaryo | Beklenen Davranış |
|---|---|
| Atanmış sefer yoksa | Ana ekran: "Bugün için atanmış sefer bulunmuyor" |
| İnternet bağlantısı kesilirse | Uygulama offline modda konum önbelleğe alır, bağlantı gelince gönderir |
| Sefer başlatılmış ama uygulama kapanırsa | Arka plan konum servisi devam eder, uygulama açılınca aktif sefer gösterilir |
| Aynı kullanıcı iki cihazdan giriş yaparsa | İkinci cihaz oturumu düşürür: "Başka bir cihazdan giriş yapıldı" |
| Konum izni reddedilirse | Sefer başlatma engellenir: "Uygulama konum iznine ihtiyaç duyuyor" |

---

## ROL 4 — Yolcu/Misafir (Mobil)

### 4.1 Rol Tanımı
Servis takibini yapan son kullanıcıdır. "Yolcu" kayıtlı kullanıcı, "misafir" kayıt gerektirmeden takip yapan kullanıcıdır. İkisi aynı izleme kapsamına sahiptir; MVP'de ikisi arasında pratik fark yoktur.

Giriş kanalı: **Yalnızca mobil uygulama**. Web erişimi yoktur.

### 4.2 Çözdüğü İşler (JTBD)
1. "Servis nerede şu an?" sorusunu canlı harita ile yanıtlamak.
2. "Tahminen ne zaman gelir?" bilgisine ulaşmak.
3. Güzergah veya sefer değişikliği olduğunda haberdar olmak.

### 4.3 Çözdüğü Somut Problemler
- Şirketi/şoförü aramak zorunda kalınıyordu → Canlı takip ekranı bu ihtiyacı kaldırır.
- Duyurular WhatsApp/SMS üzerinden dağınık geliyordu → Uygulama içi duyuru ekranı.

### 4.4 Ürünün Bu Problemlere Cevabı
| Problem | Çözüm |
|---|---|
| Servisin konumu bilinmiyor | `Canlı Takip` ekranı: harita üstünde araç gerçek zamanlı |
| Varış süresi bilinmiyor | Sefer bilgisi paneli: tahmini varış (konum bazlı hesap, MVP basit) |
| Duyuru kanalı dağınık | `Duyurular` sekmesi: şirketin girdiği bildirimleri listeler |

### 4.5 Erişeceği Ekranlar
1. **Takip Girişi** — srvCode (6 karakter) elle veya QR kod ile, ya da deep link ile seçili sefere bağlanma
2. **Canlı Takip** — harita + araç ikonu anlık konum + sefer bilgisi panel
3. **Duyurular** — şirketin yayımladığı bildirimler listesi

### 4.6 Yapabileceği İşlemler
- srvCode'u girerek, QR okutarak veya şirketin paylaştığı deep link'e tıklayarak takip ekranına erişmek
- Canlı konumu haritada izlemek
- Temel sefer bilgilerini görüntülemek (rota adı, tahmini süre, durak sayısı)
- Duyuruları görüntülemek

### 4.7 Yapamayacağı İşlemler (KESİN SINIR)
- Sefer veya rotada herhangi bir değişiklik yapamaz.
- Başka kullanıcıların takip bilgilerine erişemez.
- Şoförle doğrudan iletişim kuramaz (MVP'de mesajlaşma yok).
- Şirket veya platform yönetim işlemlerine erişemez.
- Takip ettiği seferden başka hiçbir şirket/rota/araç verisini göremez.

### 4.8 Günlük Kullanım Akışı
1. Şirketin paylaştığı deep link'i aç veya uygulamayı aç + srvCode gir (ya da QR okut).
2. `Canlı Takip` ekranı yüklenir: haritada araç, sefer bilgisi paneli.
3. Araç ikonunu izle, tahmini varış bilgisini gör.
4. Gerekirse `Duyurular` sekmesini kontrol et.
5. Araç geldiğinde / sefer bittiğinde ekran "Sefer Tamamlandı" durumuna geçer.

### 4.9 Başarı Metrikleri
- Takip ekranı hatasız yükleme oranı (hedef: > %99)
- "Servis nerede?" için şirkete gelen destek çağrısı azalımı (hedef: > %60 azalma)
- Takip ekranında ortalama kalma süresi (gösterge metrik)

### 4.10 Kritik İstisna ve Hata Senaryoları
| Senaryo | Beklened Davranış |
|---|---|
| Geçersiz takip kodu | "Bu takip kodu bulunamadı. Kodu kontrol edin." |
| Sefer henüz başlamamışsa | "Sefer henüz başlamadı. [Tahmini başlangıç saati] bekleniyor." |
| Sefer tamamlandıysa | "Bu sefer tamamlanmıştır." |
| Konum güncellemesi gelmediyse | Son bilinen konum gösterilir + "Son güncelleme: X dakika önce" uyarısı |
| Şirket pasife alındıysa | Takip ekranı: "Bu takip bağlantısı artık aktif değil." |

---

## Yönetici Özeti

**En Kritik 10 Karar:**
1. Şirket içi alt rol yoktur; tek şirket kullanıcısı her şeyi yapabilir.
2. Şirket kullanıcısını yalnızca SaaS Sahibi oluşturur.
3. Şoför ve Yolcu/Misafir hiçbir koşulda web paneline giremez.
4. SaaS Sahibi şirketin saha operasyonuna müdahale edemez (MVP'de).
5. Konum akışını durdurmak için tek yol seferi bitirmektir.
6. Araç limiti aşıldığında araç ekleme engellenir, SaaS Sahibi ile iletişim şartı.
7. Yolcu ve Misafir aynı teknik kapsamda; ayrı ekran/akış yoktur.
8. Atama: şoförsüz sefer oluşturulamaz (araç plakası şoför profilinden gelir).
9. Risk kuyruğu (critical/warning/stale) şirket tarafı için default görünüm sıralamasıdır.
10. Oturum düştüğünde kaydedilmemiş işlem kaybolur; kullanıcı uyarılmadı.

> **Not:** Bu dosyanın tüm açık soruları `10_KESINLESTIRILMIS_MVP_KARAR_SETI_2026-03-02.md` dosyasında kesin karara bağlanmıştır.
