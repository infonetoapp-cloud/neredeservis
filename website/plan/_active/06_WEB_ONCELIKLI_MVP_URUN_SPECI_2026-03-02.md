# Web Öncelikli MVP Ürün Spesifikasyonu

Tarih: 2026-03-02
Durum: AKTİF
Kapsam: P0/P1/P2 kapsamı, kodlama sırası, 6-8 haftalık icra planı

---

## 1. Temel Karar: Ne Önce Kodlanır?

**Karar: Platform Owner Paneli önce, Şirket Paneli hemen ardından.**

### Gerekçe
1. **Bağımlılık zinciri:** Şirket panelinin çalışabilmesi için şirket ve kullanıcının sistemde var olması gerekir. Şirketi oluşturan Platform Owner panelidir. Platform Owner olmadan Şirket panelini test edemezsiniz.
2. **Onboarding döngüsü:** İlk müşteriye teslim sürecinde SaaS Sahibi şirketi açar → kullanıcı oluşturur → Şirket giriş yapar. Bu sıralama zorunludur.
3. **Risk azaltma:** Backend'de tenant izolasyonu, rol claims yapısı ve auth akışı önce Platform Owner ile sağlam kurulmalı; Şirket paneli bu temele oturur.
4. **Mobil sonraya neden kalır:** Mobil, Şirket panelinde en az bir şoför ve atama olmadan işlevsel değildir. Şirket paneli bitmeden mobil sahaya çıkamaz.

**Sonuç sırası: Platform Owner → Şirket → Şoför Mobil → Yolcu Mobil**

---

## 2. MVP Kapsam Sınıflandırması

### P0 — Olmadan ürün çalışmaz, pilot yapılamaz
Backend altyapısı, auth, Platform Owner paneli, Şirket panel çekirdeği (Fleet Setup + Live Ops).

### P1 — Olmadan operasyon sürdürülemez, ama başlangıç için kabul edilebilir
Şoför mobil, Yolcu canlı takip, temel bildirim mekanizması.

### P2 — Değer katar ama ertelenebilir
Raporlama, duyuru sistemi, şoför mesajlaşması, advanced harita özellikleri.

---

## 3. P0 Maddeleri — Detaylı

### P0.1 — Firebase Auth + Membership Tabanlı Erişim Kontrolü Altyapısı
**Neden kritik:** Tüm rol bazlı erişim bu temele dayanır. Bu olmadan hiçbir panel güvenli çalışamaz.
**Bağımlılık:** Hiçbir şey. İlk yapılacak.
**Done kriteri:**
- `users/{uid}.role` alanı Firestore'da set edilebiliyor (`driver`, `passenger`, `guest`).
- `companies/{cId}/members/{uid}` subcollection üzerinden şirket üyeliği kontrolü çalışıyor.
- Her callable'da `company_access_helpers.ts` ile üyelik doğrulaması yapılıyor.
- Cross-company erişim deneme callable ve rules tarafından reddediliyor.

### P0.2 — Firestore + RTDB Veri Modeli ve Security Rules
**Neden kritik:** Companies, users, vehicles, routes, trips koleksiyonları tanımlanmadan hiçbir CRUD çalışmaz. Canlı konum RTDB'de tutulur.
**Bağımlılık:** P0.1
**Done kriteri:**
- `companies`, `users`, `companies/{cId}/members`, `companies/{cId}/vehicles`, `routes`, `trips` koleksiyonları şema dokümantasyonu ile tanımlandı.
- Firestore Security rules: her koleksiyon için membership tabanlı read/write kuralları aktif.
- RTDB `locations/{routeId}` path'i için `database.rules.json` kuralları aktif.
- Test: şirket üyesi yalnızca kendi company_id'şini okuyabiliyor; başka şirket verisi okunmuyor.

### P0.3 — Platform Owner Panel: Auth + Login
**Neden kritik:** SaaS Sahibi giriş yapamadan şirket açılamaz.
**Bağımlılık:** P0.1
**Done kriteri:**
- `platform.neredeservis.com/login` çalışıyor.
- Yanlış rol ile giriş denemesi reddediliyor.
- Başarılı girişte şirketler listesine yönlendirme.

### P0.4 — Platform Owner Panel: Şirket CRUD
**Neden kritik:** Şirket oluşturulamadan hiçbir şirket kullanıcısı sisteme giremez.
**Bağımlılık:** P0.2, P0.3
**Done kriteri:**
- Yeni şirket oluşturulabiliyor (ad, araç limiti, iletişim e-postası).
- Şirket listesinde durum (aktif/pasif) görünüyor.
- Aktif/pasif toggle çalışıyor.
- Pasif şirket kullanıcıları giriş yapamıyor.

### P0.5 — Platform Owner Panel: Şirket Kullanıcısı Davet Etme
**Neden kritik:** Şirket kullanıcısı bu akışla sisteme girer; self-register yoktur.
**Bağımlılık:** P0.4
**Done kriteri:**
- Şirket detayı içinden kullanıcı e-postası ile davet gönderilebiliyor (`inviteCompanyMember`).
- Davet edilen kullanıcı link üzerinden kendi şifresini belirliyor.
- `companies/{company_id}/members/{uid}` üyelik kaydı oluşuyor.

