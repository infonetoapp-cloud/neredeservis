# Kesinleştirilmiş MVP Karar Seti

Tarih: 2026-03-02
Durum: AKTİF
Amaç: Tüm "açık kalan sorular" ve "opsiyonel / değerlendirilebilir" ifadelerini kesin karara bağlamak. Bu dosya onaylandıktan sonra hiçbir plandaki soru cevapsız kalmaz.

---

## 1. Kilitlenen Paradigma Kararları

### K01 — Rol Modeli
**Soru:** Kodda 4 şirket rolü var (owner/admin/dispatcher/viewer), plan tek rol diyor. Hangisi?
**Karar:** Plan geçerlidir. Kod plana uyacak. Company RBAC 4 rolü kaldırılacak, tek üyelik modeli kalacak. Individual driver mode da kaldırılacak.
**Etki:** `company-rbac.ts` sadeleşir, `mode-preference.ts` silinir.

### K02 — Platform Owner Paneli
**Soru:** Plan ayrı Platform Owner paneli tanımlıyor, kodda yok. Yazılacak mı?
**Karar:** Evet, ayrı Platform Owner paneli yazılacak. `/platform/*` route grubu olarak.
**Etki:** Yeni ekranlar: Platform Login, Şirketler Listesi, Şirket Oluştur, Şirket Detayı, Kullanıcı Davet.

### K03 — Araç Atama Modeli
**Soru:** Plan şoför+araç+rota üçlü atama diyor, kodda araç-sefer binding yok.
**Karar:** Mevcut model yeterli. Araç-sefer binding yapılmayacak. Plaka şoför profilinden gelir. Atama = Şoför + Rota (ikili).
**Etki:** Atama formu sadeleşir, Task 4.4 kapsamı daralır.

### K04 — Konum Depolama
**Soru:** Plan Firestore diyor, kod RTDB kullanıyor.
**Karar:** Kod doğru. RTDB kalacak. Planlar güncellenir.
**Etki:** Tüm "Firestore'a konum yaz" referansları "RTDB `locations/{routeId}`" olur.

---

## 2. Dosya Bazlı Açık Soru Çözümleri

### Dosya 04 — Rol Bazlı Detaylı Yetki ve İş Akışları

| # | Soru | Karar |
|---|---|---|
| 04-Q1 | Takip kodu formatı nedir? | `srvCode`: 6 karakter, alfabe `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`. Kod: `functions/src/common/srv_code.ts` |
| 04-Q2 | Konum akışı kopma süresi ne olduğunda "stale"? | 5 dakika. Risk kuyruğu: >5dk = warning, >10dk = critical. |
| 04-Q3 | Yolcu/misafir kayıt olmadan takip yapabilecek mi? | Evet. Anonymous Firebase Auth (`signInAnonymously()`). Kayıt MVP dışı. |
| 04-Q4 | Sefer başlatıldıktan sonra atama değiştirilebilecek mi? | Hayır. Aktif seferin ataması değiştirilemez. Önce sefer bitirilmeli. |
| 04-Q5 | Offline konum önbelleği limiti? | Süre: 24 saat. Kayıt: 10.000 nokta. Hangisi önce dolarsa eski kayıtlar silinir. |

### Dosya 05 — Giriş, Kimlik Doğrulama ve Oturum Stratejisi

| # | Soru | Karar |
|---|---|---|
| 05-Q1 | Şirket kullanıcı şifresi SaaS Sahibi mi belirler, otomatik mi? | Davet modeli: `inviteCompanyMember` callable e-posta gönderir, kullanıcı kendi şifresini belirler. Geçici şifre yok. |
| 05-Q2 | Şoföre hesap bilgisi nasıl iletilecek? | Aynı davet modeli. E-posta ile davet linki gönderilir. |
| 05-Q3 | Yolcu deep link formatı? | `neredeservis.app/track/{srvCode}` — srvCode 6 karakter. |

### Dosya 06 — Web Öncelikli MVP Ürün Speci

| # | Soru | Karar |
|---|---|---|
| 06-Q1 | Konum akışı frekansı? | ~1-3 saniye, RTDB write. Maliyet RTDB'de Firestore'a göre ihmal edilebilir. |
| 06-Q2 | Harita sağlayıcısı? | Web = Mapbox (mevcut). Mobil = Google Maps (mevcut). İkisi kalır. |
| 06-Q3 | Platform Owner subdomain? | `/platform/*` route grubu olarak aynı domain altında. Ayrı subdomain MVP'de gereksiz. |
| 06-Q4 | Takip kodu formatı? | srvCode (6 karakter). Onaylandı. |
| 06-Q5 | Pilot hedef şirket/tarih? | Bu sorunun cevabı ürün sahibindedir. Plan bu karara bağımlı değildir. |

