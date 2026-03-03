# Giriş, Kimlik Doğrulama ve Oturum Stratejisi

Tarih: 2026-03-02
Durum: AKTİF
Kapsam: 4 rol, 2 kanal (web + mobil)

---

## 1. Temel Karar: "Kullanıcı Modeli"

**Model: SaaS Sahibi şirket kullanıcılarını davet eder.**

- SaaS Sahibi kendi hesabını kendisi yönetir (superadmin, tekil hesap).
- Şirket kullanıcıları SaaS Sahibi tarafından Platform Panel üzerinden **davet edilir** (`inviteCompanyMember` callable). Davet e-postası gönderilir, kullanıcı kendi şifresini belirler. Şirket kendi kullanıcısını kendi başına kaydetmez.
- Şoför kullanıcıları Şirket tarafından aynı davet mekanizmasıyla oluşturulur.
- Yolcu/Misafir hesap yönetimi MVP'de minimal: anonymous takip desteklenir; kayıt MVP dışı kapsamındadır.

---

## 2. SaaS Sahibi Web Giriş Akışı

### 2.1 Akış
1. Browser → `platform.neredeservis.com/login` (veya `/platform/login`)
2. E-posta + şifre formu.
3. Firebase Auth `signInWithEmailAndPassword` ile doğrulama.
4. Başarılıysa: Firebase ID token alınır → backend'e gönderilir → `users/{uid}.role` kontrolü: `platform_owner` doğrulanır.
5. Rol doğrulanırsa session cookie set edilir → Platform paneline yönlendirme.
6. Rol yoksa veya yanlışsa: giriş başarısız, "Yetkiniz yok" hatası, oturum açılmaz.

### 2.2 Şifre Sıfırlama
- `platform.neredeservis.com/reset-password` sayfası.
- E-posta adresi girilir → Firebase Auth `sendPasswordResetEmail` tetiklenir.
- E-posta ile sıfırlama linki gönderilir.
- Link 24 saat geçerlidir.

### 2.3 Oturum Yönetimi
- Session süresi: 8 saat (platform operasyonel gün mantığı).
- Süre dolunca: mevcut sayfa state'i kaybolur, login sayfasına yönlendirilir.
- Tarayıcı kapatılırsa: cookie `session` tipte tutulur, tarayıcı kapanınca silinir (persistent değil).

---

## 3. Şirket Web Giriş Akışı

### 3.1 Kullanıcı Davet (SaaS Sahibi Tarafından)
1. SaaS Sahibi → Platform Panel → Şirket Detayı → "Kullanıcı Davet Et".
2. Form: e-posta adresi.
3. `inviteCompanyMember` callable tetiklenir: davet e-postası gönderilir.
4. Kullanıcı davet linkine tıklar, kendi şifresini belirler.
5. Firestore'da `companies/{company_id}/members/{uid}` üyelik kaydı oluşur.
6. Kullanıcının `users/{uid}.role` alanı uygun değerle set edilir.

### 3.2 Akış
1. Browser → `app.neredeservis.com/login`
2. E-posta + şifre formu.
3. Firebase Auth doğrulama → `companies/{company_id}/members/{uid}` üyelik kontrolü.
4. Şirket aktif mi? → Firestore'da `companies/{company_id}.status == 'active'` kontrolü.
5. Aktifse: şirket paneline yönlendirme.
6. Pasifse: "Hesabınız askıya alınmıştır" hatası, oturum açılmaz.

### 3.3 Oturum Yönetimi
- Session süresi: 12 saat (operasyon günü boyunca aktif kalabilsin).
- Pasif kalma süresi: 2 saat (2 saat etkileşim yoksa oturum düşer).
- Cihaz değişimi: otomatik single-session yoktur MVP'de; aynı kullanıcı iki tarayıcıdan girebilir (edge case, MVP'de kısıtlanmaz).

---

## 4. Şoför Mobil Giriş Akışı

