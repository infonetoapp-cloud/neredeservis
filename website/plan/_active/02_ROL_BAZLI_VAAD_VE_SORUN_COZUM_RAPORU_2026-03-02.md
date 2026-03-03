# Rol Bazlı Vaad ve Sorun Çözüm Raporu

Tarih: 2026-03-02
Durum: AKTİF
Kapsam: SaaS Sahibi, Şirket, Şoför, Yolcu/Misafir

## 1. Yönetici Özeti
Bu SaaS'in iş değeri, rol başına farklı sürtünmeyi azaltmasıdır:

- SaaS Sahibi için: satış sonrası kurulum ve tenant yönetimini standardize eder.
- Şirket için: günlük operasyonu tek panelde ve hızlı şekilde yürütür.
- Şoför için: görev belirsizliğini ortadan kaldırır, sefer akışını netleştirir.
- Yolcu/Misafir için: "servis nerede" belirsizliğini canlı görünürlükle çözer.

## 2. Rol 1 - SaaS Sahibi (Platform Owner)

## 2.1 Rol Tanımı
Ürünün sahibi olan ana operatördür. Şirketleri sisteme alır, müşteri hesaplarını açar, kapasiteyi yönetir ve platformun üst kontrolünü elinde tutar.

## 2.2 Çözdüğü Sorunlar
- Satış yapılan şirketi sisteme alma süreci dağınık ve manuel.
- Şirket kullanıcı açılışında standart yok, onboarding gecikiyor.
- Her şirkete verilecek kapasite (araç hakkı) net yönetilemediğinde gelir kaçağı ve operasyon kaosu oluşuyor.
- Platform genelinde hangi şirketin hangi durumda olduğu tek ekranda izlenemiyor.

## 2.3 SaaS'in Bu Role Vaadi
- "Müşteri şirketi dakikalar içinde açar, kullanıcılarını oluşturur ve kapasitesini kontrollü şekilde tahsis edersin."
- "Platform kontrolü dağılmaz; tüm tenantların yönetimi tek panelde olur."

## 2.4 Yetkiler (MVP)
- Şirket oluşturma
- Şirkete başlangıç kullanıcıları oluşturma
- Şirket bazlı araç kapasitesi limiti tanımlama
- Şirketin aktif/pasif durumunu yönetme
- Platform seviyesinde kritik ayarlara erişim

## 2.5 Erişim Dışı Alanlar
- Şirketin günlük saha operasyonuna doğrudan müdahale etmez (istisna: destek/denetim senaryosu).

## 2.6 Ana Akışlar
1. Şirket satış kaydı sonrası şirket hesabı açılır.
2. Şirketin ilk kullanıcıları tanımlanır.
3. Araç kapasite limiti atanır.
4. Şirket aktive edilir ve teslim edilir.

## 2.7 Başarı Metrikleri
- Yeni şirket aktivasyon süresi
- Onboarding sırasında manuel geri dönüş sayısı
- Kapasite aşımı/eksik tahsis olay sayısı

## 3. Rol 2 - Şirket (Tek Rol, Web)

## 3.1 Rol Tanımı
Şirket tarafında tüm operasyonu yürüten tek roldür. İç role ayrım yoktur.

## 3.2 Çözdüğü Sorunlar
- Şoför, araç, rota kurulumu farklı ekranlarda dağınık.
- Atama süreçleri yavaş ve hata üretmeye açık.
- Canlı operasyonda riskli sefer geç fark ediliyor.
- Sorun anında iletişim ve müdahale adımları zaman kaybettiriyor.

## 3.3 SaaS'in Bu Role Vaadi
- "Kurulumdan canlı operasyona kadar tüm işi tek panelde, minimum tıklama ile bitirirsin."
- "Riskli seferi erkenden görür, hızlı aksiyon alırsın."

## 3.4 Yetkiler (MVP)
- Şirket içi şoför/araç/rota oluşturma ve güncelleme
- Şoför-rota ataması
- Aktif seferleri canlı izleme
- Risk kuyruğuna göre önceliklendirme
- Hızlı operasyon aksiyonları (detay açma, paylaşım, iletişim)

