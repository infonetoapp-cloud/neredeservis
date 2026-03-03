# Teknik İş Paketi ve Sıralama

Tarih: 2026-03-02
Durum: AKTİF
Kapsam: Epic → Task dökümü, bağımlılık, risk, efor, ilk 15 iş, kapsam dışı liste

Efor Tanımı: S = 0.5-1 gün | M = 1-3 gün | L = 3-5 gün

---

## EPIC 1 — Altyapı ve Auth

### Task 1.1 — Firebase Projesi Yapılandırması
**Katman:** Backend (Firebase Console + project config)
**Açıklama:** Firebase Auth, Firestore, Cloud Functions, Storage aktif edilir; web ve mobil app kaydedilir; `.env`/`google-services.json` yapılandırılır; environment ayrımı (dev/prod) yapılır.
**Bağımlılık:** Yok (başlangıç noktası)
**Risk:** DÜŞÜK (rutin setup)
**Efor:** M

### Task 1.2 — Membership Tabanlı Erişim Kontrolü
**Katman:** Backend (Cloud Functions + Firestore)
**Açıklama:** Erişim kontrolü `companies/{cId}/members/{uid}` subcollection ve `users/{uid}.role` alanı üzerinden yapılır. `company_access_helpers.ts` yardımcı fonksiyonları her callable'da üyelik doğrulaması yapar. Custom claims kullanılmaz. Rol değerleri: `driver`, `passenger`, `guest`.
**Bağımlılık:** Task 1.1
**Risk:** ORTA (membership kontrolü her callable'a entegre edilmeli)
**Efor:** M

### Task 1.3 — Firestore Veri Modeli ve Security Rules
**Katman:** Backend (Firestore + Rules)
**Açıklama:**
Koleksiyonlar ve temel şema:
- `companies/{company_id}`: name, vehicle_limit, status, created_at
- `users/{uid}`: email, role, company_id, status
- `drivers/{driver_id}`: name, phone, email, uid, company_id, status
- `vehicles/{vehicle_id}`: plate, brand, capacity, company_id, status
- `routes/{route_id}`: name, stops[], company_id, status
- `trips/{trip_id}`: driver_id, vehicle_id, route_id, company_id, status, last_location{lat,lng,timestamp}, tracking_code, started_at, completed_at

Security Rules:
- Platform Owner (superadmin UID): companies, users read/write; diğer koleksiyon read. Server-side callable üzerinden.
- Şirket üyesi: `companies/{cId}/members/{uid}` üyelik kontrolü ile kendi şirketinde read/write.
- `driver`: yalnızca kendi trips belgesi read; konum write.
- Anonymous: `trips` belgesinde `is_public_trackable == true` ise read.

**Bağımlılık:** Task 1.1
**Risk:** YÜKSEK (güvenlik açığı merkezi; test edilmeden üretime geçilmez)
**Efor:** L

### Task 1.4 — Security Rules Otomatik Testleri
**Katman:** Test (Firebase Emulator + Jest/Mocha)
**Açıklama:** Her rol için okuma/yazma izni ve reddedilen erişim senaryoları test edilir. Minimum test coverage: cross-company erişim reddi, şoförün başka seferi okuyamaması, anonymous read sadece public trip.
**Bağımlılık:** Task 1.3
**Risk:** DÜŞÜK (test ortamında çalışır)
**Efor:** M

---

## EPIC 2 — Platform Owner Panel (Web)

### Task 2.1 — Platform Owner Login Sayfası
**Katman:** Frontend (Web — Next.js)
**Açıklama:** `/platform/login` route. E-posta + şifre formu, Firebase Auth `signInWithEmailAndPassword`, superadmin UID kontrolü, başarılı → `/platform/companies` yönlendirme. Hata mesajları Türkçe.
**Bağımlılık:** Task 1.2
**Risk:** DÜŞÜK
**Efor:** S

### Task 2.2 — Şirketler Listesi Sayfası
**Katman:** Frontend (Web)
**Açıklama:** `/platform/companies` route. Firestore `companies` koleksiyonu realtime listener. Tablo: şirket adı, vehicle_limit, user count, status, oluşturulma tarihi. Aktif/pasif toggle (inline Firestore write). "Yeni Şirket Oluştur" butonu.
**Bağımlılık:** Task 2.1, Task 1.3
**Risk:** DÜŞÜK
**Efor:** M

### Task 2.3 — Şirket Oluştur Formu
**Katman:** Frontend (Web) + Backend (Callable Function)
**Açıklama:** `createCompany` callable: şirket belgesi oluşturur, status=active set eder. Frontend: form validasyon (ad zorunlu, limit min 1, e-posta format). Başarı → Şirket Detay sayfasına yönlendirme.
**Bağımlılık:** Task 2.2
**Risk:** DÜŞÜK
**Efor:** S

### Task 2.4 — Şirket Detay Sayfası
**Katman:** Frontend (Web)
**Açıklama:** `/platform/companies/:id` route. Şirket bilgileri (ad, limit, durum). Kullanıcı listesi (Firestore `users` koleksiyonundan company_id filtreli). Araç Limiti düzenleme. Kullanıcı deaktif etme. "Kullanıcı Ekle" butonu.
**Bağımlılık:** Task 2.3
**Risk:** DÜŞÜK
**Efor:** M

### Task 2.5 — Şirket Kullanıcısı Davet Etme
**Katman:** Frontend (Web) + Backend (Callable Function)
**Açıklama:** `inviteCompanyMember` callable: e-posta ile davet linki gönderir, kullanıcı kendi şifresini belirler. Firestore `companies/{company_id}/members/{uid}` üyelik kaydı + `users/{uid}` belgesi oluşur. Frontend: email formu.
**Bağımlılık:** Task 2.4, Task 1.2
**Risk:** ORTA (davet e-postası gönderimi + kullanıcı kayıt akışı; hata yönetimi kritik)
**Efor:** M

---

## EPIC 3 — Şirket Panel Auth

### Task 3.1 — Şirket Login Sayfası
**Katman:** Frontend (Web)
**Açıklama:** `/login` route. Firebase Auth (e-posta+şifre + Google Sign-In + Microsoft Sign-In), `companies/{cId}/members/{uid}` üyelik kontrolü, şirket `status: active` kontrolü. Başarılıysa `/fleet` yönlendirme.
**Bağımlılık:** Task 2.5
**Risk:** DÜŞÜK
**Efor:** S

### Task 3.2 — Şifre Sıfırlama Sayfası
**Katman:** Frontend (Web)
**Açıklama:** `/reset-password` route. Firebase Auth `sendPasswordResetEmail` akışı. E-posta ile sıfırlama linki gönderilir.
**Bağımlılık:** Task 3.1
**Risk:** DÜŞÜK
**Efor:** S

---

## EPIC 4 — Şirket Panel: Fleet Setup

### Task 4.1 — Şoför CRUD
**Katman:** Frontend (Web) + Backend (Callable Function)
**Açıklama:** `inviteCompanyMember` callable ile şoför davet edilir (e-posta ile davet linki). Firestore `users/{uid}.role = 'driver'`, `companies/{cId}/members/{uid}` kaydı oluşur. CRUD ekranları: liste, davet modal, düzenleme modal, deaktif toggle. Aktif seferdeki şoförü deaktif etme uyarısı.
**Bağımlılık:** Task 3.2, Task 1.2
**Risk:** ORTA (davet akışı + aktif sefer kontrol)
**Efor:** L

### Task 4.2 — Araç CRUD
**Katman:** Frontend (Web) + Firestore
**Açıklama:** `companies/{cId}/vehicles` subcollection CRUD. Vehicle_limit enforcement P1'e ertelendi; MVP'de araç sayısı sınırlanmaz. Liste, oluştur, düzenle, deaktif. Aktif ataması olan aracı silme engeli.
**Bağımlılık:** Task 3.2
**Risk:** DÜŞÜK (limit kontrolü basit Firestore query)
**Efor:** M

### Task 4.3 — Rota CRUD
**Katman:** Frontend (Web) + Firestore
**Açıklama:** `routes` koleksiyonu CRUD. Durak listesi: dinamik ekleme/çıkarma/sıralama, minimum 2 durak validasyon. Aktif ataması olan rotayı silme engeli.
**Bağımlılık:** Task 3.2
**Risk:** DÜŞÜK
**Efor:** M

### Task 4.4 — Atama Ekranı
**Katman:** Frontend (Web) + Backend (Callable Function)
**Açıklama:** `createTrip` callable: şoför + rota + company_id + srvCode (6 karakter, alfabe: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, 5 retry) → `trips` belgesi. Araç plakası şoför profilinden otomatik gelir; atama formunda araç dropdown yok. Çakışma kontrolü: şoför aktif seferde mi? Frontend: dropdown'lar (aktif şoförler, aktif rotalar). Mevcut atamalar listesi.
**Bağımlılık:** Task 4.1, Task 4.3
**Risk:** YÜKSEK (race condition: aynı anda iki kullanıcı aynı şoförü atarsa → transaction kullan)
**Efor:** L

---

## EPIC 5 — Şirket Panel: Live Ops

### Task 5.1 — Aktif Seferler Listesi ve Risk Kuyruğu
**Katman:** Frontend (Web) + Firestore Realtime
**Açıklama:** `trips` koleksiyonu realtime listener, `status: active` + `company_id` filtreli. Risk hesaplama: `now - last_location.timestamp`. Sıralama: critical (>10dk) > warning (5-10dk) > normal (<5dk). Risk renk etiketleri. Satır tıklaması → Detay Çekmecesi.
**Bağımlılık:** Task 4.4
**Risk:** DÜŞÜK (realtime listener standart)
**Efor:** M

### Task 5.2 — Harita Görünümü (Mapbox)
**Katman:** Frontend (Web — Mapbox SDK entegrasyonu)
**Açıklama:** Aktif seferlerdeki araçların son koordinatlarını harita üzerinde ikonla göster. RTDB `locations/{routeId}` realtime listener → ikon pozisyonunu güncelle. Risk rengi ile ikon rengi uyumu. İkon tıklaması → Detay Çekmecesi. Web için Mapbox kullanılır (mevcut kod: `live-ops-mapbox-canvas.tsx`).
**Bağımlılık:** Task 5.1
**Risk:** DÜŞÜK (Mapbox SDK mevcut kodda var)
**Efor:** L

### Task 5.3 — Sefer Detay Çekmecesi
**Katman:** Frontend (Web)
**Açıklama:** Yan panel/overlay component. Sefer ID, rota, şoför adı + tel, araç plaka (profilden), son konum/zaman, risk seviyesi. "Şoförü Ara" (`tel:` şeması). "Takip Linkini Kopyala" (URL format: `/track/{srvCode}`). Kapat ikonu.
**Bağımlılık:** Task 5.1
**Risk:** DÜŞÜK
**Efor:** S

---

## EPIC 6 — Şoför Mobil

### Task 6.1 — Mobil Auth
**Katman:** Mobil (Flutter + Firebase Auth)
**Açıklama:** Giriş ekranı (e-posta + şifre + Google Sign-In), `users/{uid}.role == 'driver'` kontrolü. Şirket pasif kontrolü.
**Bağımlılık:** Task 4.1 (şoför kullanıcıları davet edilmiş olmalı)
**Risk:** DÜŞÜK
**Efor:** M

### Task 6.2 — Bugünkü Seferim Ekranı
**Katman:** Mobil (Flutter + Firestore)
**Açıklama:** `trips` koleksiyonunda `driver_id == uid` ve `status in ['assigned', 'active']` filtreli sorgu. Rota adı, araç plaka, durak sayısı, tahmini başlangıç saati. "Seferi Başlat" butonu. Boş durum.
**Bağımlılık:** Task 6.1, Task 4.4
**Risk:** DÜŞÜK
**Efor:** M

### Task 6.3 — Konum Akışı Servisi
**Katman:** Mobil (Flutter — Background Service / Location Plugin)
**Açıklama:** Sefer başlatılınca arkaplan konum servisi devreye girer. ~1-3 saniyede bir RTDB `locations/{routeId}` güncellenir (`lat`, `lng`, `timestamp`, `bearing`, `speed`). Kalman smoother ile gürültü filtrelenir. Uygulama kapatılsa çalışmaya devam eder. İnternet yoksa lokal önbellek oluşturur, bağlantı gelince toplu yazar. Sefer bitince servis durur.
**Bağımlılık:** Task 6.2
**Risk:** YÜKSEK (platform farklılıkları: iOS background location kısıtları, Android battery optimization; en riskli task)
**Efor:** L

### Task 6.4 — Sefer Başlat / Bitir ve Tamamlandı Ekranı
**Katman:** Mobil (Flutter + Firestore)
**Açıklama:** "Seferi Başlat": konum izni kontrolü → izin varsa trip status `active` → konum servisi başlar → C4 Sefer Aktif Ekranı. "Seferi Bitir": onay dialogu → trip status `completed` → konum servisi durur → C5 Tamamlandı. Single-session: başka cihazdan giriş token invalidation.
**Bağımlılık:** Task 6.3
**Risk:** ORTA (sefer durumu race condition; battle-test gerek)
**Efor:** M

---

## EPIC 7 — Yolcu/Misafir Mobil

### Task 7.1 — Takip Girişi ve Deep Link
**Katman:** Mobil (Flutter + Firebase Dynamic Links veya Custom URL Scheme)
**Açıklama:** srvCode input ekranı + QR kod okutma. `getActiveTrip(srvCode)` callable çağrısı. Deep link: `neredeservis.app/track/{srvCode}` → uygulama açılır + kod otomatik doldurulur. Hata mesajları: geçersiz kod, tamamlanmış sefer, başlamamış sefer.
**Bağımlılık:** Task 4.4 (trip + tracking_code oluşturulmuş olmalı)
**Risk:** ORTA (deep link setup platform bazlı karmaşıklık)
**Efor:** M

### Task 7.2 — Canlı Takip Ekranı
**Katman:** Mobil (Flutter + Google Maps SDK + RTDB Realtime)
**Açıklama:** RTDB `locations/{routeId}` realtime listener → konum değişince haritada araç ikonu kayar. Sefer bilgisi paneli (rota adı, son güncelleme). "X dakika önce güncellendi" etiketi. Sefer tamamlandıysa durum ekranı.
**Bağımlılık:** Task 7.1, Task 6.3 (konum akışı çalışıyor olmalı)
**Risk:** DÜŞÜK (standart realtime harita)
**Efor:** M

### Task 7.3 — Duyurular Ekranı
**Katman:** Mobil (Flutter + Firestore)
**Açıklama:** `announcements` koleksiyonundan company_id bazlı liste. Başlık, içerik, tarih. Boş durum mesajı.
**Bağımlılık:** Task 7.2
**Risk:** DÜŞÜK
**Efor:** S

---

## İLK KODLANACAK 15 İŞ (Sıralı)

| # | Task | Katman | Efor | Risk |
|---|---|---|---|---|
| 1 | Task 1.1 — Firebase Projesi Yapılandırması | Backend | M | DÜŞÜK |
| 2 | Task 1.2 — Membership Tabanlı Erişim Kontrolü | Backend | M | ORTA |
| 3 | Task 1.3 — Firestore + RTDB Veri Modeli + Security Rules | Backend | L | YÜKSEK |
| 4 | Task 1.4 — Security Rules Otomatik Testleri | Test | M | DÜŞÜK |
| 5 | Task 2.1 — Platform Owner Login | Web Frontend | S | DÜŞÜK |
| 6 | Task 2.2 — Şirketler Listesi | Web Frontend | M | DÜŞÜK |
| 7 | Task 2.3 — Şirket Oluştur Formu | Web Frontend + Backend | S | DÜŞÜK |
| 8 | Task 2.4 — Şirket Detay Sayfası | Web Frontend | M | DÜŞÜK |
| 9 | Task 2.5 — Şirket Kullanıcısı Davet Etme | Web Frontend + Backend | M | ORTA |
| 10 | Task 3.1 — Şirket Login Sayfası | Web Frontend | S | DÜŞÜK |
| 11 | Task 3.2 — Şifre Sıfırlama | Web Frontend | S | DÜŞÜK |
| 12 | Task 4.1 — Şoför CRUD | Web Frontend + Backend | L | ORTA |
| 13 | Task 4.2 — Araç CRUD | Web Frontend | M | DÜŞÜK |
| 14 | Task 4.3 — Rota CRUD | Web Frontend | M | DÜŞÜK |
| 15 | Task 4.4 — Atama Ekranı ve createTrip Callable | Web Frontend + Backend | L | YÜKSEK |

---

## EK GÖREVLER (Yeni — Kod-Plan Hizalama)

### Task 0.1 — Company RBAC 4 Rolü Kaldır
**Katman:** Web Frontend
**Açıklama:** `company-rbac.ts` ve `company-types.ts` dosyalarından 4 rol (owner/admin/dispatcher/viewer) yapısı kaldırılır. Tek üyelik modeline sadeleştirilir.
**Bağımlılık:** Yok (başlarında yapılmalı)
**Risk:** ORTA (mevcut koda bağımlı componentler etkilenebilir)
**Efor:** M

### Task 0.2 — Individual Mode Kaldır
**Katman:** Web Frontend
**Açıklama:** `mode-preference.ts` dosyasındaki `PanelMode` (company/individual) ayrımı kaldırılır. Individual driver mode tamamen silinir.
**Bağımlılık:** Task 0.1
**Risk:** DÜŞÜK
**Efor:** S

---

## BU AŞAMADA YAPILMAYACAKLAR

| İş | Neden Yapılmıyor |
|---|---|
| Push Notification (FCM) | Ayrı entegrasyon efor; MVP konum akışı yeterli |
| Sefer Geçmişi / Export | Operasyon kararlılığı sağlanmadan değer yok |
| İç Mesajlaşma (Şirket ↔ Şoför) | MVP'de telefon kanalı yeterli |
| Şirket İçi Rol Ayrımı (admin/viewer) | Tek rol kararı kilidi; karmaşıklık ekler |
| Individual Driver Mode | Kaldırılacak; MVP'de yeri yok |
| force_password_change | Davet modeli ile gereksiz; kullanıcı kendi şifresini belirliyor |
| AI/Optimizasyon | Kapsam dışı |
| UKOME Tarife Motoru | Kapsam dışı |
| Gelişmiş Raporlama Paketi | MVP sonrası |
| Billing / Muhasebe Entegrasyonu | MVP dışı |
| Karma Kimlik Doğrulama (Google Sign-in, SSO) | Google Sign-In zaten mevcut; SSO ve SAML MVP dışı |
| Yolcu Kayıt Akışı | Anonymous takip yeterli, kayıt MVP dışı |
| Çevrimdışı Tam Destek (kompleks) | Temel önbellek yeterli; tam offline sync sonraki faz |
| Şoför Performans Puanlama | Veri birikmeden değerlendirme yapılamaz |
| Çoklu Dil Desteği | MVP Türkçe, i18n sonraki faz |
| Dark Mode | Estetik; MVP dışı |
| Tablet UI Optimizasyonu | Mobil telefon öncelikli |

---

## Yönetici Özeti

**En Kritik 10 Karar:**
1. Task 1.3 (Security Rules + RTDB Rules) en uzun ve en riskli altyapı işidir; Hafta 1'in yarısı buraya gider.
2. Task 4.4 (Atama) race condition için Firestore transaction zorunludur. Atama = Şoför + Rota (ikili); araç profilden gelir.
3. Task 6.3 (Konum Akışı) tüm mobilin en riskli task'ıdır; iOS background location ayrıca test edilecek. RTDB'ye ~1-3 sn yazım.
4. İlk 15 işin tamamı + Task 0.1/0.2 P0 kapsamındadır; P1'e geçmeden hepsi tamamlanmalıdır.
5. Harita: Web = Mapbox (mevcut), Mobil = Google Maps (mevcut). Karar kilidi.
6. Membership tabanlı erişim (Task 1.2) doğru kurulmazsa tüm auth akışı bozulur; ayrı test senaryoları gerekli.
7. `inviteCompanyMember` callable (Task 2.5, Task 4.1) davet e-postası + üyelik kaydı senkronizasyonu içerir; hata yönetimi kapsamlı yazılmalı.
8. Yolcu Deep Link (Task 7.1) iOS Universal Links + Android App Links gerektiriyor; konfigürasyon Hafta 1'de başlanmalı.
9. Firebase Emulator Suite tüm backend geliştirme sürecinde kullanılacak; production'a commit öncesi emulator test zorunlu.
10. Firebase Functions bölgesi: `europe-west3` (Frankfurt). Her epic'in sonunda entegrasyon testi yapılır.

> **Not:** Bu dosyanın tüm açık soruları `10_KESINLESTIRILMIS_MVP_KARAR_SETI_2026-03-02.md` dosyasında kesin karara bağlanmıştır.
