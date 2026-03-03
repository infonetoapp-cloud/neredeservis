# Mevcut Durum & Gap Analizi

Tarih: 2026-03-02
Durum: AKTİF
Amaç: Kodda VAR olan, KISMİ olan ve HİÇ OLMAYAN özellikleri dosya yolu kanıtıyla listeleyerek plan-kod sapmasını sıfıra indirmek.

---

## 1. Özellik Matrisi (VAR / KISMİ / YOK)

| # | Özellik | Durum | Kanıt / Dosya Yolu | Not |
|---|---|---|---|---|
| F01 | Firebase Auth (email+şifre) | VAR | `website/apps/web/src/features/auth/auth-client.ts` · `lib/features/auth/` | Web + mobil |
| F02 | Google Sign-In (web) | VAR | `auth-client.ts → signInWithPopup(googleProvider)` | Web'de aktif |
| F03 | Microsoft Sign-In (web) | VAR | `auth-client.ts → signInWithPopup(microsoftProvider)` | Web'de aktif |
| F04 | Google Sign-In (mobil) | VAR | `lib/features/auth/` | Mobil'de aktif |
| F05 | Anonymous Auth (mobil) | VAR | `lib/features/auth/` | Yolcu/misafir akışı |
| F06 | Company RBAC (4 rol: owner/admin/dispatcher/viewer) | VAR | `website/apps/web/src/features/company/company-rbac.ts` | **Kaldırılacak → tek rol** |
| F07 | Individual driver mode (PanelMode) | VAR | `website/apps/web/src/features/mode/mode-preference.ts` | **Kaldırılacak** |
| F08 | Cloud Functions v2 (europe-west3) | VAR | `functions/src/index.ts` | Bölge: Frankfurt |
| F09 | Firestore veri modeli (companies, users, vehicles, routes, trips) | VAR | `functions/src/`, `firestore.rules` | Temel koleksiyonlar mevcut |
| F10 | RTDB canlı konum yazma | VAR | `lib/features/location/application/location_publish_service.dart`, `database.rules.json` | `locations/{routeId}` path'ine ~1-3 sn |
| F11 | srvCode (6 karakter, takip kodu) | VAR | `functions/src/common/srv_code.ts` | Alfabe: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, 5 retry |
| F12 | Şirket oluşturma (self-service) | VAR | `functions/src/index.ts → createCompany` | callable, self-service |
| F13 | Üye davet (inviteCompanyMember) | VAR | `functions/src/index.ts → inviteCompanyMember` | E-posta davet akışı |
| F14 | Membership-based erişim kontrolü | VAR | `functions/src/common/company_access_helpers.ts` | `companies/{companyId}/members/{uid}` |
| F15 | Kullanıcı rolü (driver/passenger/guest) | VAR | `functions/src/middleware/role_middleware.ts` | `users/{uid}.role` Firestore alanı |
| F16 | Konum Kalman smoother | VAR | `lib/features/location/` | Mobil'de gürültü filtreleme |
| F17 | Background location service | VAR | `lib/features/location/` | Arka plan konum gönderimi |
| F18 | Platform Owner web paneli | YOK | — | Tasarlanacak, `/platform/*` route grubu |
| F19 | Şirket paneli (Fleet Setup + Live Ops) | KISMİ | `website/apps/web/src/features/company/` | Temel company feature mevcut, tam Fleet Setup / Live Ops yok |
| F20 | Şoför mobil (Bugünkü Seferim, Sefer Başlat/Bitir) | KISMİ | `lib/features/trip/` | Trip yapısı var, tam akış eksik |
| F21 | Yolcu canlı takip ekranı | KISMİ | `lib/features/tracking/` | Temel yapı var, tam entegrasyon eksik |
| F22 | force_password_change mekanizması | YOK | — | **MVP dışı bırakıldı** |
| F23 | Araç-sefer binding (üçlü atama) | YOK | — | **Karar: yapılmayacak**, plaka driver profilinden gelir |
| F24 | vehicle_limit aşım engeli | YOK | — | **P1'e ertelendi** |
| F25 | Harita — Mapbox (web) | VAR | `website/apps/web/src/features/live-ops/live-ops-mapbox-canvas.tsx` | Web harita |
| F26 | Harita — Google Maps (mobil) | VAR | `lib/` (`google_maps_flutter` dependency) | Mobil harita |
| F27 | Duyuru sistemi | YOK | — | P1 |
| F28 | Sefer geçmişi / export | YOK | — | P2 |
| F29 | Push notification (FCM) | YOK | — | P2 |
| F30 | Deep link (takip) | KISMİ | `lib/` | Temel yapı, tam konfigürasyon eksik |

---

## 2. Plan-Kod Çelişki Tablosu (12 Madde)