### P0.6 — Şirket Panel: Auth + Login
**Neden kritik:** Şirket operasyona başlamak için önce panele girebilmeli.
**Bağımlılık:** P0.5
**Done kriteri:**
- `app.neredeservis.com/login` çalışıyor (e-posta+şifre + Google Sign-In + Microsoft Sign-In).
- Üyelik kontrolü ile doğru şirket paneline yönlendirme.
- Google/Microsoft ile giriş de çalışıyor.

### P0.7 — Şirket Panel: Fleet Setup — Şoför/Araç/Rota CRUD
**Neden kritik:** Atama yapmak için kayıt gerekir; kayıtsız operasyon başlamaz.
**Bağımlılık:** P0.6, P0.2
**Done kriteri:**
- Şoför oluşturulup düzenlenebiliyor, deaktif edilebiliyor.
- Araç oluşturulup düzenlenebiliyor (araç limiti aşım engeli P1'de, MVP'de sınırlama yok).
- Rota oluşturulup durakları eklenebiliyor, düzenlenebiliyor.
- Silme: aktif ataması olan kayıt silinemiyor, hata gösteriyor.

### P0.8 — Şirket Panel: Atama
**Neden kritik:** Atama olmadan sefer başlatılamaz; şoför mobili işlevsiz kalır.
**Bağımlılık:** P0.7
**Done kriteri:**
- Şoför + Rota birleştiren atama formu çalışıyor (araç plakası şoför profilinden otomatik gelir).
- Aynı şoföre aynı anda iki atama engelleniyor.
- Atama listesinde mevcut atamalar görünüyor.
- Atama kaldırılabiliyor.

### P0.9 — Şoför Mobil: Auth + Atanmış Sefer Görüntüleme
**Neden kritik:** Şoför uygulamaya girip seferini göremeden operasyon başlamaz.
**Bağımlılık:** P0.8
**Done kriteri:**
- Mobil giriş çalışıyor (e-posta+şifre + Google Sign-In).
- Atanmış sefer görünüyor: rota adı, duraklar, başlangıç saati.
- Atama yoksa doğru boş durum mesajı gösteriyor.

### P0.10 — Şoför Mobil: Sefer Başlat/Bitir + Konum Akışı
**Neden kritik:** Konum akışı olmadan Live Ops işlevsiz; canlı takip çalışmaz.
**Bağımlılık:** P0.9
**Done kriteri:**
- "Seferi Başlat" butonu tıklandığında konum akışı başlıyor.
- RTDB `locations/{routeId}` path'ine ~1-3 saniyede bir konum yazılıyor.
- "Seferi Bitir" + onay dialogu çalışıyor; bitince konum akışı duruyor.
- Sefer tamamlandı ekranı gösteriliyor.

### P0.11 — Şirket Panel: Live Ops — Risk Kuyruğu + Harita
**Neden kritik:** Şirket canlı operasyonu göremeden platformun değeri sıfırdır.
**Bağımlılık:** P0.10
**Done kriteri:**
- Aktif seferler listesi çalışıyor: sefer adı, şoför, durum, son konum zamanı.
- Risk sıralaması: `critical` (>10dk konum yok) > `warning` (>5dk) > `normal`.
- Haritada aktif araçlar ikonla gösteriliyor, gerçek zamanlı güncelleniyor.
- Sefer tıklanınca detay çekmecesi açılıyor.

### P0.12 — Yolcu/Misafir Mobil: Canlı Takip
**Neden kritik:** Ürünün son kullanıcı katmanı; B2C değeri bu ekranla gözlemlenebilir.
**Bağımlılık:** P0.10
**Done kriteri:**
- srvCode (6 karakter) veya QR kod ile sefer ekranı açılıyor.
- Haritada araç gerçek zamanlı gösteriliyor (RTDB listener).
- Sefer tamamlandıysa doğru durum mesajı.
- Geçersiz kod doğru hata mesajı.

---

## 4. P1 Maddeleri

| Madde | Açıklama | Bağımlılık |
|---|---|---|
| P1.1 Duyuru Sistemi | Şirket duyuru yayımlar, yolcu görür | P0.12 |
| P1.2 Sefer Detay Çekmecesi (tam) | Live Ops çekmecesinde şoför tel, hızlı aksiyon butonları | P0.11 |
| P1.3 Şoför Profil Sayfası | Şoför adı, atanmış araç özeti mobilde | P0.9 |
| P1.4 Rota Durak Sırası Görselleştirme | Mobil ve yolcu takibinde durak sırasının haritada gösterimi | P0.12 |

---

## 5. P2 Maddeleri (MVP Dışı)

