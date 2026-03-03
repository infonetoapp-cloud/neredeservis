# Master Uygulama Planı

Tarih: 2026-03-02
Durum: AKTİF
Mod: FULL OWNER — Plan + uygulama kontrolü bu dosyadadır.

---

## BÖLÜM 1 — Bulgular Doğrulama Tablosu

| # | Codex Bulgusu | Doğru/Yanlış | Kanıt | Yapılan Aksiyon |
|---|---|---|---|---|
| B1 | 06'da P0/P1 çelişkisi | **DOĞRU** | 07/B3 kabul kriterleri "araç limiti aşarsa engelleniyor" diyordu → 06 P1'e erteledi. 04 §2.10 "P1'de" diyordu. | 07/B3 kabul kriterini "araç limiti aşım engeli P1'de, MVP'de sınırlama yok" olarak düzeltildi. Hata durumu kaldırıldı. |
| B2 | Davet modeli vs "ilk girişte şifre değiştir" çelişkisi | **DOĞRU** | 07/B1: "İlk girişte şifre değiştirme ekranı çıkıyor" + "başlangıç şifresi" yazdı. 05 §1: "kullanıcı kendi şifresini belirler. Geçici şifre yok." | 07/B1 tamamen yeniden yazıldı — ilk giriş şifre değiştirme kaldırıldı, Google/Microsoft eklendi. A5 ve B2'deki "başlangıç şifresi" kaldırıldı. |
| B3 | Araç limiti bir yerde P1, başka yerde MVP zorunlu | **DOĞRU** | 06 P0.7: "araç limiti aşım engeli P1'de". 07/B3: "vehicle_limit'i aşarsa engelleniyor" kabul kriteri. | 07/B3 P1'e hizalandı — "MVP'de sınırlama yok" eklendi. |
| B4 | 08'de membership modeli vs custom-claims çelişkisi | **DOĞRU** | 08 Task 1.3 security rules: "`platform_owner`: companies read/write" ve "`company_user`: kendi company_id'si ile". Bu custom claims terminolojisi. 08 Task 1.2: "Custom claims kullanılmaz." | Task 1.3 security rules metni "superadmin UID" ve "üyelik kontrolü" terminolojisiyle yeniden yazıldı. |
| B5 | RTDB vs Firestore konum kaynağı çelişkisi | **DOĞRU** | 07/B7 kabul kriterinde "Firestore güncellemesiyle gerçek zamanlı kayıyor" yazıyordu. 07/B6 risk rengi "Firestore realtime" yazıyordu. Plan ve kod RTDB diyor. | B7 → "RTDB güncellemesiyle", B6 → "RTDB + Firestore realtime" olarak düzeltildi. |
| B6 | 10'da "açık soru kalmadı" denirken bir maddenin dışarı atılması | **YANLIŞ** | 10 dosyası 18 açık soru + 7 yeni karar çözmüş, hiçbir madde atlanmamış. "Açık Kalan Sorular" bölümleri 01-08'den kaldırılmış, 10 tek referans olarak belirtilmiş. Dışarı atılan madde tespit edilemedi. | Aksiyon gerekmedi. |
| B7 | 07'de davet modeline rağmen başlangıç şifresi alanları | **DOĞRU** | 07/A5 "başlangıç şifresi (zorunlu)", 07/B1 "İlk girişte şifre değiştirme formu", 07/B2 "başlangıç şifresi" alanları mevcuttu. | Tümü düzeltildi — A5 "e-posta (zorunlu)" oldu, B1 tamamen yeniden yazıldı, B2 "davet e-postası" oldu. |

---

## BÖLÜM 2 — Kesin Ürün Tanımı (4 Yüz)

---

### 2.1 SaaS Sahibi Paneli (Web)

**Ne İşe Yarar:**
NeredeServis platformunun tekil sahibi (superadmin) tüm müşteri şirketleri bu panelden sisteme alır, kapasitelerini tanımlar ve yaşam döngülerini yönetir. Satış sonrası bir şirketin dakikalar içinde aktif hale gelmesini sağlar.

**Zorunlu Ekranlar:**