## 3.5 Erişim Dışı Alanlar
- Başka şirketlerin verilerine erişemez.
- Platform seviyesinde kapasite/tenant ayarlarına erişemez.

## 3.6 Ana Akışlar
1. Fleet Setup içinde şoför, araç, rota hazırlanır.
2. Atamalar tek bağlamda tamamlanır.
3. Live Ops ekranında aktif seferler izlenir.
4. Riskli seferde müdahale akışı tetiklenir.

## 3.7 Başarı Metrikleri
- Kurulum tamamlama süresi (şoför+rota+atama)
- Riskli sefere ilk müdahale süresi
- Gün içi operasyon kesinti/aksama sayısı

## 4. Rol 3 - Şoför (Mobil)

## 4.1 Rol Tanımı
Kendisine atanmış operasyonu sahada icra eden mobil kullanıcıdır.

## 4.2 Çözdüğü Sorunlar
- "Bugün hangi rota bende?" belirsizliği
- Sefer başlangıç/bitiş adımlarında karışıklık
- Operasyon merkezine durum bildiriminde gecikme

## 4.3 SaaS'in Bu Role Vaadi
- "Görevin net görünür, seferi adım adım güvenli şekilde tamamlarsın."

## 4.4 Yetkiler (MVP)
- Mobil giriş
- Atanmış rota/sefer detayını görüntüleme
- Sefer başlat/bitir
- Canlı konum akışı gönderme

## 4.5 Erişim Dışı Alanlar
- Atanmadığı rota/seferi göremez.
- Web panel işlemlerine erişemez.
- Şirket ayarlarını değiştiremez.

## 4.6 Ana Akışlar
1. Mobil giriş
2. Atanmış seferi açma
3. Sefer başlatma
4. Sefer boyunca konum akışı
5. Sefer bitirme

## 4.7 Başarı Metrikleri
- Sefer başlatma tamamlanma oranı
- Sefer bitirme tamamlanma oranı
- Konum akışında kopma oranı

## 5. Rol 4 - Yolcu/Misafir (Mobil)

## 5.1 Rol Tanımı
Servis takibini yapan son kullanıcıdır. Misafir kullanıcı, yolcuyla aynı görüntüleme kapsamına sahiptir.

## 5.2 Çözdüğü Sorunlar
- Servisin konumu hakkında belirsizlik
- Varışa dair öngörü eksikliği
- Bilgi almak için sürekli çağrı/mesaj ihtiyacı

## 5.3 SaaS'in Bu Role Vaadi
- "Servisi canlı takip eder, temel rota bilgisini tek yerden görürsün."

## 5.4 Yetkiler (MVP)
- Mobilde takip ekranına erişim
- Canlı konum görüntüleme
- Temel rota/sefer bilgisi görüntüleme
- Duyuru görüntüleme

## 5.5 Erişim Dışı Alanlar
- Operasyonel yönetim işlemlerine erişemez.
- Başka rota veya şirket verilerine erişemez.

## 5.6 Ana Akışlar
1. Takip ekranına giriş
2. Canlı konumu izleme
3. Duyuru/temel bilgi görüntüleme

## 5.7 Başarı Metrikleri
- Takip ekranı açılış başarı oranı
- Kullanıcı başına destek çağrısı azalımı
- Canlı takip oturum süresi

## 6. Roller Arası Sınırların Net Kuralı
- SaaS Sahibi platformu yönetir, şirket operasyonunu yönetmez.
- Şirket kendi operasyonunu yönetir, platformu yönetmez.
- Şoför ve yolcu/misafir yalnız mobilde görev/takip akışı yapar.
- Şirket içi alt rol yoktur; şirket paneli tek rol mantığıyla çalışır.

## 7. Ürün Mesajı (Tek Cümle)
NeredeServis, platform sahibine şirketleri kontrollü büyütme; şirkete operasyonu hızla yönetme; şoföre net görev yürütme; yolcuya anlık şeffaf takip deneyimi sağlar.

## 8. Sonraki Adım
Bu rapor onaylandıktan sonra ekran bazlı gereksinim dökümü şu sırayla çıkarılır:
1. Platform Sahibi Paneli
2. Şirket Web Paneli (Fleet Setup + Live Ops)
3. Şoför Mobil
4. Yolcu/Misafir Mobil