| # | Plan Diyor | Kod Gerçeği | Çözüm Kararı | Etkilenen Dosyalar |
|---|---|---|---|---|
| C01 | `platform_owner` / `company_user` custom claims | Membership-based RBAC (`companies/{cId}/members/{uid}`) + `users/{uid}.role` | **Plan koda uyar.** Claims tablosu silinir, membership modeli benimsenir. | 05 §7.1, 08 Task 1.2 |
| C02 | SaaS Sahibi şirket kullanıcılarını oluşturur (`createCompanyUser`) | Kod: `inviteCompanyMember` e-posta davet akışı, self-service `createCompany` | **Plan koda uyar.** Davet modeli benimsenir; `createCompanyUser` terimi `inviteCompanyMember` olur. | 05 §3.1, 08 Task 2.5 |
| C03 | Şoför şirket tarafından doğrudan oluşturulur | Kod: `inviteCompanyMember` ile davet, rol atanır | **Plan koda uyar.** Davet modeli. | 04 §4.1, 05 §4.1 |
| C04 | Auth: yalnızca email + şifre | Kod: Google Sign-In + Microsoft Sign-In (web), Google Sign-In (mobil) | **Plan koda uyar.** Google/Microsoft eklenir. | 04 §3.5, 05 §4.2, 08 |
| C05 | Şoför web'e giremez | Kod: "individual driver mode" (`PanelMode`) web'de var | **Kod plana uyar.** Individual mode kaldırılacak. | 04 §3.7, 06 P2.6 |
| C06 | "Google Maps mı Mapbox mı?" açık soru | Kod: İkisi de var — web = Mapbox, mobil = Google Maps | **Karar kilidi.** İkisi kalır. | 06, 08 Task 5.2 |
| C07 | Functions bölgesi: `europe-west1` | Kod: `europe-west3` (Frankfurt) | **Plan koda uyar.** Tüm referanslar `europe-west3` olur. | 08 |
| C08 | Takip kodu: `NRS-XXXX` (8 karakter) | Kod: `srvCode` (6 karakter), alfabe: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` | **Plan koda uyar.** Tüm referanslar `srvCode (6 karakter)` olur. | 04, 05 §5.4, 07 D1, 08 |
| C09 | `force_password_change: true` zorunlu | Kod: implementasyon yok | **Kaldırıldı.** MVP dışı. | 05 §3.3, 05 §4.3, 06 P0.5, 07 C1, 08 Task 3.2, 08 Task 6.1 |
| C10 | Araç ayrı koleksiyonda | Kod: `companies/{cId}/vehicles/{vId}` subcollection | **Plan koda uyar.** Subcollection modeli. | 06 P0.2 |
| C11 | Konum: Firestore'a her 10 sn write | Kod: RTDB `locations/{routeId}`, ~1-3 sn frekans | **Plan koda uyar.** Tüm konum referansları RTDB olur. | 06 P0.10, 07 C4, 08 Task 6.3 |
| C12 | Atama: Şoför + Araç + Rota (üçlü) | Kod: Araç-sefer binding yok, plaka şoför profilinden gelir | **Plan koda uyar.** Atama = Şoför + Rota (ikili). | 04 §2.4, 06 P0.8, 07 B5, 08 Task 4.4 |

---

## 3. Yapılması Gereken Kod Değişiklikleri

| # | İş | Öncelik | Açıklama |
|---|---|---|---|
| K01 | Company RBAC 4 rolü kaldır | P0 | `company-rbac.ts` → tek üyelik modeli, iç rol yok |
| K02 | Individual mode kaldır | P0 | `mode-preference.ts` → `PanelMode` kaldırılır |
| K03 | Platform Owner paneli oluştur | P0 | `/platform/*` route grubu, şirket CRUD, kullanıcı davet |
| K04 | Fleet Setup ekranları | P0 | Şoför/Rota CRUD, atama (ikili: Şoför + Rota) |
| K05 | Live Ops ekranları | P0 | Risk kuyruğu, harita (Mapbox), sefer detay çekmecesi |
| K06 | Şoför mobil akış tamamlama | P0 | Bugünkü Seferim, Sefer Başlat/Bitir |
| K07 | Yolcu takip akış tamamlama | P0 | srvCode girişi, QR okutma, canlı takip |
| K08 | vehicle_limit enforcement | P1 | Araç limiti aşım kontrolü |
| K09 | Duyuru sistemi | P1 | Şirket→yolcu duyuru akışı |

---

## 4. Yapılmayacaklar (Kesin Kapsam Dışı)

| İş | Sebep |
|---|---|
| Company iç rol hiyerarşisi (admin/viewer/dispatcher) | Tek rol kararı kilidi |
| Individual driver mode | Kaldırılacak, MVP'de yeri yok |
| force_password_change | İmplementasyon maliyeti/değer oranı düşük |
| Araç-sefer binding (üçlü atama) | Plaka profilden yeterli |
| 2FA / MFA | MVP dışı |
| SSO / SAML | MVP dışı |
| AI/optimizasyon | MVP dışı |
| UKOME tarife motoru | MVP dışı |
| Muhasebe / faturalama | MVP dışı |
| Gelişmiş raporlama | MVP dışı |
| Şoför performans puanlama | Veri birikmeden değersiz |
| Dark mode | Estetik, MVP dışı |
| Tablet UI optimizasyonu | Telefon öncelikli |
| Çoklu dil (i18n) | MVP Türkçe |
| İç mesajlaşma | Telefon kanalı MVP için yeterli |

---

## 5. Terim Sözlüğü (Standart Referans)

| Terim | Tanım |
|---|---|
| srvCode | 6 karakterlik takip kodu. Alfabe: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`. |
| membership | `companies/{companyId}/members/{uid}` subcollection'ında üyelik kaydı |
| RTDB | Firebase Realtime Database — canlı konum verisi burada tutulur (`locations/{routeId}`) |
| Firestore | Cloud Firestore — ana veri deposu (companies, users, vehicles, routes, trips) |
| inviteCompanyMember | Şirket üyesi davet callable'ı (e-posta ile) |
| createCompany | Şirket oluşturma callable'ı |
| PanelMode | Kaldırılacak eski kavram. Individual / company mode ayrımı artık yok. |
| Fleet Setup | Şirket panelindeki kurulum çalışma alanı (şoför, rota, atama) |
| Live Ops | Şirket panelindeki canlı operasyon çalışma alanı (risk kuyruğu, harita, çekmece) |
| europe-west3 | Firebase Functions bölgesi (Frankfurt) |