### 4.1 Kullanıcı Davet (Şirket Tarafından)
1. Şirket → Fleet Setup → Şoförler → "Şoför Davet Et".
2. Form: ad, soyad, telefon, e-posta (giriş için), plaka.
3. `inviteCompanyMember` callable tetiklenir: davet e-postası gönderilir.
4. Şoför davet linkine tıklar, kendi şifresini belirler.
5. Firestore: `users/{uid}.role = 'driver'`, `companies/{company_id}/members/{uid}` kaydı oluşur.

### 4.2 Akış
1. Mobil uygulama açılır.
2. Giriş ekranı: e-posta + şifre veya Google Sign-In.
3. Firebase Auth doğrulama → `users/{uid}.role == 'driver'` kontrolü.
4. Şoförün şirketi aktif mi? → `companies/{company_id}.status == 'active'` kontrolü.
5. Başarılıysa: `Bugünkü Seferim` ekranına yönlendirme.
6. Şirket pasifse: "Bu hesap artık aktif değil." hata mesajı.

### 4.3 Oturum Yönetimi
- Mobil Firebase Auth persistent token: uygulama kapatılsa da oturum açık kalır.
- Token refresh: Firebase SDK otomatik yönetir.
- Manuel çıkış: Ayarlar → Çıkış Yap → Firebase `signOut()`.
- Cihaz değişimi: yeni cihazda giriş yapıldığında eski cihazda aktif sefer varsa arka plan konum servisi devam eder (risk). **Karar: Şoföre aynı anda tek aktif oturum. Yeni giriş eski oturumu invalidate eder.**

### 4.4 Şifre Sıfırlama
- Mobil giriş ekranında "Şifremi unuttum" linki.
- E-posta ile Firebase reset akışı (web viewda açılır veya external browser).

---

## 5. Yolcu/Misafir Mobil Giriş Akışı

### 5.1 Model Kararı
- MVP'de Yolcu/Misafir hesap açmak **zorunda değildir**.
- Takip, **takip kodu** veya **şirketin paylaştığı deep link** ile anonymous olarak yapılır.
- Anonymous Firebase Auth oturumu: `signInAnonymously()` ile geçici UID alınır, talep edilmez.
- Kayıtlı yolcu hesabı oluşturma MVP dışıdır.

### 5.2 Akış
1. Mobil uygulamayı aç veya takip linkine tıkla.
2. Takip kodu giriş ekranı (link ise otomatik doldurulur).
3. `getActiveTrip(trackingCode)` callable çağrılır.
4. Geçerli kod → Canlı Takip ekranı yüklenir.
5. Geçersiz/süresi dolmuş kod → "Takip kodu bulunamadı." hatası.

### 5.3 Oturum Yönetimi
- Anonymous oturum: uygulama kapatıldığında bellekten silinir.
- Aynı deep link tekrar açılırsa akış baştan başlar.
- Kişisel veri saklanmaz.

### 5.4 Güvenlik Notu
- Takip kodu: `srvCode` (6 karakter), alfabe: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.
- Aktif olmayan seferin kodunu girmek hata verir.
- Bir takip kodunun birden fazla kişi tarafından kullanılması engellenmez (okuma yetkisi yeterlidir).

---

## 6. "Şirket Kullanıcılarını SaaS Sahibi Oluşturur" Modeli — Açık Kurallar

| Kural | Açıklama |
|---|---|
| Şirket kendi kendine kayıt olamaz | Self-register endpoint yoktur. |
| Şirket kullanıcısı SaaS Sahibi tarafından davet edilir | Platform Panel → Şirket Detayı → Kullanıcı Davet Et (`inviteCompanyMember`) |
| Şirkete kaç kullanıcı ekleneceği MVP'de sınırlanmaz | Kısıt getirilmez (ileride `user_limit` alanı eklenebilir). |
| Şirket kullanıcısını deaktif edebilen: SaaS Sahibi | Şirket kullanıcısı kendi hesabını deaktif edemez. |
| Şoför kullanıcısı şirket tarafından davet edilir | Fleet Setup → Şoför Davet Et (`inviteCompanyMember`) |
| Şoförlere şirket paneli erişimi verilmez | `users/{uid}.role == 'driver'` → şirket paneline redirect yoktur. |