| # | Ekran | Ana Aksiyonlar |
|---|---|---|
| A1 | Platform Login | E-posta+şifre ile giriş → superadmin UID kontrolü → Şirketler Listesi |
| A2 | Şirketler Listesi | Tüm tenant'ları listele, durum (aktif/pasif) toggle, yeni şirket oluştur |
| A3 | Şirket Oluştur | Şirket adı + iletişim e-postası + araç limiti → Firestore `companies` belgesi |
| A4 | Şirket Detayı | Kullanıcı listesi, araç limiti düzenleme, kullanıcı davet, kullanıcı deaktif |
| A5 | Kullanıcı Davet | E-posta ile `inviteCompanyMember` callable → davet linki gönderilir |

**Çözdüğü Sorunlar:**
- Şirket açılışı dağınık/manuel → Tek form ile standardize
- Kapasite yönetimi subjektif → Sayısal `vehicle_limit`
- Kullanıcı oluşturma standartsız → Davet modeli (kullanıcı kendi şifresini belirler)
- Tenant durumu izlenemez → Şirketler listesinde durum sütunu

**MVP Dışı:**
- Başka Platform Owner hesabı oluşturma (superadmin tekil)
- Şirket operasyonuna doğrudan müdahale (destek/denetim senaryosu)
- Fatura/muhasebe, gelişmiş raporlama
- Geçmiş kayıtlara erişim/export

**Kabul Kriterleri:**
1. Yeni şirket oluşturulup ilk kullanıcı davet edilebiliyor.
2. Davet edilen kullanıcı link üzerinden kendi şifresini belirleyip giriş yapabiliyor.
3. Araç limiti tanımlanabiliyor.
4. Şirket aktif/pasif toggle çalışıyor, pasif şirket kullanıcıları giriş yapamıyor.
5. Yanlış rol ile giriş denemesi reddediliyor.

---

### 2.2 Şirket Paneli (Web)

**Ne İşe Yarar:**
Şirket operasyonunu kurulum (Fleet Setup) ve canlı izleme (Live Ops) olmak üzere iki ana bağlamda tek panelde yürütür. İç rol ayrımı yoktur — her şirket kullanıcısı eşit yetkiye sahiptir.

**Zorunlu Ekranlar:**

| # | Ekran | Ana Aksiyonlar |
|---|---|---|
| B1 | Şirket Login | E-posta+şifre / Google / Microsoft → üyelik kontrolü → panel |
| B2 | Şoförler Listesi + Davet | Şoför davet et, düzenle, deaktif et |
| B3 | Araçlar Listesi + CRUD | Araç oluştur (plaka, marka, kapasite), düzenle, deaktif |
| B4 | Rotalar Listesi + CRUD | Rota oluştur (min 2 durak), düzenle, sil |
| B5 | Atama Ekranı | Şoför + Rota seç → atama kaydet (plaka profilden gelir) |
| B6 | Live Ops — Aktif Seferler | Risk kuyruğu (critical/warning/normal), realtime liste |
| B7 | Live Ops — Harita (Mapbox) | Aktif araçlar harita üzerinde, ikon rengi = risk seviyesi |
| B8 | Sefer Detay Çekmecesi | Şoför adı/tel, plaka, son konum, "Şoförü Ara", "Takip Linki Kopyala" |

**Çözdüğü Sorunlar:**
- Kurulum dağınık → Fleet Setup tek bağlamda
- Atama hatalı → İkili atama formu (şoför+rota), çakışma kontrolü
- Risk geç görülüyor → Risk kuyruğu otomatik sıralama
- Müdahale yavaş → Detay çekmecesinden tek tıkla şoförü ara

**MVP Dışı:**
- İç rol hiyerarşisi (admin/viewer/dispatcher) — tek rol kararı kilidi
- Araç limiti aşım engeli — P1
- Rota oluşturmada harita desteği — P2
- Sefer geçmişi/export — P2
- Push notification — P2

**Kabul Kriterleri:**
1. Şoför+rota+atama tek çalışma alanında tamamlanabiliyor.
2. Live Ops'ta aktif seferler risk sırasına göre görünüyor.
3. Haritada aktif araçlar gerçek zamanlı kayıyor (RTDB listener).
4. Sefer detay çekmecesinden şoförü arama ve takip linki kopyalama çalışıyor.
5. Cross-company veri izolasyonu sağlanıyor — başka şirket verisi görülemiyor.

---

### 2.3 Şoför Mobil

**Ne İşe Yarar:**
Sahada görev yapan şoförün atanmış seferini görmesini, tek butonla başlatıp bitirmesini ve sefer boyunca otomatik konum göndermesini sağlar. Görev belirsizliğini ortadan kaldırır.

