# Rol Bazlı JTBD ve Uygulama Matrisi

Tarih: 2026-03-02
Durum: AKTİF
Amaç: "Hangi rol hangi işi çözüyor ve bunu çözmek için üründe ne geliştiriyoruz?" sorusunu tek sayfada netleştirmek.

## 1. Rol -> Çözülen İş -> Yapacağımız Geliştirme (P0)

| Rol | Çözülen İş (JTBD) | Bugünkü Sorun | P0'da Ne Geliştiriyoruz (Somut) | Başarı Ölçütü |
|---|---|---|---|---|
| SaaS Sahibi (Web) | Satış sonrası müşteriyi sisteme hızlı almak | Şirket açılışı ve kapasite yönetimi manuel/dağınık | Platform panelinde `Şirket Oluştur`, `Şirket Kullanıcıları`, `Araç Limiti`, `Aktif/Pasif` ekranları | Bir şirketin açılıp kullanıma verilme süresi |
| Şirket (Web) | Operasyonu tek panelde kurup yönetmek | Şoför/araç/rota/atama dağınık, canlı müdahale geç | Şirket panelinde `Fleet Setup` (tek bağlam) + `Live Ops` (risk kuyruğu + harita + detay çekmecesi) | Kurulum tamamlama süresi + riskli sefere ilk müdahale süresi |
| Şoför (Mobil) | Atanmış seferi hatasız yürütmek | Görev belirsizliği, başlat/bitir karmaşık | Mobilde `Bugünkü Seferim`, `Sefer Başlat`, `Sefer Bitir`, `Konum Akışı` | Sefer başlatma/bitirme tamamlama oranı |
| Yolcu/Misafir (Mobil) | Servisi güvenle takip etmek | "Servis nerede?" belirsizliği | Mobilde `Canlı Takip`, `Temel Rota Bilgisi`, `Duyuru` ekranı | Takip ekranı kullanım oranı + destek çağrısı azalımı |

## 2. Rol Bazlı “Çözmediğimiz” İşler (Kapsam Sınırı)

| Rol | Bu Fazda Çözmediğimiz İş |
|---|---|
| SaaS Sahibi | Faturalama/muhasebe, kompleks finans raporları |
| Şirket | İç rol hiyerarşisi (admin/viewer/dispatcher), AI optimizasyon |
| Şoför | Gelişmiş rota optimizasyonu, offline karmaşık senaryolar |
| Yolcu/Misafir | Gelişmiş ETA tahminleme, çok adımlı sadakat/gamification |

## 3. “Çözüm İçin Ne Yapacağız?” Net İş Paketi

## 3.1 SaaS Sahibi Paneli (Web)
1. `Platform Giriş` + platform oturum doğrulama
2. `Şirketler` listeleme + yeni şirket açma
3. `Şirket Detayı`:
- şirket adı/durum
- araç limiti (kapasite)
- aktif kullanıcı listesi
4. `Şirket Kullanıcısı Oluşturma` akışı
5. `Aktif/Pasif` tenant geçişi

Çıktı: Satıştan sonra müşteri şirketi elle dağınık işlem yapmadan sistemde ayağa kalkar.

## 3.2 Şirket Paneli (Web)
1. `Fleet Setup` tek çalışma alanı
- Şoför oluştur
- Araç oluştur
- Rota oluştur
- Şoför+Rota ataması (araç plakası profilden gelir)
2. `Live Ops` çalışma alanı
- Aktif sefer listesi
- Risk kuyruğu (critical/warning/stale)
- Harita + seçili sefer detay çekmecesi
- Hızlı aksiyonlar (kopyala/iletişim)

Çıktı: Şirket operasyonu sekmeler arasında kaybolmadan tek panelde yönetir.

## 3.3 Şoför Mobil
1. Giriş
2. Bugünkü atama ekranı
3. Sefer başlat (tek ana buton)
4. Sefer sürerken canlı konum gönderimi
5. Sefer bitir (tek ana buton)

Çıktı: Şoförün "bugün ne yapacağım" belirsizliği biter.

## 3.4 Yolcu/Misafir Mobil
1. Takip ekranına giriş
2. Canlı konum izleme
3. Temel rota/sefer bilgisi
4. Duyuru ekranı

Çıktı: "Servis nerede?" sorusu için arama ihtiyacı düşer.

## 4. 8 Haftalık MVP İcra Sırası (Web Önce)

## Hafta 1-2
- SaaS Sahibi panel iskeleti + şirket açma + kullanıcı davet etme
- Şirket panelinde Fleet Setup temel CRUD

## Hafta 3-4
- Fleet Setup atama akışı (Şoför + Rota ikili atama)
- Live Ops temel liste + harita (Mapbox) + risk kuyruğu

## Hafta 5
- Şoför mobil: auth (e-posta+şifre + Google) + başlat/bitir + RTDB konum akışı

## Hafta 6
- Yolcu/misafir mobil: srvCode/QR girişi + canlı takip + temel bilgi

## Hafta 7
- Uçtan uca entegrasyon testi

## Hafta 8
- Pilot hazırlık + UI polish

## 5. Rol Bazlı Kabul Kriterleri

## 5.1 SaaS Sahibi
- Yeni şirket açılıp ilk kullanıcıları atanabiliyor.
- Araç limiti tanımlanabiliyor.
- Şirket aktif/pasif durumuna alınabiliyor.

## 5.2 Şirket
- Şoför+rota+atama tek çalışma alanında tamamlanabiliyor.
- Live Ops'ta riskli sefer 10 saniye içinde seçilip detayına girilebiliyor.

## 5.3 Şoför
- Atanmış seferi görüp başlatabiliyor.
- Seferi bitirebiliyor.
- Sefer süresince konum akışı gönderiliyor.

## 5.4 Yolcu/Misafir
- Canlı takip ekranı açılıyor.
- Servis konumu ve temel sefer bilgisi görüntüleniyor.

## 6. Satışta Kullanılacak Net Cümleler (Rol Bazlı)

- SaaS Sahibi: "Müşteri şirketinizi dakikalar içinde açar, kapasiteyi sözleşmeye göre kilitlersiniz."
- Şirket: "Kurulum ve canlı operasyonu tek panelde yönetir, sadece riskli seferlere odaklanırsınız."
- Şoför: "Uygulamayı açar, görevi görür, tek butonla seferi başlatıp bitirir."
- Yolcu/Misafir: "Servisi haritada canlı izler, aramadan bilgiye ulaşır."

## 7. Son Not
Bu doküman karar dokümanıdır. Sonraki adımda ekran ekran wireflow ve teknik endpoint sözleşmesi bu matris üzerinden çıkarılacaktır.