---

## 7. MVP Seviyesinde Güvenlik ve Erişim Kontrol Kuralları

### 7.1 Membership Tabanlı Erişim Kontrolü
| Yapı | Konum | Açıklama |
|---|---|---|
| `users/{uid}.role` | Firestore | Uygulama seviyesinde rol: `driver`, `passenger`, `guest` |
| `companies/{cId}/members/{uid}` | Firestore subcollection | Şirket üyeliği kaydı |
| `company_access_helpers.ts` | Cloud Functions | Her callable'da üyelik kontrolü yapan yardımcı fonksiyonlar |

> **Not:** Custom claims (`platform_owner`, `company_user`) kullanılmaz. Yetki kontrolü Firestore membership subollection ve `users/{uid}.role` alanı üzerinden yapılır.

### 7.2 Firestore Security Rules Prensipleri
- Şirket verisi: `companies/{cId}/members/{uid}` üyelik kaydı kontrolü zorunlu.
- Şoför verisi: `uid == request.auth.uid` veya şirket üyeliği kontrolü.
- Platform Owner: superadmin UID kontrolü ile tüm koleksiyonlarda read yetkisi.
- Yolcu/Misafir: sefer koleksiyonunda `is_public_trackable == true` olan belgeler anonymous read ile erişilebilir.
- Canlı konum: RTDB `locations/{routeId}` path'inde `database.rules.json` ile kontrol edilir.

### 7.3 HTTPS Callable Functions Güvenliği
- Her callable başında `context.auth` kontrolü yapılır; auth yoksa `unauthenticated` fırlatılır.
- Rol kontrolü: `users/{uid}.role` Firestore alanı + `companies/{cId}/members/{uid}` üyelik kontrolü üzerinden.
- Cross-company erişim: callable içinde `company_id` karşılaştırması zorunlu.

### 7.4 Şifre ve Oturum Politikası Özeti
| Parametre | Değer |
|---|---|
| Minimum şifre uzunluğu | 8 karakter |
| Şifre karmaşıklığı | 1 büyük harf + 1 rakam zorunlu |
| İlk giriş şifre değiştirme | MVP dışı (davet modeli: kullanıcı zaten kendi şifresini belirliyor) |
| Web oturum süresi (platform owner) | 8 saat |
| Web oturum süresi (şirket) | 12 saat (2 saat idle ile düşer) |
| Mobil oturum süresi (şoför) | Persistent, manuel çıkış veya invalidation |
| Şoför tek cihaz politikası | Yeni giriş eski oturumu sonlandırır |

### 7.5 Bu Fazda Yapılmayanlar
- 2FA / MFA (MVP dışı)
- SSO / SAML entegrasyonu (MVP dışı)
- IP kısıtlaması (MVP dışı)
- Oturum kayıtları/audit log (MVP dışı)
- Otomatik onboarding e-postası (manuel teslim yeterli)

---

## Yönetici Özeti

**En Kritik 10 Karar:**
1. Şirket self-register yoktur; hesap SaaS Sahibi tarafından davet ile açılır.
2. Şoför hesabı Şirket tarafından davet ile oluşturulur.
3. Yolcu anonymous takip yapar; hesap zorunlu değildir.
4. Davet modeli: kullanıcı kendi şifresini belirler, geçici şifre / force_password_change yok.
5. Şoför single-session: yeni cihaz girişi eski oturumu anında invalidate eder.
6. Erişim kontrolü: Firestore membership (`companies/{cId}/members/{uid}`) + `users/{uid}.role` tabanlı. Custom claims kullanılmaz.
7. Cross-company veri izolasyonu Firestore rules ve callable function içinde çift katman.
8. Pasif şirkette kullanıcı girişi tamamen engellenir.
9. Takip kodu: `srvCode` (6 karakter, alfabe: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`).
10. MVP'de MFA, SSO, audit log yoktur.

> **Not:** Bu dosyanın tüm açık soruları `10_KESINLESTIRILMIS_MVP_KARAR_SETI_2026-03-02.md` dosyasında kesin karara bağlanmıştır.