**Zorunlu Ekranlar:**

| # | Ekran | Ana Aksiyonlar |
|---|---|---|
| C1 | Mobil Login | E-posta+şifre veya Google Sign-In → role=driver kontrolü |
| C2 | Bugünkü Seferim | Atanmış rota, duraklar, plaka → "Seferi Başlat" butonu |
| C3 | Sefer Detayı | Rota adı, durak listesi (sıralı), başlangıç saati |
| C4 | Sefer Aktif | Konum akışı aktif göstergesi, geçen süre, "Seferi Bitir" |
| C5 | Sefer Tamamlandı | Onay mesajı, ana ekrana dön |

**Çözdüğü Sorunlar:**
- "Bugün hangi rota bende?" belirsizliği → Ana ekranda atanmış sefer direkt görünür
- Başlatma/bitirme karmaşık → Tek büyük buton
- Konum bildirimi unutulur → Sefer başlayınca otomatik arka plan konum
- Operasyon merkezi araçları bilemez → RTDB'ye ~1-3 sn konum akışı

**MVP Dışı:**
- Profil düzenleme (şirket yapar)
- Offline kompleks senaryo (temel önbellek yeterli)
- Rota optimizasyonu
- İç mesajlaşma

**Kabul Kriterleri:**
1. Atanmış sefer görüntülenebiliyor, "Seferi Başlat" çalışıyor.
2. Sefer başlatılınca RTDB'ye ~1-3 sn konum yazılıyor.
3. Uygulama arka planda olduğunda konum akışı devam ediyor.
4. "Seferi Bitir" + onay sonrası konum akışı duruyor.
5. Konum izni yoksa sefer başlatılamıyor.

---

### 2.4 Yolcu/Misafir Mobil

**Ne İşe Yarar:**
"Servis nerede?" sorusunu canlı harita takibi ile yanıtlar. Hesap zorunlu değildir — srvCode veya QR kod ile anonymous erişim yeterlidir.

**Zorunlu Ekranlar:**

| # | Ekran | Ana Aksiyonlar |
|---|---|---|
| D1 | Takip Girişi | srvCode (6 karakter) elle gir / QR okut / deep link ile aç |
| D2 | Canlı Takip | Harita + araç ikonu gerçek zamanlı, sefer bilgisi paneli |
| D3 | Duyurular | Şirket duyuruları listesi |

**Çözdüğü Sorunlar:**
- Servisin konumu bilinmiyor → Canlı takip harita
- Varış süresi bilinmiyor → Basit "X durak kaldı" gösterimi (gerçek ETA P2)
- Bilgi almak için çağrı gerekiyor → Uygulama açıp takip et

**MVP Dışı:**
- Yolcu kayıt/hesap oluşturma (anonymous yeterli)
- Gerçek ETA hesaplaması — P2
- Rota durak sırası görselleştirme — P1
- Push notification — P2
- Şoförle mesajlaşma

**Kabul Kriterleri:**
1. Geçerli srvCode ile canlı takip ekranı açılıyor.
2. QR kod okutma ile srvCode otomatik dolduruluyor.
3. Haritada araç ikonu konum güncellemesiyle kayıyor.
4. Sefer bittiğinde "Sefer Tamamlandı" durumuna geçiyor.
5. Geçersiz/tamamlanmış/başlamamış kod doğru hata mesajı gösteriyor.

---

## BÖLÜM 3 — Güncel Kod-Plan Durum Tablosu

### Web Codebase