| Madde | Sebep |
|---|---|
| P2.1 Sefer geçmişi / export | Operasyon kararlılığı sağlandıktan sonra |
| P2.2 Push notification (FCM) | Firebase Messaging entegrasyonu ayrı efor; MVP konum akışına odaklanalım |
| P2.3 Şoför performans raporları | Şirket talebi olmadan üretme |
| P2.4 İç mesajlaşma (şirket-şoför) | Telefon kanalı MVP için yeterli |
| P2.5 AI/optimizasyon | Kapsam dışı |
| P2.6 İç rol (admin/viewer/dispatcher) | Kapsam dışı; tek rol kararı kilidi |

---

## 6. Mobilin Neden Sonra Geldiği

1. **Veri yoksa test edilemez:** Şoför mobili, sistemde bir atama olmadan boş çalışır; bu test değil demo.
2. **Auth altyapısı önce web'de olgunlaşır:** Membership modeli, security rules web akışlarında doğrulanır; mobil aynı temele oturur.
3. **Canlı konum akışı bağımlılığı:** Konum verisi konum üreten şoför olmadan sınanamaz; şoför ancak Fleet Setup + atama tamamlandıktan sonra sefere çıkabilir.
4. **Yolcu takibi konum akışına bağlı:** Konum akışı çalışmadan yolcu takip ekranı değer üretemez.

**Sonuç:** Mobil geliştirme Hafta 5'te başlar; bu bir erteleme değil veri bağımlılığı zincirinin doğru yorumlanmasıdır.

---

## 7. 8 Haftalık İcra Sırası

### Hafta 1 — Altyapı ve Platform Owner Auth
- Firebase projesi yapılandırması (auth, firestore, RTDB, functions)
- Membership tabanlı erişim kontrolü setup (`users/{uid}.role` + `companies/{cId}/members/{uid}`)
- Firestore veri modeli + security rules (companies, members, users, vehicles, routes, trips)
- RTDB `locations/{routeId}` kuralları (`database.rules.json`)
- Platform Owner login sayfası

### Hafta 2 — Platform Owner Panel Tamamlama
- Şirketler listesi
- Şirket oluştur formu
- Şirket detay sayfası
- Şirket kullanıcısı davet etme akışı (`inviteCompanyMember`)
- Aktif/pasif toggle
- Araç limiti tanımlama

### Hafta 3 — Şirket Panel Auth + Fleet Setup CRUD
- Şirket login (e-posta+şifre + Google + Microsoft)
- Şoför CRUD (liste, oluştur/davet, düzenle, deaktif)
- Araç CRUD (limit kontrolü dahil)
- Rota CRUD (durak ekleme dahil)

### Hafta 4 — Atama + Live Ops Temel
- Şoför-Rota atama formu (araç plakası şoför profilinden gelir)
- Atama çakışma kontrolü
- Live Ops: aktif sefer listesi (risk kuyruğu)
- Live Ops: harita temel görünümü (araç ikonları)

### Hafta 5 — Şoför Mobil
- Mobil auth (e-posta+şifre + Google Sign-In)
- Bugünkü Seferim ekranı
- Sefer başlat / RTDB konum akışı
- Sefer bitir / tamamlandı ekranı

### Hafta 6 — Yolcu Mobil + Live Ops Tamamlama
- srvCode / QR kod girişi
- Canlı takip ekranı (harita)
- Sefer detay çekmecesi (Live Ops'ta tam versiyon)
- Hata/boş durumlar

### Hafta 7 — Entegrasyon ve Uçtan Uca Test
- SaaS Sahibi → Şirket açar → Şirket Fleet Setup yapar → Şoför sefere çıkar → Yolcu takip eder
- Tüm hata durumları ve edge case doğrulama
- Security rules penetrasyon testi (cross-company erişim)

### Hafta 8 — Pilot Hazırlık
- Performans ve yük testi (konum akışı yoğunluğu)
- UI polish ve mobil uyumluluk
- Pilot şirket onboarding
- Gözlemleme ve hızlı düzeltme kapasitesi hazır

---

## Yönetici Özeti

**En Kritik 10 Karar:**
1. Platform Owner paneli Şirket panelinden önce kodlanır (bağımlılık zinciri).
2. P0 tamamlanmadan P1 başlanmaz.
3. Mobil Hafta 5'te başlar; bu erteleme değil zorunlu bağımlılık.
4. Araç limiti aşım engeli P1'e ertelendi; MVP'de sınırlama yok.
5. Atama: Şoför + Rota (ikili). Araç plakası şoför profilinden gelir.
6. Live Ops risk kuyruğu sıralaması: critical > warning > normal; eşik değerleri 5dk ve 10dk.
7. Şirket self-register yoktur; bu bir karar, bir özellik eksikliği değil.
8. Security rules Hafta 1'de yazılır, sonraya bırakılmaz.
9. Yolcu anonymous erişim P0.12'de tasarlanır; kayıt akışı MVP dışı.
10. Hafta 7 entegrasyon haftasıdır; bu hafta yeni özellik girilmez.

> **Not:** Bu dosyanın tüm açık soruları `10_KESINLESTIRILMIS_MVP_KARAR_SETI_2026-03-02.md` dosyasında kesin karara bağlanmıştır.