### Dosya 07 — Ekran Bazlı IA ve Kabul Kriterleri

| # | Soru | Karar |
|---|---|---|
| 07-Q1 | Şirket paneline giriş sonrası ilk ekran? | Kullanıcı daha önce sefer kurmuşsa Live Ops, ilk kez giriyorsa Fleet Setup. |
| 07-Q2 | Rota oluşturmada harita desteği MVP'de var mı? | Hayır. Metin girişi yeterli. Harita destekli rota çizimi P2. |
| 07-Q3 | Tahmini varış süresi hesabı? | "X durak kaldı" basit gösterimi. Gerçek ETA hesaplaması P2. |

### Dosya 08 — Teknik İş Paketi ve Sıralama

| # | Soru | Karar |
|---|---|---|
| 08-Q1 | Harita SDK seçimi? | Web = Mapbox, Mobil = Google Maps. İkisi zaten kodda var. |
| 08-Q2 | Konum write maliyeti? | RTDB kullanılıyor, Firestore write maliyeti uygulanmaz. RTDB maliyeti ihmal edilebilir düzeyde. |
| 08-Q3 | Geçici şifre nasıl gönderilecek? | Davet modeli. Geçici şifre yok, kullanıcı kendi şifresini davet linkiyle belirler. |
| 08-Q4 | Deep link domain hazır mı? | `neredeservis.app` domain'i kullanılacak. iOS Universal Links + Android App Links konfigürasyonu Hafta 1'de başlar. |
| 08-Q5 | Firebase Functions bölgesi? | `europe-west3` (Frankfurt). Kodda zaten bu. |

---

## 3. Eklenen Yeni Kararlar (Dosyalarda Olmayan)

| # | Konu | Karar |
|---|---|---|
| N01 | Şoför giriş yöntemi (mobil) | E-posta + şifre + Google Sign-In. |
| N02 | Yolcu takip girişi | srvCode elle yazma + QR kod okutma. Deep link de desteklenir. |
| N03 | Araç CRUD | Şirket araç ekler, düzenler. Araç bilgisi şoför profilinde `plate` alanı olarak da tutulur. |
| N04 | Şirket login (web) | E-posta + şifre + Google Sign-In + Microsoft Sign-In. |
| N05 | Araç limiti enforcement | P1'e ertelendi. MVP'de araç sayısı sınırlanmaz. |
| N06 | Company iç rol ayrımı | Yapılmayacak. Tüm şirket üyeleri eşit yetki. |
| N07 | Konum precision | Kalman smoother mobilde aktif. RTDB'ye yazılan veri filtrelenmiş koordinat. |

---

## 4. Yarın Başlayacak İlk 10 İş

| # | İş | Katman | Dosya Referansı |
|---|---|---|---|
| 1 | Company RBAC 4 rolü kaldır, tek üyelik modeline sadeleştir | Web Frontend | `company-rbac.ts`, `company-types.ts` |
| 2 | Individual mode (`PanelMode`) kaldır | Web Frontend | `mode-preference.ts` |
| 3 | Firebase Auth + Firestore veri modeli yapılandırması (mevcudu doğrula) | Backend | `functions/src/`, `firestore.rules` |
| 4 | Security Rules testleri yaz (cross-company erişim testi) | Test | `functions/src/`, yeni test dosyaları |
| 5 | Platform Owner login sayfası oluştur | Web Frontend | `/platform/login` route |
| 6 | Platform Owner — Şirketler Listesi ekranı | Web Frontend | `/platform/companies` route |
| 7 | Platform Owner — Şirket Oluştur formu | Web Frontend + Backend | `/platform/companies/new` route |
| 8 | Şirket login + oturum akışı | Web Frontend | `/login` route (mevcut, doğrulanacak) |
| 9 | Fleet Setup — Şoför CRUD | Web Frontend + Backend | `/company/drivers` route |
| 10 | Fleet Setup — Rota CRUD | Web Frontend + Backend | `/company/routes` route |

---

## 5. Bu Dosyanın Kural Gücü

- Bu dosyadaki her karar **kesindir**. "Opsiyonel", "değerlendirilebilir", "sonra karar verilecek" ifadesi **kalmamıştır**.
- Yeni bir soru ortaya çıkarsa bu dosyaya eklenir ve cevap verilir.
- Diğer plan dosyalarındaki "Açık Kalan Sorular" bölümleri tamamen kaldırılmıştır; bu dosya tek referanstır.