| # | Özellik | Durum | Kanıt |
|---|---|---|---|
| W01 | Firebase Auth (email+Google+Microsoft) | VAR | `auth-client.ts`, feature-flag kontrollü |
| W02 | Company RBAC 4 rol (owner/admin/dispatcher/viewer) | VAR | `company-rbac.ts` — **kaldırılacak** |
| W03 | Individual driver mode (PanelMode) | VAR | `mode-preference.ts` — **kaldırılacak** |
| W04 | Platform Owner panel (/platform/*) | YOK | Yazılacak |
| W05 | /drivers, /vehicles, /routes sayfaları | VAR | CRUD tam, `/fleet-setup` klasörü boş |
| W06 | Live Ops (risk kuyruğu + harita + çekmece) | VAR | `live-ops-company-active-trips-feature.tsx`, `live-ops-risk-priority-queue.tsx`, Mapbox entegre |
| W07 | inviteCompanyMember callable | VAR | `company_member_mutation_callables.ts` |
| W08 | createCompany callable | VAR | `company_query_callables.ts` |
| W09 | company_access_helpers.ts | VAR | Membership model, `requireActiveCompanyMemberRole` |
| W10 | srv_code.ts | VAR | 6 char, custom alphabet, nanoid |
| W11 | Firestore rules (companies yoksa) | KISMİ | `companies` collection Firestore rules'da yok — callable-only erişim |
| W12 | RTDB rules | VAR | `locations/{routeId}` path, routeWriters/routeReaders/guestReaders |

### Mobil Codebase

| # | Özellik | Durum | Kanıt |
|---|---|---|---|
| M01 | Auth (email+Google+anonymous) | VAR | Full akış, hata yönetimi tam |
| M02 | Şoför trip viewing + start/finish | VAR | `driver_my_trips_screen.dart`, `active_trip_screen.dart`, state machine |
| M03 | Background location + RTDB write | VAR | `location_publish_service.dart`, foreground service, iOS mitigation |
| M04 | Kalman smoother | VAR | `kalman_location_smoother.dart` |
| M05 | Yolcu srvCode girişi + canlı takip | VAR | `join_screen.dart`, `passenger_tracking_screen.dart` |
| M06 | QR kod tarama | VAR | `join_qr_scanner_screen.dart`, `mobile_scanner` |
| M07 | Google Maps entegrasyonu | VAR | Harita, marker, polyline |
| M08 | Offline konum caching | VAR | Drift SQLite, `location_queue` tablosu, Workmanager flush |
| M09 | Deep link handling | YOK | go_router var ama deep link şeması tanımlı değil |
| M10 | Duyuru/bildirim | VAR | FCM token kayıt, topic abonelik, duyuru entity |
| M11 | Driver profil | VAR | Setup, edit, fotoğraf upload |

---

## BÖLÜM 4 — Faz Bazlı Uygulama Planı

---

### Faz 0 — Doküman ve Terminoloji Kilidi (Tamamlandı)

**Amaç:** Tüm plan dosyalarını kod gerçekliğiyle hizalamak, açık soruları kapatmak, terminolojiyi kilitlemek.

**Kapsam:** 00-11 arası plan dosyalar, çelişki temizliği, 4 paradigma kararı.

**Kapsam Dışı:** Kod değişikliği.

**DoD:** Plan dosyalarında sıfır çelişki, sıfır açık soru, grep doğrulaması geçti.

**Risk:** Yok.

**Süre:** Tamamlandı (bu oturum).

---

### Faz 1 — Web Çekirdek: Platform Owner + Şirket Auth (Hafta 1-2)

**Amaç:** SaaS Sahibi'nin şirket açıp kullanıcı davet edebildiği, Şirket kullanıcısının giriş yapabildiği temel auth+CRUD zincirini kurmak.

**Kapsam:**
- Task 0.1: Company RBAC 4 rolü kaldır → tek üyelik modeli
- Task 0.2: Individual mode kaldır
- Task 1.1: Firebase projesi yapılandırmasını doğrula
- Task 1.2: Membership tabanlı erişim kontrolünü doğrula
- Task 1.3: Firestore + RTDB veri modeli ve security rules güncelle
- Task 1.4: Security rules otomatik testleri
- Task 2.1: Platform Owner login sayfası (`/platform/login`)
- Task 2.2: Şirketler listesi
- Task 2.3: Şirket oluştur formu
- Task 2.4: Şirket detay sayfası
- Task 2.5: Şirket kullanıcısı davet etme
- Task 3.1: Şirket login sayfası (mevcut `/login`'i doğrula + güncelle)
- Task 3.2: Şifre sıfırlama

**Kapsam Dışı:** Fleet Setup CRUD, Live Ops, mobil.

**DoD:**
1. SaaS Sahibi → şirket oluştur → kullanıcı davet et → kullanıcı giriş yapsın akışı uçtan uca çalışıyor.
2. Cross-company erişim test ile reddediliyor.
3. Company RBAC 4 rol ve individual mode kaldırılmış.

**Risk:**
- `inviteCompanyMember` davet e-postası gönderim mekanizması (Firebase Auth action URL config)
- RBAC kaldırırken mevcut UI'da kırılan componentler

**Süre:** 2 hafta.

---

### Faz 2 — Fleet Setup + Atama + Live Ops Temel (Hafta 3-4)

**Amaç:** Şirket panelinde şoför/araç/rota CRUD + atama + canlı operasyon izleme altyapısını tamamlamak.

**Kapsam:**
- Task 4.1: Şoför CRUD (mevcut `/drivers` sayfasını doğrula/güncelle)
- Task 4.2: Araç CRUD (mevcut `/vehicles` sayfasını doğrula/güncelle)
- Task 4.3: Rota CRUD (mevcut `/routes` sayfasını doğrula/güncelle)
- Task 4.4: Atama ekranı + `createTrip` callable + srvCode üretimi
- Task 5.1: Aktif seferler listesi + risk kuyruğu (mevcut Live Ops doğrula)
- Task 5.2: Harita görünümü (mevcut Mapbox doğrula)
- Task 5.3: Sefer detay çekmecesi

**Kapsam Dışı:** Mobil geliştirme, araç limiti enforcement (P1).

**DoD:**
1. Şoför davet → araç ekle → rota oluştur → atama yap akışı çalışıyor.
2. Atama çakışma kontrolü (aynı şoföre iki atama engelleniyor).
3. Risk kuyruğunda aktif seferler doğru sıralanıyor.
4. Haritada test verisi ile araç ikonları gösteriliyor.

**Risk:**
- Task 4.4 race condition — Firestore transaction zorunlu
- Mevcut CRUD sayfalarının yeni tek-rol modeline uyumlandırılması

**Süre:** 2 hafta.

---

### Faz 3 — Şoför Mobil (Hafta 5)

**Amaç:** Şoförün mobilde sefere çıkıp konum gönderebildiği tam döngüyü çalıştırmak.

**Kapsam:**
- Task 6.1: Mobil auth (mevcut doğrula — email+Google, role=driver kontrolü)
- Task 6.2: Bugünkü Seferim ekranı (mevcut `driver_home_screen.dart` doğrula)
- Task 6.3: Konum akışı servisi (mevcut `location_publish_service.dart` doğrula)
- Task 6.4: Sefer başlat/bitir + tamamlandı ekranı (mevcut doğrula)

**Kapsam Dışı:** Yolcu mobil, deep link, profil düzenleme.

**DoD:**
1. Şoför giriş → atanmış sefer gör → başlat → konum RTDB'ye yazılıyor → bitir akışı çalışıyor.
2. Arka plan konum devam ediyor.
3. Live Ops haritasında şoförün konumu gerçek zamanlı görünüyor.

**Risk:**
- iOS background location kısıtları (en riskli task)
- Mevcut kodun yeni membership modeline uyumu

**Süre:** 1 hafta.

---

### Faz 4 — Yolcu/Misafir Mobil (Hafta 6)

**Amaç:** Son kullanıcının srvCode ile canlı takip yapabildiği tam döngüyü çalıştırmak.

**Kapsam:**
- Task 7.1: Takip girişi + deep link (mevcut srvCode entry doğrula + deep link konfigürasyonu)
- Task 7.2: Canlı takip ekranı (mevcut `passenger_tracking_screen.dart` doğrula)
- Task 7.3: Duyurular ekranı (mevcut duyuru entity doğrula)

**Kapsam Dışı:** Yolcu kayıt/hesap, gerçek ETA, push notification.

**DoD:**
1. srvCode / QR ile takip ekranı açılıyor.
2. Haritada araç gerçek zamanlı kayıyor.
3. Sefer tamamlandığında doğru durum mesajı gösteriliyor.

**Risk:**
- Deep link iOS Universal Links + Android App Links konfigürasyonu

**Süre:** 1 hafta.

---

### Faz 5 — Entegrasyon ve Pilot (Hafta 7-8)

**Amaç:** Tüm fazları uçtan uca test etmek, pilot şirketi onboard etmek.

**Kapsam:**
- Uçtan uca akış testi (SaaS Sahibi → Şirket → Şoför → Yolcu)
- Security rules penetrasyon testi
- Performans testi (konum akışı yoğunluğu)
- UI polish
- Pilot şirket onboarding

**Kapsam Dışı:** Yeni özellik geliştirme.

**DoD:**
1. Tam döngü 10 kez hatasız tamamlanıyor.
2. Cross-company erişim %0 başarı.
3. Pilot şirket aktif kullanıyor.

**Risk:**
- Performans sorunları yük altında
- Pilot şirket geri bildirimine göre acil değişiklik ihtiyacı

**Süre:** 2 hafta.

---

## BÖLÜM 5 — İlk Kodlama Paketi

### Seçilen Paket: Task 0.1 + Task 0.2 (RBAC ve Individual Mode Kaldırma)

**Neden bu önce:**

```
Bağımlılık zinciri:
  Task 0.1 (RBAC kaldır) ← Task 0.2 (individual mode kaldır)
    ← Task 2.1-2.5 (Platform Owner panel)
      ← Task 3.1 (Şirket login)
        ← Task 4.1-4.4 (Fleet Setup)
          ← Task 5.1-5.3 (Live Ops)
```

1. **Mevcut kodda 4 şirket rolü var** (`owner/admin/dispatcher/viewer`). Plan tek rol diyor. Bu kaldırılmadan yazılan her yeni ekran RBAC guard'larına çarpacak.
2. **Individual driver mode** web'de var (`PanelMode`). Bu kaldırılmadan dashboard layout ve routing karışacak.
3. **En küçük, en güvenli başlangıç:** Silme işlemi, ekleme işleminden daha az risk taşır. Geri alınabilir (git revert).
4. **Tüm sonraki fazların temeli:** Platform Owner paneli de, şirket paneli de bu temiz tabana oturacak.

### Yapılacak İşler (Commit Bazlı):

**Commit 1: `chore: remove company RBAC 4-role system, adopt single membership`**
- `company-rbac.ts`: 4 rol fonksiyonları kaldır, basit `isActiveMember(uid, companyId)` fonksiyonu bırak
- `company-types.ts`: `CompanyMemberRole` tipini sadeleştir
- Etkilenen componentlerde RBAC guard referanslarını temizle

**Commit 2: `chore: remove individual driver mode (PanelMode)`**
- `mode-preference.ts`: `PanelMode` type ve localStorage mantığını kaldır
- `use-active-panel-mode.ts`: Hook'u kaldır
- `mode-select/page.tsx`: Sayfa ve route'u kaldır
- Dashboard layout'ta mode kontrol kodlarını temizle

**Commit 3: `chore: update dashboard routing for single-role company`**
- Mode guard'ları kaldır, direkt şirket paneline yönlendir
- `/fleet-setup` boş klasörünü temizle veya CRUD sayfalarını buraya taşı

---

## BÖLÜM 6 — Kalan Riskler

| # | Risk | Etki | Önlem |
|---|---|---|---|
| R1 | RBAC kaldırırken mevcut componentlerde kırılma | Web paneli çalışmaz | Her kaldırma sonrası `tsc --noEmit` ile compile check |
| R2 | iOS background location kısıtları (Faz 3) | Konum akışı durur | Apple CoreLocation `allowsBackgroundLocationUpdates` + test |
| R3 | inviteCompanyMember davet e-postası delivery | Kullanıcı onboard olamaz | Firebase Auth action URL config doğrulama, email template test |
| R4 | Deep link konfigürasyonu (Faz 4) | Yolcu takip linki çalışmaz | Erken konfigürasyon (Faz 1'de domain setup başla) |
| R5 | createTrip race condition (Faz 2) | Aynı şoföre çift atama | Firestore transaction + pessimistic lock pattern |

---

## BÖLÜM 7 — Revize Edilen Dosyalar (Bu Oturumda)

| Dosya | Değişiklik |
|---|---|
| 07_EKRAN_BAZLI_IA_VE_KABUL_KRITERLERI | A5: başlangıç şifresi kaldırıldı. B1: tamamen yeniden yazıldı (ilk giriş şifre değiştirme kaldırıldı, Google/Microsoft eklendi). B2: başlangıç şifresi → davet. B3: araç limiti P1'e hizalandı. B6: Firestore→RTDB. B7: Firestore→RTDB. |
| 08_TEKNIK_IS_PAKETI_VE_SIRALAMA | Task 1.3 security rules: platform_owner/company_user terminolojisi → superadmin UID/üyelik kontrolü. |
| 11_MASTER_UYGULAMA_PLANI (YENİ) | Bu dosya. |

