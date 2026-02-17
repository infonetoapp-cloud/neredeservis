# NeredeServis - Cursor Uygulama Runbook (Amber UIX, Cok Detayli)

**Versiyon:** v1.2  
**Tarih:** 2026-02-16  
**Hedef:** Cursor'un takilmadan, adim adim, production-seviye uygulama cikarabilmesi  
**Tema:** Amber UIX (Bolt referansli)

---

## 1) Bu Dokuman Nasil Kullanilacak

- Cursor bu dosyayi bastan sona sirayla uygular.
- Her adim tamamlanmadan sonraki adima gecilmez.
- "KULLANICIDAN ONAY ISTE" etiketli adimlarda Cursor mutlaka senden cevap ister.
- "DOGRULAMA" adimlarinda Cursor kanit uretir (komut cikisi, ekran goruntusu, test sonucu).
- Belirsizlik olursa Cursor tahmin etmez; once sorar.
- Ucretsiz limitleri asmak icin coklu hesap kullanimi yapilmaz (ToS ihlali riski).
- Cursor'a ayni anda tum fazlar verilmez; her calismada sadece aktif faz + onceki fazin cikti dosyalari context'e verilir.
- API key hardening onboarding kuralı zorunlu:
  - Yeni muhendis/ajan ilk gun `scripts/harden_firebase_api_keys.ps1` scriptini en az `backup` ve `verify` modlarinda calistirir.
  - Firebase key/restriction degisikligi yapildiginda `apply` + `verify` birlikte calistirilir.
  - Cikti kaniti `docs/proje_uygulama_iz_kaydi.md` dosyasina ayni gun eklenir.

---

## 2) Kullanicidan Istenecek Bilgiler (Dis Bagimlilik Envanteri)

Asagidaki bilgiler ilgili adimlara gelindiginde istenir:

1. Firebase proje adi ve region tercihi (`europe-west3`)
2. Android package id (`com.neredeservis.app` gibi)
3. iOS bundle id
4. Mapbox public token (mobile kisitli)
5. Mapbox secret token (sadece server)
6. Sentry DSN (opsiyonel ama onerilir)
7. Apple Developer Team bilgileri (iOS release icin)
8. APNs key (`.p8`) bilgileri (FCM iOS push)
9. Google Play SHA-256 fingerprintleri
10. Domain bilgisi (`nerede.servis` varsa)
11. Gizlilik politikasi URL
12. KVKK metin versiyonu (v1.0 gibi)
13. WhatsApp paylasim metni onayi
14. Flutter pinlenecek exact surum (`3.24.5`, `flutter --version` cikisi ile dogrulanmis)
15. KVKK hukuki onay tarihi ve onaylayan kisi
16. App Store "Always Location" aciklama metni
17. Google Play background location declaration metni
18. RevenueCat product id seti (`monthly`, `yearly`, `trial`) + store tarafi urun ekran goruntuleri
19. App Store/Play fiyat yerellesme listesi ve deneme suresi parametresi
20. Hedef storefront ulkeleri + alternatif billing programina girilecek mi karari
21. (V1.1) iOS App Clip icin associated domain ve App Clip target bundle id
22. (V1.1) Android Instant App icin feature module/package stratejisi karari
23. Play Data Safety cevap seti onayi (driver-only location, sharing=no, delete=yes)
24. Play kategori secimi onayi (`Travel & Local`)
25. Izin red fallback metin seti onayi (notification/gps/battery icin kullanici metinleri)
26. Izin tekrar isteme cooldown onayi (onerilen: 24 saat)
27. Map Matching maliyet limiti/onayi (`enabled`, aylik max istek, failover kurali)
28. Support kanal bilgisi (varsayilan support e-posta: `infonetoapp@gmail.com` + opsiyonel Slack webhook)
29. Sesli geri bildirim dil/ton onayi (`kisa bip` veya `TTS`)
30. Virtual stop varsayilan davranis onayi (katilimda secim zorunlu/opsiyonel)
---

## 3) Amber UIX Tasarim Kurallari (Bolt Referansli)

### 3.1 Renk Sistemi
- `amber-500`: `#E8760A`
- `amber-400`: `#FF9042`
- `amber-100`: `#FFF3E7`
- `ink-900`: `#101413`
- `ink-700`: `#27312D`
- `surface-0`: `#FFFFFF`
- `surface-50`: `#F7F8F5`
- `line-200`: `#D8DFD4`
- `success`: `#3DA66A`
- `danger`: `#D64E45`

### 3.2 Tipografi
- Baslik: `Space Grotesk`
- Govde: `Manrope`
- Baslik agirliklari: 700/800
- Govde agirliklari: 500/600

### 3.3 Spacing ve Radius
- Grid birimi: `4px`
- Standart bosluklar: `8, 12, 16, 20, 24, 32`
- Radius: `14, 20, 28`

### 3.4 UI Davraniş Kurali
- Tek ekranda tek ana karar
- Birincil CTA amber, ikincil CTA koyu/outline
- Driver aktif sefer ekraninda sade harita + guidance bilgisi + heartbeat disinda oge yok
- Driver aktif seferde yikici aksiyon (`Seferi Bitir`) tek dokunusla calismaz; `slide-to-finish` veya `uzun bas` zorunlu
- Heartbeat `red` durumunda periferik alarm zorunlu: kirmizi yanip-sonen cerceve + ayri haptic pattern
- Yolcu haritasi: ETA + stale + sofor notu tek sheet'te
- `now > scheduledTime + 10 dk` ve aktif trip yoksa yolcu kartinda `Sofor henuz baslatmadi (Olasi Gecikme)` etiketi goster
- Koyu tema V1.0'da yok (acik tema tek)

### 3.5 Harita Maliyet ve Uyum Kurali
- Ilk 2 ay hedef: harita ek maliyeti `0`.
- Directions API varsayilan olarak kapali (`remote config` ile acilabilir).
- Varsayilan ETA kaynagi: client-side hesaplama (`crowFly * katsayi`).
- Ucretsiz limitleri asmak icin coklu Map saglayici hesabi acma/yurutme yasak.
- Aylik hard cap asilirsa otomatik fallback moduna don.

### 3.6 Odeme Ekrani Konum Kurali (Store Uyumlu)
- Paywall sadece sofor rolune gosterilir.
- Gorunme noktasi:
  - `Ayarlar > Abonelik` (kalici)
  - Trial bittiginde ana ekranda banner
  - Premium aksiyon tetigi
- Ekranda zorunlu kontroller:
  - `Restore Purchases` (iOS)
  - `Satin Alimlari Geri Yukle` (Android)
  - `Manage Subscription` (iOS + Android)
- Varsayilan kural: satin alma store billing ile yapilir.
- Bolgesel entitlement/program kullanilacaksa (storefront bazli istisna), hukuk + policy checklist onayi olmadan acilmaz.

### 3.7 QR Giris ve Viral Donusum Kurali
- V1.0: QR -> landing page -> store akisi kabul.
- V1.1: iOS App Clip + Android Instant App kesif ve entegrasyon plani zorunlu.
- Amaç: "Sadece bak-cik" kullanicisini uygulama indirmeden native mini deneyime almak.
- App Clip/Instant App ekraninda tek CTA: `Bildirim almak icin tam uygulamayi indir`.

### 3.8 Izin Isteme Zamani ve Red/Fallback Kurali
- Genel kural: izinler onboarding'in basinda toplu istenmez; sadece ilgili aksiyon tetiklediginde istenir.
- `Bildirim izni`:
  - Yolcu: route'a katilim tamamlaninca veya `Bildirim Acik Kalsin` CTA'sina basinca istenir.
  - Sofor: ilk `duyuru gonder` / `sabah hatirlatma` ozelligi kullanilirken istenir.
  - Red durumunda: push yerine in-app kart/banner calisir; kritik olaylarda sadece uygulama ici gorunur.
- `Konum izni (while-in-use)`:
  - Sadece sofor rolu.
  - `Seferi Baslat` veya `Ghost Drive kaydi baslat` aninda istenir.
  - Red durumunda: aktif sefer baslatilamaz; sadece route yonetimi/yolcu listesi kullanilir.
- `Konum izni (background/always)`:
  - Sadece sofor rolu ve `while-in-use` verildikten sonra, aktif sefer commit adiminda istenir.
  - Red durumunda: uygulama acikken takip devam eder, arka planda yayin kesilebilir; yolcuda stale riski etiketi gorunur.
- `Pil optimizasyonu istisnasi` (Android):
  - Ilk basarili aktif seferden sonra veya heartbeat `red/yellow` nedeni OEM kill olarak tespit edilirse egitim ekrani ile istenir.
  - Red durumunda: servis ekran kapaliyken daha sik kesilebilir; publish araligi dusurulemezse degrade moda gecilir ve sofore acik uyari gosterilir.
- Tekrar isteme kurali:
  - Sert red (`Don't ask again`) sonrasi zorlayici prompt yok; sadece Ayarlar CTA'si.
  - Ayni izin icin otomatik tekrar isteme min. 24 saat cooldown.

### 3.9 Ghost Drive Kalite Kurali
- Ghost trace ham GPS verisi dogrudan rota cizgisine donusturulmez.
- Isleme sirasi:
  - Ham trace sanitize (duplicate/accuracy/outlier temizligi)
  - Douglas-Peucker sadelestirme
  - Map Matching post-process (yola yapistirilmis temiz geometri)
- Map Matching cagrisi remote config ile ac/kapa yonetilir; kota asimi veya hata durumunda DP sonucu ile devam edilir.
- Canli marker goruntusu icin istemci tarafinda hafif Kalman smoothing zorunlu (titreme ve zigzag etkisini azalt).
- Varsayilan Kalman parametreleri: `processNoise=0.01`, `measurementNoise=3.0`, `updateIntervalMs=1000`.

### 3.10 Sofor Sesli Geri Bildirim Kurali
- Heartbeat red/yellow/green gecislerinde gorsel+haptic yanina sesli geri bildirim eklenir.
- Minimum sesli olaylar:
  - Red state: `Baglanti kesildi`
  - Iyilesme: `Baglandim`
  - Sefer bitisi: `Sefer sonlandirildi`
- Ayar: `Sesli Uyari` ac/kapa zorunlu (varsayilan acik, sahada kapatilabilir).

### 3.11 Destek ve Operasyon Kurali
- Uygulamada `Sorun Bildir` girisi zorunlu; opsiyonel `telefonu salla -> rapor ac` kisayolu eklenir.
- Rapor paketinde son 5 dk log ozeti + izin durumu + baglanti tipi + pil seviyesi + queue boyutu bulunur.
- PII temizligi zorunlu: acik telefon/e-posta/mesaj icerigi rapora girmez.

### 3.12 Apple Review Terminoloji Kurali
- Apple metadata/review notlarinda `tracking` kelimesi yerine:
  - `Route Coordination`
  - `Trip Sharing`
- Vurgu: soforun duragi kacirmamasi + yolcunun bekleme suresinin azalmasi.
- `Kisi takibi/izleme` dilinden kacinilmasi zorunlu.

### 3.13 Onboarding Video Entegrasyon Zamani Kurali
- Video-onboarding en sona birakilmaz; 3 asamada uygulanir.
- Asama-1 (erken): sadece "video-ready shell" kurulur (poster, CTA, skip, fallback).
- Asama-2 (core stabil olduktan sonra): gercek video asseti ve oynatma akisi entegre edilir.
- Asama-3 (release yakini): codec/sikistirma/performance ve dusuk cihaz testleriyle final polish yapilir.
- Kritik kural: video failure durumunda auth/onboarding akisi bloklanmaz; statik poster fallback ile devam edilir.

---

## 4) Adim Adim Uygulama Plani (001 - 460 + Kritik Ek Adimlar)

## FAZ A - Proje Cekirdegi ve Plan Kilidi (001-030)

- [ ] 001 Bu runbook dosyasini `RUNBOOK_LOCKED.md` olarak kopyala ve degisiklik tarihini yaz.
- [ ] 002 `NeredeServis_Teknik_Plan.md` ile bu runbook arasinda celiski var mi kontrol et.
- [ ] 002A Celiski cozum kurali yaz: `Runbook ile Teknik Plan celisirse Teknik Plan kazanir`.
- [ ] 003 Varsa celiski listesini `runbook_diff_report.md` dosyasina yaz.
- [ ] 004 `prototype/screens/bolt_uix_screensheet.png` dosyasini referans UX kaynagi olarak sabitle.
- [ ] 005 Projede zorunlu branch modelini yaz: `feature/* -> develop -> main`.
- [ ] 006 Kod standardini yaz: `very_good_analysis` + `riverpod_lint`.
- [ ] 007 Dizin standardini yaz: feature-first.
- [ ] 008 Logging standardini yaz: debug/info/warn/error ayrimi.
- [ ] 009 Error kod standardini yaz: `FAILED_PRECONDITION`, `PERMISSION_DENIED`, `INVALID_ARGUMENT`.
- [ ] 010 App flavor adlarini sabitle: `dev`, `staging`, `prod`.
- [ ] 011 DOGRULAMA: Dokumanlarin son versiyonunu listele.
- [ ] 012 Cursor task id formatini tanimla (`NS-001`, `NS-002` ...).
- [ ] 013 Story point formatini belirle (1/2/3/5/8).
- [ ] 014 Sprint suresini sabitle (7 gun).
- [ ] 015 Kabul kriteri formatini yaz (`Given/When/Then`).
- [ ] 016 Risk kayit formatini yaz (`Risk/Etki/Olasilik/Onlem`).
- [ ] 017 Teknik borc notasyonu belirle (`TECHDEBT:` etiketi).
- [ ] 018 UI kararlarinin tek kaynak dosyasini olustur: `docs/ui_amber_spec.md`.
- [ ] 019 API kontratlarinin tek kaynak dosyasini olustur: `docs/api_contracts.md`.
- [ ] 019A Tum callable endpointler icin TypeScript interface bloklarini `docs/api_contracts.md` icine yaz (input/output `any` yok).
- [ ] 020 Guvenlik checklist dosyasini olustur: `docs/security_gate.md`.
- [ ] 020A Izin orkestrasyon dosyasini olustur: `docs/permission_orchestration.md` (tetik anlari + deny fallback + settings CTA metinleri).
- [ ] 020B Destek raporlama sozlesmesini olustur: `docs/support_report_spec.md` (hangi telemetry alanlari toplanir, PII redaction kurali).
- [ ] 020C Feature flag sozlesmesini olustur: `docs/feature_flags.md` (key, tip, varsayilan, kaynak, rollout notu).
- [ ] 020D Drift sema/migration sozlesmesini olustur: `docs/drift_schema_plan.md` (schemaVersion + upgrade path).
- [ ] 021 KULLANICIDAN ONAY ISTE: "Runbook kilitliyor muyuz? (evet/hayir)".
- [ ] 022 Onay gelmeden kod degisikligine gecme.
- [ ] 023 Onay gelirse `RUNBOOK_APPROVED` kaydi ekle.
- [ ] 024 CI pipeline adimlarini taslak yaz.
- [ ] 025 Local env dosya semasini yaz (`.env.dev`, `.env.staging`, `.env.prod`).
- [ ] 026 Gizli bilgi politikasi yaz (`.env` asla repo'ya girmez).
- [ ] 027 Firebase emulator zorunlulugunu not et.
- [ ] 028 `make` veya script komut listesini olustur.
- [ ] 029 DOGRULAMA: Runbook referans dosyalari var mi kontrol et.
- [ ] 030 Faz A kapanis raporu yaz.

## FAZ B - Firebase Kurulumu ve Kimlik Altyapisi (031-090 + Kritik Gate)

- [ ] 031 Firebase CLI kurulu mu kontrol et.
- [ ] 032 `firebase login` durumunu kontrol et.
- [ ] 033 `firebase projects:list` ile erisim dogrula.
- [ ] 034 KULLANICIDAN ONAY ISTE: "Firebase proje adini ve org bilgisini ver".
- [ ] 034A `docs/firebase_platform_blueprint.md` dokumanini baz alarak platform kararlarini kilitle (naming, IAM, budget, backup, App Check).
- [ ] 034B KULLANICIDAN ONAY ISTE: "Organization/Folder + Billing account + project ID fallback + region (europe-west3) onayi".
- [ ] 035 Firebase `dev` projesini olustur.
- [ ] 036 Firebase `staging` projesini olustur.
- [ ] 037 Firebase `prod` projesini olustur.
- [ ] 037A Billing gate kontrolu yap: billing yoksa `Spark-first` moduna gec, Functions/Scheduler deploylarini "billing sonrasi" olarak isaretle.
- [ ] 037B Cloud API enable checklist'i uygula (non-negotiable): `cloudfunctions`, `run`, `cloudbuild`, `artifactregistry`, `eventarc`, `pubsub`, `cloudscheduler`, `secretmanager`, `firestore`, `firebasedatabase`, `identitytoolkit`.
- [ ] 037C DOGRULAMA: `gcloud services list --enabled` cikisinda 037B API listesi gorunuyor mu? Kanit dosyasina kaydet.
- [ ] 038 Region politikasini `europe-west3` olarak sabitle.
- [ ] 038B Proje environment tag'lerini ekle: dev=`Development`, staging=`Staging`, prod=`Production` (gcloud Resource Manager tag binding).
- [ ] 038A Her ortam icin budget ve alarm esiklerini olustur (50/75/90/100) ve dokumante et.
- [ ] 039 Firestore database olustur (prod icin locked mode).
- [x] 040 RTDB instance olustur (region uyumlu).
- [x] 041 Cloud Functions region ayarini `europe-west3` yap.
- [ ] 041A Service account baseline'ini uygula (`nsv-ci-deployer`, `nsv-functions-runtime`, `nsv-scheduler`) ve minimum yetki prensibiyle role bagla.
- [x] 042 Firebase Auth providerlarini ac: Email, Google.
- [x] 043 Anonymous auth'u ac (guest flow icin).
- [x] 044 FCM'i aktif et.
- [x] 045 App Check konfigurasyon taslagi cikar.
- [x] 046 Android app'i Firebase'e kaydet.
- [x] 047 iOS app'i Firebase'e kaydet.
- [x] 048 KULLANICIDAN ONAY ISTE: "Android package id ve iOS bundle id nedir?".
- [x] 049 `google-services.json` (dev) al.
- [x] 050 `GoogleService-Info.plist` (dev) al.
- [x] 051 staging dosyalarini al.
- [x] 052 prod dosyalarini al.
- [ ] 053 `firebase_options.dart` generate et.
- [x] 054 Auth domain ve redirect ayarlarini kontrol et.
- [x] 055 Firestore index json dosyasini olustur.
- [x] 056 Functions runtime `nodejs20` ayarla.
- [x] 057 Hosting site targetlarini tanimla (`dev/staging/prod`).
- [x] 058 Local emulator config yaz (`firestore/auth/functions/database`).
- [x] 059 Emulator port cakismasi var mi kontrol et.
- [x] 060 DOGRULAMA: Emulatorlar tek komutla kalkiyor mu?
- [x] 061 Firestore rules dosyasini baslangicta deny-all yap.
- [x] 062 RTDB rules dosyasini deny-all yap.
- [x] 062A RTDB live location timestamp validate penceresini daralt: `<= now+5000` ve `>= now-30000` (2 dk pencere yok).
- [x] 063 Users koleksiyonu role semasini ekle.
- [x] 064 Drivers koleksiyonu semasini ekle.
- [x] 065 Routes koleksiyonu semasini ekle.
- [x] 066 Trips koleksiyonu semasini ekle.
- [x] 067 Announcements koleksiyonu semasini ekle.
- [x] 068 Consents koleksiyonu semasini ekle.
- [x] 069 Guest sessions semasini ekle.
- [x] 070 `trip_requests` idempotency semasini ekle.
- [x] 071 Composite indexleri ekle.
- [x] 072 `memberIds` + `routeWriters` yasam dongusu kuralini dokumante et (grant/revoke/ttl).
- [x] 073 `skip_requests` gizlilik kuralini ekle.
- [x] 073A `driver_directory` read kuralini kapat: toplu liste okuma yok, sadece callable arama sonucu ve limitli alanlar donsun.
- [x] 073B `driver_directory` arama callable'ini yaz (`searchDriverDirectory`): hash lookup + min query uzunlugu + rate limit + max 10 sonuc.
- [x] 074 Rules unit test dosyasi olustur.
- [x] 075 Auth test fixture kullanicilari olustur (driver/passenger/guest).
- [x] 076 Driver non-member read testini yaz (403 beklenir).
- [x] 077 Passenger non-member read testini yaz (403 beklenir).
- [x] 078 Guest expiry testini yaz (RTDB read kesilmeli).
- [x] 079 Direct write denial + stale `routeWriter` denial testini yaz.
- [x] 079A Rules test: driver roluyle `driver_directory` toplu read denemesi 403 veriyor mu.
- [x] 079B Rules test: RTDB `timestamp` penceresi disi (`now-30001`) write denemesi deny oluyor mu.
- [x] 080 DOGRULAMA: Tum rules testleri green mi?
- [x] 081 App Check debug tokenlarini sadece dev icin ac.
- [x] 082 Staging/prod debug tokenlerini kapat.
- [ ] 083 KULLANICIDAN ONAY ISTE: "Play Integrity icin SHA-256 bilgilerini paylas".
- [ ] 084 Android App Check provider olarak Play Integrity sec.
- [ ] 085 iOS App Check provider olarak DeviceCheck sec.
- [ ] NOTE (Release Gate): 083-085 adimlari uygulama Play Console'da ilk AAB ile internal teste cikana kadar beklemede tutulur. App signing SHA-256 / upload SHA-256 olusmadan uygulanmaz.
- [x] 086 APNs/FCM + iOS background location entitlement gereksinim notunu ekle.
- [x] 086A Google Play background location justification taslagini yaz: `Sofor aktif sefer baslattiginda yolcularin guvenli ve dogru takip edebilmesi icin uygulama arka planda konum paylasir; sefer bitince takip durur`.
- [ ] 087 KULLANICIDAN ONAY ISTE: "APNs key (.p8, key id, team id) + Apple Team bilgisi var mi?".
- [ ] NOTE (Blocker): Apple Developer/App Store Connect hesabi acilmadan 087 tamamlanmaz. Bu blokaj kalkmadan 088-089 iOS kismi release gate'te bekler.
- [ ] 088 iOS background GPS proof-of-concept olustur (Always permission + app terminate + 60 dk ekran kapali surus).
- [ ] 088A Cross-device PoC kos: iPhone 11 (iOS 17+) + Samsung A24 (Android 14+) 60 dk ekran kapali publish stabil mi.
- [ ] 089 DOGRULAMA: iOS/Android 60 dk ekran kapali PoC stabil mi? (fail ise FAZ C'ye gecme).
- [ ] 090 DOGRULAMA: Test push dev ortamda aliniyor mu?
- [x] 090A KVKK metnini hukuk review'una gonder ve yorumlari `docs/legal_kvkk_review.md` dosyasina yaz.
- [x] NOTE: `docs/legal_kvkk_review.md` uzerinde hukuki onay `EVET` olarak kayda alindi.
- [x] 090B KULLANICIDAN ONAY ISTE: "KVKK hukuki onay alindi mi? (evet/hayir)".
- [x] 090C Onay yoksa release branch acma, sadece teknik gelistirmeye devam et.
- [x] 090D Faz B kapanis raporu yaz.

## FAZ C - Flutter Iskeleti ve Paketler (091-130)

- [x] 091 Flutter surumunu exact pinle (`fvm use 3.24.5`) ve `stable` etiketine bagimli kalma.
- [x] 092 `flutter --version` + `flutter doctor -v` ciktisini `docs/flutter_lock.md` dosyasina kaydet.
- [x] 092A `docs/flutter_lock.md` icine `Flutter=3.24.5`, `Dart`, `FVM`, `channel` ve host OS hash bilgisini sabitle.
- [x] 093 Projeyi olustur (`flutter create`).
- [x] 094 `analysis_options.yaml` standardini ekle.
- [x] 094A `docs/flutter_upgrade_guard.md` dosyasini olustur (deprecation takibi + migration notlari).
- [x] 094B Material 3 migration checklist'i olustur ve ThemeData'da M3 uyumunu kilitle.
- [x] 094C `flutter pub outdated` + `dart fix --dry-run` raporunu her sprint cikisinda zorunlu kil.
- [x] 095 `pubspec.yaml` bagimliliklarini teknik plana gore exact versiyon pinleyerek ekle.
- [x] 096 Riverpod generator paketlerini ekle.
- [x] 096A `build_runner` watch scripti ekle (`dart run build_runner watch -d`).
- [x] 097 Drift ve sqlite paketlerini ekle.
- [x] 098 Firebase core/auth/firestore/rtdb/messaging paketlerini ekle.
- [x] 099 Mapbox paketini exact versiyonla pinle ve minimum Flutter uyumunu not et.
- [ ] 099A Mapbox Flutter PoC calistir (Android + iOS real device smoke).
- [x] 099B MapLibre alternatif PoC notunu `docs/map_provider_decision.md` dosyasina yaz.
- [ ] 099C KULLANICIDAN ONAY ISTE: "Ilk 2 ay Directions API varsayilan kapali kalsin mi? (onerilen: evet)".
- [ ] 099D Token guvenlik ayarlarini yap: minimum scope + mobil app kisiti; URL restriction'a guvenme.
- [ ] 099E In-app purchase stack'ini pinle: Google Play Billing Library `6.x` uyumunu dogrula (plugin surum notunu `docs/billing_lock.md` dosyasina yaz).
- [ ] 099F KULLANICIDAN ONAY ISTE: "Flutter lock 3.24.5 kabul mu?".
- [ ] 100 Sentry paketi ekle (opsiyonel).
- [ ] 101 `flutter pub get` calistir.
- [ ] 102 Klasor yapisini runbook standardina gore kur.
- [ ] 103 App flavor ayarlarini Android tarafinda yap.
- [ ] 104 App flavor ayarlarini iOS tarafinda yap.
- [ ] 105 `main_dev.dart`, `main_staging.dart`, `main_prod.dart` dosyalarini olustur.
- [ ] 106 Environment loader yapisini kur.
- [ ] 107 Firebase init'i flavor'a gore ayarla.
- [ ] 108 App Check init'i flavor'a gore ayarla.
- [ ] 109 Global error handler (`runZonedGuarded`) kur.
- [ ] 110 Sentry entegrasyonu (varsa) dev disinda ac.
- [ ] 111 Router iskeletini kur.
- [ ] 112 Auth guard iskeletini kur.
- [ ] 113 Role guard iskeletini kur.
- [ ] 114 Theme provider iskeletini kur.
- [ ] 115 Local storage abstraction yaz.
- [ ] 116 Repository interface katmanini olustur.
- [ ] 117 DTO-model mapperlari olustur.
- [ ] 118 Exception ve failure hiyerarsisini olustur.
- [ ] 119 Logger servis katmanini olustur.
- [ ] 120 DOGRULAMA: Uygulama dev flavor ile aciliyor mu?
- [ ] 121 CI icin `flutter analyze` job'u ekle.
- [ ] 122 CI icin `flutter test` job'u ekle.
- [ ] 123 CI icin emulator integration job'u ekle.
- [ ] 123A Git hook ekle: pre-commit'te `flutter analyze` + `flutter test` zorunlu.
- [ ] 124 Build script'i (`build_dev`, `build_stg`, `build_prod`) yaz.
- [ ] 125 Local run script'i (`run_dev`) ve kod uretim script'i (`watch_codegen`) yaz.
- [ ] 126 `README_SETUP.md` olustur.
- [ ] 127 KULLANICIDAN ONAY ISTE: "Sentry DSN kullanilsin mi?".
- [ ] 128 DSN varsa `.env`'ye ekle.
- [ ] 129 DOGRULAMA: tum flavorlar derleniyor mu?
- [ ] 130 Faz C kapanis raporu yaz.

## FAZ D - Amber UIX Sisteminin Kodlanmasi (131-180)

- [ ] 131 `theme_amber.dart` dosyasini olustur.
- [ ] 131A `theme_builder.dart` dosyasini olustur (token -> ThemeData donusumu tek yerden yonetilsin).
- [ ] 132 Amber color tokens'i `lib/ui/tokens/color_tokens.dart` dosyasinda tanimla.
- [ ] 133 Typography tokens (Space Grotesk + Manrope) tanimla ve lisans notunu ekle.
- [ ] 133A KULLANICIDAN ONAY ISTE: "Font yukleme yontemi local asset mi (onerilen) yoksa runtime Google Fonts mu?".
- [ ] 133B Secime gore uygulama yap: local asset ise `pubspec` font assets; runtime ise offline fallback + preload.
- [ ] 134 Spacing tokens tanimla.
- [ ] 135 Radius tokens tanimla.
- [ ] 136 Elevation/shadow tokens tanimla.
- [ ] 137 Button variants (primary/secondary/danger) olustur.
- [ ] 138 Input styles (default/focus/error) olustur.
- [ ] 139 Badge ve pill componentlerini olustur.
- [ ] 140 Bottom sheet template componentini olustur.
- [ ] 141 Screen scaffold componentini olustur.
- [ ] 142 Status chip componentini olustur.
- [ ] 143 Route card componentini olustur.
- [ ] 144 Announcement card componentini olustur.
- [ ] 145 Stale status banner componentini olustur.
- [ ] 146 Empty state componentini olustur.
- [ ] 147 Driver action panel componentini olustur.
- [ ] 148 CTA hierarchy kurali dokumante et.
- [ ] 149 Motion kurali tanimla (sade fade/slide).
- [ ] 150 Font fallback stratejisi tanimla (sistem fallback sirasi + missing glyph davranisi).
- [ ] 151 DOGRULAMA: Golden test altyapisini kur.
- [ ] 152 Splash + Hook ekranini amber stile gore kodla.
- [ ] 152A Onboarding giris ekrani icin `video-ready shell` kur (poster + CTA + skip + gradient overlay; video yoksa da tam calissin).
- [ ] 152B Fail-safe fallback uygula: video decode/network/asset hatasinda statik poster moduna otomatik gec; blank ekran olmasin.
- [ ] 152C Oynatim politikasini uygula: varsayilan sessiz autoplay, ilk acilista max 1 dongu; sonraki acilislarda hizli gecis.
- [ ] 152D DOGRULAMA: video-shell acikken cold-start regresyonu ve jank kontrolu (dusuk cihazlarda kabul edilebilir mi?).
- [ ] 153 Role select ekranini amber stile gore kodla.
- [ ] 154 Driver home ekranini amber stile gore kodla.
- [ ] 155 Active trip ekranini amber stile gore kodla.
- [ ] 156 Passenger map bottom-sheet ekranini amber stile gore kodla.
- [ ] 157 Join + settings ekranini amber stile gore kodla.
- [ ] 157A Sofor abonelik/paywall ekranini amber stile gore kodla (monthly/yearly, trial, restore/manage).
- [ ] 157B Odeme metin kaynagini bagla: `NeredeServis_Paywall_Copy_TR.md`.
- [ ] 158 `prototype/screens` ile visual parity kontrolu yap.
- [ ] 159 UI farklari varsa `ui_gap_list.md` dosyasina yaz.
- [ ] 160 Accessibility kontrast kontrolu yap (WCAG AA minimum).
- [ ] 161 Dokunma alani kontrolu yap (min 44x44).
- [ ] 162 Text scaling 1.3x test et.
- [ ] 163 Kucuk ekran (360x800) tasma kontrolu yap.
- [ ] 164 Buyuk ekran (430x932) bosluk kontrolu yap.
- [ ] 165 Bottom nav sabitleme davranisini test et.
- [ ] 166 Keyboard acikken form davranisini test et.
- [ ] 167 DOGRULAMA: UI snapshot testleri green mi?
- [ ] 168 KULLANICIDAN ONAY ISTE: "Amber UI son gorunum onayi veriyor musun?".
- [ ] 169 Onay yoksa sadece UI duzeltme turu ac.
- [ ] 170 Onay varsa UI freeze etiketi ekle.
- [ ] 171 `docs/ui_amber_spec.md` final guncellemesini yap.
- [ ] 172 Icon setini sabitle (Phosphor).
- [ ] 173 Emoji kullanimini sadece duyuru sablonlariyla sinirla.
- [ ] 174 Driver aktif seferde mini harita + heartbeat + "siradaki durak mesafesi" kuralini sabitle.
- [ ] 175 Passenger ekranda tek sheet kuralini sabitle.
- [ ] 176 Primary CTA metinlerini standartlastir.
- [ ] 177 Warning/error renk semasini sabitle.
- [ ] 178 Toast/snackbar semasini sabitle.
- [ ] 179 DOGRULAMA: UI lint + widget testleri green mi?
- [ ] 180 Faz D kapanis raporu yaz.

## FAZ E - Domain ve Data Katmani (181-220)

- [ ] 181 User entity/model/mapper yaz.
- [ ] 182 Driver entity/model/mapper yaz.
- [ ] 183 Route entity/model/mapper yaz.
- [ ] 183A Ghost Drive iz kaydi icin `RouteTracePoint` entity/model/mapper yaz.
- [ ] 183B Route olusturma modunu modele ekle: `manual_pin | ghost_drive`.
- [ ] 184 Stop entity/model/mapper yaz.
- [ ] 185 Passenger profile entity/model/mapper yaz.
- [ ] 186 Trip entity/model/mapper yaz.
- [ ] 187 Announcement entity/model/mapper yaz.
- [ ] 188 Consent entity/model/mapper yaz.
- [ ] 189 Guest session entity/model/mapper yaz.
- [ ] 189A Anonymous->registered gecisi icin local ownership modelini ekle (`ownerUid`, `previousOwnerUid`, `migratedAt`).
- [ ] 190 Repository arayuzlerini tamamla.
- [ ] 191 Firestore datasource implementation yaz.
- [ ] 192 RTDB datasource implementation yaz.
- [ ] 193 Drift queue tablolarini olustur (`location_queue`, `trip_action_queue`, `status`, `failed_retry_count`, `next_retry_at`, `max_retry_reached_at`, `local_meta`).
- [ ] 193A Drift `schemaVersion=1` ve `MigrationStrategy` iskeletini yaz (`onCreate`, `onUpgrade`, `beforeOpen`).
- [ ] 193B Drift migration testlerini ekle (v1->v2 dry-run; ownerUid ve queue verisi korunuyor mu).
- [ ] 193C `trip_action_queue` state machine'i uygula (`pending -> in_flight -> failed_permanent`) ve 3 deneme sonrasi auto-replay'i kes.
- [ ] 194 Queue repository yaz (exponential backoff + dead-letter davranisi).
- [ ] 195 Idempotency key helper yaz.
- [ ] 196 Date/time validator yaz (`HH:mm`, `YYYY-MM-DD`).
- [ ] 196A Timezone kontratini sabitle: `scheduledTime` her zaman `Europe/Istanbul` timezone'unda yorumlanir; timestamp'ler UTC saklanir.
- [ ] 197 Srv code validator yaz (`^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$`).
- [ ] 197A SRV kod algoritmasini dokumante et: `nanoid(6, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789')`, collision retry max `5`.
- [ ] 198 Phone masking helper yaz.
- [ ] 199 PII filter helper yaz.
- [ ] 200 Unit test: mapper coverage >= %80.
- [ ] 201 Unit test: validator seti.
- [ ] 202 Unit test: queue isleyisi (network kopmasi, app kill, duplicate replay, idempotency korunumu, stale replay live-skip).
- [ ] 202A Unit test: anonymous `linkWithCredential` sonrasi Drift owner transfer veri kaybi olmadan calisiyor mu?
- [ ] 203 DOGRULAMA: tum unit testler green mi?
- [ ] 204 Riverpod providerlarini domain use-case'lere bagla.
- [ ] 204A `transferLocalOwnershipAfterAccountLink` use-case'ini yaz (guest -> passenger gechisinde ownerId devri).
- [ ] 205 Error propagation kurali uygula.
- [ ] 206 Retry policy helper yaz (max 3 deneme + jitter backoff).
- [ ] 207 Offline-first read stratejisi uygula.
- [ ] 207A Queue boyut limiti uygula (`MAX_QUEUE_SIZE`) ve limit asiminda kullaniciya net mesaj goster.
- [ ] 207B Ownership transfer transaction'ini atomik yap (yarim migration durumunda rollback + retry).
- [ ] 207C Ownership migration icin `migration_lock` + `migration_version` alanlarini ekle; app acilisinda yarim kalan migration'i otomatik tamamla.
- [ ] 207D Drift owner transferini tek SQLite transaction blogunda yap (commit yoksa hicbir ownerUid degismesin).
- [ ] 208 Cache invalidation kurali yaz.
- [ ] 209 Logger ile PII redaction dogrula.
- [ ] 210 DOGRULAMA: debug loglarda PII sizmiyor mu?
- [ ] 211 `api_contracts.md` ile data katmani uyum kontrolu yap.
- [ ] 212 Tip guvenligi analizini calistir.
- [ ] 213 Dead code taramasi yap.
- [ ] 214 Use-case klasorlerini sadeleştir.
- [ ] 215 Performance baseline olcumu al.
- [ ] 216 Memory leak taramasi yap.
- [ ] 217 DOGRULAMA: test + analyze + build temiz mi?
- [ ] 217A KULLANICIDAN ONAY ISTE: "Misafir -> Kayitli gecisinde lokal veriler eksiksiz tasindi mi?".
- [ ] 218 KULLANICIDAN ONAY ISTE: "Domain/Data katmani onayi".
- [ ] 219 Onay yoksa bug listesi ac.
- [ ] 220 Faz E kapanis raporu yaz.

## FAZ F - Cloud Functions ve Yetki Mantigi (221-300)

- [ ] 221 Functions monorepo klasorunu olustur.
- [ ] 222 TypeScript strict mode ac.
- [ ] 223 ESLint + Prettier kur.
- [ ] 224 Ortak response wrapper yaz (`requestId`, `serverTime`).
- [ ] 225 Auth middleware yaz.
- [ ] 226 Non-anonymous middleware yaz.
- [ ] 227 Role middleware yaz.
- [ ] 228 Driver profile middleware yaz.
- [ ] 229 Input validation middleware yaz (zod veya benzeri).
- [ ] 230 Rate limit middleware yaz.
- [ ] 231 `bootstrapUserProfile` callable yaz.
- [ ] 232 `updateUserProfile` callable yaz.
- [ ] 233 `upsertConsent` callable yaz.
- [ ] 234 `upsertDriverProfile` callable yaz.
- [ ] 235 `createRoute` callable yaz.
- [ ] 235A `createRoute` icinde SRV kodunu server-side uret: `nanoid(6,'ABCDEFGHJKLMNPQRSTUVWXYZ23456789')` + collision retry (max 5) + deterministic hata kodu.
- [ ] 236 `updateRoute` callable yaz.
- [ ] 236A `createRouteFromGhostDrive` callable yaz (trace -> route + stop candidate donusumu).
- [ ] 236B Ghost trace sanitize kurali yaz (min point, max point, duplicate point drop, distance threshold).
- [ ] 236C Ghost trace polyline'i Douglas-Peucker ile sadeleştir (epsilon politikasi + max point limiti + Firestore boyut guard).
- [ ] 236D Ghost trace post-process icin Map Matching adimini ekle (DP sonrasi snapped geometri; hata olursa DP fallback).
- [ ] 236E Map Matching maliyet guard'i bagla (remote config ac/kapa + aylik request hard cap + timeout fallback).
- [ ] 237 `upsertStop` callable yaz.
- [ ] 238 `deleteStop` callable yaz.
- [ ] 239 `joinRouteBySrvCode` callable yaz.
- [ ] 240 `leaveRoute` callable yaz.
- [ ] 240A `registerDevice` callable yaz (`activeDeviceToken`, `deviceId`, `lastSeenAt`).
- [ ] 240B Multi-device politikasini netlestir: varsayilan `single-active-device`; yeni cihaz login'de eski cihaz revoke + bilgilendirme.
- [ ] 240C `finishTrip` cihaz kurali ekle: varsayilan sadece `startedByDeviceId`; acil override varsa server audit log ile izin ver.
- [ ] 241 `updatePassengerSettings` callable yaz.
- [ ] 242 `submitSkipToday` callable yaz.
- [ ] 243 `createGuestSession` callable yaz.
- [ ] 244 `startTrip` callable yaz.
- [ ] 244A `startTrip` icin istemci tarafi 10 sn `undo window` kontratini dokumante et (server cagrisi gecikmeli tetik).
- [ ] 244B `startTrip` transaction'ina optimistic lock ekle: `expectedTransitionVersion == currentTransitionVersion` saglanmadan state gecisi yapma.
- [ ] 245 `finishTrip` callable yaz.
- [ ] 245A `finishTrip` transaction'ina optimistic lock ekle: version mismatch'te `FAILED_PRECONDITION` don.
- [ ] 246 `sendDriverAnnouncement` callable yaz.
- [ ] 246A `startTrip` bildirim akisina 15 dk cooldown ekle (`trip_started` firtinasini engelle).
- [ ] 246B `getSubscriptionState` callable yaz; subscription kaynagi server-authoritative (client local override yok).
- [ ] 246C Premium aksiyonlar icin server-side entitlement guard ekle (`subscriptionStatus`/trial kontrolu function tarafinda).
- [ ] 247 `syncPassengerCount` trigger yaz.
- [ ] 248 `syncRouteMembership` trigger yaz.
- [ ] 249 `syncTripHeartbeatFromLocation` RTDB trigger yaz.
- [ ] 249A Location ingestion ayrimini yaz: stale replay konumlarini `location_history`'ye kaydet, canli RTDB marker'ini bozma.
- [ ] 249B RTDB live write tazelik kuralini uygula: `timestamp >= now-30000` disindaki nokta live path'e kabul edilmez.
- [ ] 250 `abandonedTripGuard` schedule function yaz (event-driven stale sinyal varsa once onu kullan, schedule fallback).
- [ ] 250A `abandonedTripGuard` sorgu/index kontratini yaz ve emulator query-plan kanitini ekle.
- [ ] 251 `morningReminderDispatcher` schedule function yaz.
- [ ] 251A Timezone kararini enforce et: `scheduledTime` karsilastirmasi `Europe/Istanbul`; UTC sapmasi icin test yaz.
- [ ] 251B Reminder algoritmasini sabitle: `target = scheduledTime - 5 dk`, gonderim penceresi `[target,target+1dk)`, dedupe key=`routeId+dateKey+reminderType`.
- [ ] 252 `cleanupStaleData` schedule function yaz.
- [ ] 252A `cleanupRouteWriters` schedule function yaz (trip bitiminden sonra stale writer temizligi).
- [ ] 252B `finishTrip` transaction'inda writer revoke zorunlulugunu uygula.
- [ ] 252C `support_reports` retention cleanup kuralini ekle (30 gunu asan raporlar silinsin/anonimlestirilsin).
- [ ] 253 Transaction helper katmani yaz.
- [ ] 254 Idempotency repository yaz.
- [ ] 255 Duplicate push engelleme mekanizmasi yaz.
- [ ] 256 Driver snapshot phone mask kurali uygula.
- [ ] 257 `memberIds` turetimini function tarafina tasi.
- [ ] 258 Guest session TTL enforcement mekanizmasi yaz.
- [ ] 259 `skip_requests` tek-gun tek-kayit kurali uygula.
- [ ] 259A `skip_requests` gun degisimi kuralini netlestir: reset yazimi yok; sadece `dateKey == today` filtrelenir, eski kayitlar retention ile temizlenir.
- [ ] 260 DOGRULAMA: Function unit testleri green mi?
- [ ] 261 Emulator callable integration testleri yaz.
- [ ] 262 Auth yokken endpoint red testleri yaz.
- [ ] 263 Anonymous endpoint red testleri yaz (except guest session).
- [ ] 264 Role mismatch red testleri yaz.
- [ ] 265 Invalid payload red testleri yaz.
- [ ] 266 Idempotency tekrar cagrisi testleri yaz.
- [ ] 267 Concurrency race testleri yaz.
- [ ] 268 RTDB heartbeat -> Firestore `lastLocationAt` testi yaz.
- [ ] 268A `routeWriters` revoke/race testlerini yaz (trip biter bitmez write deny).
- [ ] 268B Offline replay stale filtre testini yaz (`>60 sn` replay canli marker'i guncellemiyor mu).
- [ ] 268C Ghost Drive map matching kalite testini yaz (urban canyon trace -> snapped rota stabil mi, fallbackte veri kaybi yok mu).
- [ ] 268D TransitionVersion race testini yaz (cift `startTrip`/`finishTrip` cagrilarinda tek gecerli state transition).
- [ ] 269 `abandonedTripGuard` kosul testleri yaz.
- [ ] 270 Announcement dedupe testleri yaz.
- [ ] 270A `trip_started` cooldown testini yaz (yanlislikla start/stop/start durumunda ikinci push ya bastirilir ya "tekrar hareket etti" formatina doner).
- [ ] 270B `startTrip` undo window testi yaz (ilk 10 sn iptal edilirse server'da `active trip` olusmuyor mu).
- [ ] 270C `registerDevice` policy testini yaz (eski cihaz revoke + finishTrip device kurali).
- [ ] 270D `morningReminderDispatcher` timezone testini yaz (Europe/Istanbul ve UTC offset sapmasi yok).
- [ ] 270E Subscription tamper testi yaz (client local manipule etse de premium guard server-side blokluyor mu).
- [ ] 271 DOGRULAMA: Emulator integration full green mi?
- [ ] 272 KULLANICIDAN ONAY ISTE: "Function davranislarina onay veriyor musun?".
- [ ] 273 Deploy dry-run komutu calistir.
- [ ] 274 Staging deploy yap.
- [ ] 275 Staging smoke test yap.
- [ ] 276 Prod deploy icin release note hazirla.
- [ ] 277 KULLANICIDAN ONAY ISTE: "Prod function deploy onayi".
- [ ] 278 Prod deploy yap.
- [ ] 279 Post-deploy health check yap.
- [ ] 280 Faz F kapanis raporu yaz.
- [ ] 281 Mapbox directions proxy function yaz (imzali istek + per-route rate limit + aylik hard cap).
- [ ] 281A Mapbox map-matching proxy function yaz (trace post-process + request budget + graceful fallback).
- [ ] 282 Secret manager'a Mapbox secret token koy.
- [ ] 283 KULLANICIDAN ONAY ISTE: "Mapbox secret token paylas + Directions varsayilan kapali kalsin mi?".
- [ ] 284 Token geldiginde sadece server tarafina yaz.
- [ ] 285 Token rotation + audit cron notu ekle.
- [ ] 286 DOGRULAMA: secret token client buildde yok mu?
- [ ] 287 WhatsApp share URL generator function yaz (WhatsApp yoksa sistem share sheet fallback).
- [ ] 287A `https://nerede.servis/r/{srvCode}` landing page kontratini yaz: app yüklü degilse mini route karti + store CTA; app yüklüyse deep link.
- [ ] 288 Dynamic route preview endpoint yaz (signed token + rate limit, opsiyonel degil).
- [ ] 289 Abuse prevention icin join deneme limiti koy.
- [ ] 290 Audit log eventlerini yaz.
- [ ] 291 KVKK delete flow function yaz (`deleteUserData`).
- [ ] 291A `deleteUserData` icin off-boarding interceptor ekle: aktif abonelik varsa silme oncesi `Manage Subscription` zorunlu yonlendirme.
- [ ] 291B Interceptor metnini policy uyumlu yaz: `Hesabi silmek odemeyi durdurmaz, once store aboneligini iptal et`.
- [ ] 292 Delete flow dry-run test yap.
- [ ] 292A DOGRULAMA: aktif abonelikte interceptor calisiyor, abonelik yoksa delete akisi normal devam ediyor mu?
- [ ] 293 Retention cleanup fonksiyonunu verify et.
- [ ] 294 DOGRULAMA: KVKK test seti green mi?
- [ ] 295 Error catalog dosyasini guncelle.
- [ ] 296 Function telemetry dashboard notlarini ekle.
- [ ] 297 Alert esiklerini tanimla.
- [ ] 298 Incident runbook dosyasini olustur.
- [ ] 299 Staging replay testini tekrar calistir.
- [ ] 300 Faz F final kapanis raporu yaz.

## FAZ G - Mobil Ozellik Entegrasyonu (301-380)

- [ ] 301 Auth akisini bagla (email/google/anonymous).
- [ ] 302 `bootstrapUserProfile` + `registerDevice` cagrilarini bagla.
- [ ] 303 `updateUserProfile` ekranini bagla.
- [ ] 304 `upsertConsent` ekran akisini bagla.
- [ ] 305 Consent gate middleware yaz.
- [ ] 306 Driver profil olusturma akisini bagla.
- [ ] 307 Route create ekranini callable'a bagla.
- [ ] 307A Route create girisinde iki mod sun: `Hizli (pin)` ve `Ghost Drive (Rotayi Kaydet)`.
- [ ] 307B Ghost Drive capture akislarini bagla (`kaydi baslat`, `kaydi bitir`, `onizleme`, `kaydet`).
- [ ] 307C Ghost Drive kayit sonunda otomatik baslangic/bitis + durak adayi onerilerini goster; kullanicidan tek ekranda onay al.
- [ ] 307D KULLANICIDAN ONAY ISTE: "Ghost Drive varsayilan rota olusturma akisi olarak uygun mu?".
- [ ] 308 Route update ekranini callable'a bagla.
- [ ] 309 Stop CRUD ekranlarini callable'a bagla.
- [ ] 310 SRV katilim ekranini callable'a bagla.
- [ ] 311 `leaveRoute` aksiyonunu bagla.
- [ ] 312 Passenger ayarlarini callable'a bagla.
- [ ] 312A Yolcu katilim/ayar ekranina `Sanal Durak` secimini ekle (haritadan nokta sec veya mevcut `boardingArea` metniyle devam).
- [ ] 312B ETA kaynagini kisisellestir: varsa `Sanal Durak`, yoksa `boardingArea`/route baslangici.
- [ ] 312C KULLANICIDAN ONAY ISTE: "Sanal Durak secimi katilimda zorunlu mu, opsiyonel mi?".
- [ ] 313 `submitSkipToday` aksiyonunu bagla.
- [ ] 314 Guest session olusturma akisini bagla.
- [ ] 315 Guest session expiry handling yaz.
- [ ] 316 Driver start trip aksiyonunu bagla.
- [ ] 316A `Seferi Baslat` aksiyonunda 10 sn yerel bekleme penceresi ekle (`undo` butonu gorunur, server cagrisi gecikmeli).
- [ ] 316B 10 sn dolmadan `Iptal` secilirse start istegini tamamen dusur, push ve trip olusmasin.
- [ ] 316C 10 sn sonunda otomatik commit et ve `startTrip` callable cagir.
- [ ] 317 Driver finish trip aksiyonunu bagla.
- [ ] 317A `Seferi Bitir` aksiyonunu guvenli hale getir (`slide-to-finish` veya `uzun bas`, tek tap yok).
- [ ] 317B `Seferi Bitir` guvenli aksiyonu icin haptic+gorsel geri bildirim ekle; 3 sn icinde geri alma yoksa finalize et.
- [ ] 317C KULLANICIDAN ONAY ISTE: "`Seferi Bitir` icin secilen guvenli etkileşim (slide/uzun bas) kabul mu?".
- [ ] 318 Announcement gonderme akisini bagla.
- [ ] 319 WhatsApp share intent bagla (WhatsApp/WhatsApp Business dene; app yoksa sistem share sheet fallback + hata mesaji).
- [ ] 319A Paylasim linki tiklaninca davranisi netlestir: app yüklü degilse landing page mini takip karti + store; yüklüyse deep link ile route preview.
- [ ] 320 RTDB location stream dinlemeyi bagla.
- [ ] 321 Location publish service yaz.
- [ ] 321A Replay edilen konum kaydi `now - sampledAt > 60 sn` ise canli RTDB path'ine yazma; sadece history path'ine yaz.
- [ ] 321B Canli marker akisi icin Kalman smoothing katmanini ekle (ham GPS + filtrelenmis marker ayrimi).
- [ ] 322 Background service Android yapisini bagla.
- [ ] 322A AndroidManifest'te servis tipini zorunlu tanimla: `foregroundServiceType=\"location\"`.
- [ ] 322B Android izin setini dogrula: `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION`, `WAKE_LOCK` (gereksiz izin yok).
- [ ] 322C FGS bildirim metnini policy uyumlu sabitle: `NeredeServis konumunuzu paylasiyor (aktif sefer)`.
- [ ] 322D Role-based permission gate uygula: konum izni sadece sofor akışında istenir; yolcu/guest rolde konum izni dialogu hic acilmaz.
- [ ] 322E Bildirim izni orkestrasyonunu uygula: onboarding'de toplu isteme yok, deger aninda isteme (yolcu katilim/sofor duyuru tetigi).
- [ ] 322F Bildirim izni red fallback'ini uygula: push kapaliyken in-app banner + `Ayarlar'dan Ac` CTA + 24 saat cooldown.
- [ ] 323 iOS background location ayarlarini bagla.
- [ ] 323A `while-in-use` konum iznini sadece `Seferi Baslat` veya `Ghost Drive kaydi baslat` aninda iste.
- [ ] 323B `background/always` iznini sadece `while-in-use` verildikten sonra, aktif sefer commit adiminda iste.
- [ ] 323C `while-in-use` red durumunda aktif seferi hard-block et; sofore neden/aksiyon metni goster (`Canli takip icin konum izni gerekli`).
- [ ] 323D `background/always` red durumunda foreground-only moda gec; sofora stale riski ve `Ayarlar'dan Ac` CTA goster.
- [ ] 323E iOS silent-kill mitigasyonunu bagla: Activity Recognition sinyali + BGTask watchdog ile askidan donus toparlanmasi.
- [ ] 324 OEM battery optimization yonlendirmesini bagla.
- [ ] 324D Pil optimizasyonu istisnasi ekranini sadece ihtiyac aninda ac (ilk aktif seferden sonra veya OEM kill sinyali alindiginda).
- [ ] 324E Pil optimizasyonu red durumunda degrade izleme modunu aktif et (arka planda kesinti riski metni + heartbeat uyari seviyesini yukselt).
- [ ] 324A NS-391: Sofor aktif sefer ekranina "Connection Heartbeat" ekle (`YAYINDASIN` + pulse halka).
- [ ] 324AA Sofor aktif sefer ekranina sade harita ekle (rota cizgisi + arac marker + siradaki durak markeri).
- [ ] 324AB Driver Guidance Lite bilgisi bagla: `Siradaki Durak: {stopName}` + `Kus ucusu {distanceM} m`.
- [ ] 324B Heartbeat durumlari: green=`canli`, yellow=`baglanti dalgali`, red=`yayin durdu`.
- [ ] 324BA Red state icin periferik alarm ekle: ekran cercevesi kirmizi flash + tekrarlayan ayri haptic pattern.
- [ ] 324BB Red state'ten yellow/green'e donuste tek-shot "iyilesme" haptic + metin goster.
- [ ] 324BF Heartbeat durum degisimlerinde sesli geri bildirim ekle (`Baglanti kesildi`, `Baglandim`, `Sefer sonlandirildi`).
- [ ] 324BG Sesli geri bildirim icin `Ayarlar > Sesli Uyari` toggle ekle (varsayilan acik).
- [ ] 324BH DOGRULAMA: ekran disi kullanimda (telefon tutucuda) red/green gecisleri sesle anlasilabiliyor mu?
- [ ] 324BC KULLANICIDAN ONAY ISTE: "Heartbeat red alarm siddeti (flash/haptic) sahada yeterli mi?".
- [ ] 324BD OLED burn-in korumasi ekle: heartbeat halkasi + `YAYINDASIN` etiketi her 60 sn'de 2-3 px micro-shift uygulasin.
- [ ] 324BE Burn-in korumasi performans testi yap (shift animasyonu jank/pil etkisi olusturuyor mu).
- [ ] 324C DOGRULAMA: Sofor aktif seferde sade harita + heartbeat ile durum takibini dikkat dagitmadan yapabiliyor mu?
- [ ] 325 Drift location queue flush mekanizmasini bagla (bounded queue + retry limit + stale replay live skip).
- [ ] 325A Terminated app senaryosu icin background flush stratejisini bagla (Android WorkManager + iOS Background Fetch/BGTask).
- [ ] 325B 15 dk periyodik "pending queue var mi" kontrolu yap; uygun ag bulunca sessiz flush dene.
- [ ] 325C DOGRULAMA: sofor internetsiz `finishTrip` yaptiktan sonra app kapali olsa da sonraki baglantida queue bosaliyor mu?
- [ ] 326 Drift trip action queue replay mekanizmasini bagla (idempotency key zorunlu).
- [ ] 326A 3 deneme sonrasi "manuel mudahale gerekir" UI akisina dusur.
- [ ] 326B NS-392: Optimistic UI ve sync state'i ayir (`local_done`, `pending_sync`, `synced`, `failed`).
- [ ] 326C `finishTrip` pending iken "Buluta yaziliyor..." indikatoru goster.
- [ ] 326D App kapanisinda pending kritik aksiyon varsa `PopScope` ile "veriler henuz gonderilmedi" uyarisini goster.
- [ ] 327 Queue replay sirasini dogrula (trip action once).
- [ ] 328 Stale data state management bagla (4 seviye: 0-30, 31-120, 121-300, 300+ sn).
- [ ] 328A Delay inference UI bagla: `now > scheduledTime + 10 dk` ve aktif trip yoksa "Sofor henuz baslatmadi (Olasi Gecikme)" etiketi.
- [ ] 328B Delay inference kartinda fallback CTA goster: `Bildirim Acik Kalsin` + `Servislerim'e Don`.
- [ ] 328C KULLANICIDAN ONAY ISTE: "Olasi gecikme esigi 10 dk kalsin mi?".
- [ ] 329 Mapbox map widget entegrasyonunu bagla.
- [ ] 329A Driver aktif sefer map modunu bagla (gesture kisitli, dikkat dagitici UI yok).
- [ ] 329B Mapbox style/tile cache stratejisini agresif yap: `OfflineManager` + `TileStore`, style pack preload, sik kullanilan rota cevresi tile cache + cache size limit.
- [ ] 329C DOGRULAMA: cache aktifken tekrar acilista map load suresi ve network cagrisi azaliyor mu?
- [ ] 330 Mapbox Directions ETA servis entegrasyonunu bagla (remote config kill-switch ile varsayilan kapali).
- [ ] 330A Ghost Drive polyline tolerance kuralini bagla: aracin polyline'a mesafesi `>500m` ise `off_route_eta` moduna gec.
- [ ] 330B `off_route_eta` modunda zorla snap yapma; marker ham GPS konumunu gostersin.
- [ ] 330C `off_route_eta` durum etiketini yolcu bottom-sheet'te goster (`Alternatif guzergah`).
- [ ] 331 ETA fallback (`crowFly * 1.3`) varsayilan kaynak olarak bagla.
- [ ] 332 `lastEtaSource` UI bagla.
- [ ] 333 Rate cap (`1 request/20s/route`) + aylik hard cap + quota-asim fallback bagla.
- [ ] 334 DOGRULAMA: ETA servis hatasinda veya kota asiminda fallback calisiyor mu?
- [ ] 334D DOGRULAMA: `off_route_eta` modunda marker snap'siz ve ETA yeniden hesaplanmis gorunuyor mu?
- [ ] 334F DOGRULAMA: Ghost Drive route geometri kalitesi map matching ile temiz (zigzag azaltilmis) gorunuyor mu?
- [ ] 334G DOGRULAMA: Kalman smoothing aktifken marker titremesi azalirken gecikme kabul edilebilir seviyede mi?
- [ ] 334A NS-390: iOS Live Activities entegrasyonunu bagla (Lock Screen + Dynamic Island, destekli modellerde).
- [ ] 334B Android 14+ icin Live Updates API stratejisini uygula (uygun cihaz/surumlerde).
- [ ] 334BA Live Updates desteklenmeyen cihazlarda promoted ongoing notification fallback'ini bagla.
- [ ] 334BB Android canli bildirim tipini policy uyumlu sec: route-sharing use-case icin uygun API + FGS bildirim metni.
- [ ] 334C DOGRULAMA: Yolcu uygulamayi acmadan "kac dk kaldi" bilgisini kilit ekranindan gorebiliyor mu?
- [ ] 334E DOGRULAMA: Android 14/15 cihazlarda Live Updates yolu, eski cihazlarda fallback yolu calisiyor mu?
- [ ] 335 Push token register akisini bagla.
- [ ] 336 Topic/target bildirim baglantilarini yap.
- [ ] 337 Morning reminder handling bagla.
- [ ] 338 Announcement push rendering bagla.
- [ ] 339 Vacation mode UI handling bagla.
- [ ] 340 Driver snapshot UI handling bagla.
- [ ] 340A `Bugun Binmiyorum` yolcularini sofor listesinin altina indir + satir ustu cizili (`strikethrough`) goster.
- [ ] 340B Gun degisiminde siralama/strikethrough otomatik sifirlanmasini server time (`Europe/Istanbul`) bazli `dateKey` filtresiyle bagla.
- [ ] 341 Phone visibility toggle UI bagla.
- [ ] 342 Masking policy UI bagla.
- [ ] 343 DOGRULAMA: phone gizliyken UI'da hic gorunmuyor mu?
- [ ] 344 Crash-safe retry UI akisini yaz.
- [ ] 344A `Sorun Bildir` aksiyonunu ekle (otomatik tanilama paketi + kullanici notu).
- [ ] 344B Opsiyonel `Shake to Report` kisayolunu ekle (yanlis tetiklemeye karsi debounce + confirm modal).
- [ ] 344C Rapor paketine son 5 dk log ozeti + izin durumu + baglanti tipi + pil seviyesi + queue metriklerini ekle.
- [ ] 344D Rapor kanalini bagla (support e-posta veya Slack webhook); PII redaction zorunlu.
- [ ] 345 Offline banner UI bagla.
- [ ] 346 Reconnect handling yaz.
- [ ] 347 Latency indicator UI bagla.
- [ ] 348 Map stale renkleri bagla (yesil/sari/turuncu/kirmizi - 4 seviye).
- [ ] 348A Soft-lock durumunda yolcu stale bandina ek metin koy: `Servis Baglantisi: Dusuk Oncelik Modu`.
- [ ] 349 Empty state UI metinlerini finalize et.
- [ ] 350 Form validation mesajlarini finalize et.
- [ ] 351 Localization anahtarlarini olustur (TR odakli).
- [ ] 351A UTF-8 validation testi ekle (TR karakterleri: `ı, ş, ğ, ü, ö, ç` bozulmadan render/l10n dosyalarinda duruyor mu).
- [ ] 352 Kullanici dostu hata metinlerini yaz.
- [ ] 352A Sofor icin odeme/abonelik entry pointlerini bagla: `Ayarlar > Abonelik`, `Deneme bitince banner`, `premium aksiyon aninda paywall`.
- [ ] 352AA V1.0 monetization kilidi: gercek RevenueCat SDK purchase akisini acma; `getSubscriptionState` mock/read-only cevaplariyla UI ve soft-lock davranisini test et.
- [ ] 352B Paywall buton etiketlerini platforma gore ayir: iOS=`Restore Purchases`, Android=`Satin Alimlari Geri Yukle`; her iki platformda `Manage Subscription`.
- [ ] 352C Paywall'da varsayilan store billing akisini kullan; bolgesel istisna varsa feature flag + hukuk onayi ile ac.
- [ ] 352D `NeredeServis_Paywall_Copy_TR.md` metinlerini l10n anahtarlarina tasi ve QA kontrol et.
- [ ] 352E `Hesabimi Sil` erisimini Ayarlar icinde derine gommeden konumlandir (max 2 seviye).
- [ ] 352F V1.0 monetization kararini kilitle: RevenueCat production entegrasyonu kapali; V1.0'da mock/read-only subscription state kullan.
- [ ] 352G Onboarding gercek video varligini bagla (yerel bundle once; remote kaynak opsiyonel ve kapali baslangic).
- [ ] 352H Video teknik kilidini uygula: mobil uyumlu codec/profil + boyut limiti + fallback poster zorunlu.
- [ ] 352I DOGRULAMA: iPhone 11 + Samsung A24'te onboarding video decode/pil/jank testi green mi?
- [ ] 352J KULLANICIDAN ONAY ISTE: "Onboarding video final gorunum/performance onayi veriyor musun?".
- [ ] 353 DOGRULAMA: tum ana akislar E2E smoke geciyor mu?
- [ ] 353A DOGRULAMA: `Sorun Bildir` raporu support kanalina dusuyor mu, PII sizmiyor mu?
- [ ] 354 KULLANICIDAN ONAY ISTE: "Mobil ozellik akislari beklendigi gibi mi?".
- [ ] 355 Onay yoksa kritik bug listesi ac.
- [ ] 356 Onay varsa release candidate etiketi olustur.
- [ ] 357 Perf monitor eventlerini bagla.
- [ ] 357A Sentry breadcrumb eventlerini bagla (trip start/finish, join/leave, share, permission red).
- [ ] 358 Analytics event semasini finalize et.
- [ ] 358A V1.0 Play release profilinde analytics amacli veri toplama kapali olsun; Data Safety `App functionality` beyaniyla celisme olmasin.
- [ ] 359 PII'siz event garantisi ver.
- [ ] 360 DOGRULAMA: event payload PII icermiyor mu?
- [ ] 361 App startup sure olcumu al.
- [ ] 362 Map render sure olcumu al.
- [ ] 363 Route list load sure olcumu al.
- [ ] 364 Background publish interval olcumu al.
- [ ] 365 Batarya tuketim olcumu al.
- [ ] 366 Network failover testi yap.
- [ ] 367 Low-end cihaz testi yap.
- [ ] 368 iOS permissions testi yap.
- [ ] 369 Android permissions testi yap.
- [ ] 369A DOGRULAMA: Yolcu/guest roluyle konum izni dialogu hic acilmiyor mu?
- [ ] 369B DOGRULAMA: Sofor rolunde incremental izin akisi dogru mu? (`while-in-use` -> aktif seferde `background`).
- [ ] 369C DOGRULAMA: Bildirim izni reddedilince push yerine in-app fallback calisiyor mu, kullaniciya net CTA gosteriliyor mu?
- [ ] 369D DOGRULAMA: `while-in-use` red durumunda sofor `Seferi Baslat` aksiyonunda hard-block ve acik neden metni goruyor mu?
- [ ] 369E DOGRULAMA: `background/always` red durumunda foreground-only moda gecis + stale risk uyarisi dogru mu?
- [ ] 369F DOGRULAMA: Pil optimizasyonu istisnasi reddinde degrade mod + heartbeat uyarisi + settings yonlendirmesi gorunur mu?
- [ ] 370 DOGRULAMA: kritik performans hedefleri saglandi mi?
- [ ] 371 UI regression screenshot setini al.
- [ ] 372 Golden testleri guncelle.
- [ ] 373 Tanimli acceptance testleri tekrar kos.
- [ ] 373A UTF-8 acceptance testi kos (store listing + uygulama ic metinlerde TR karakter bozulmasi yok).
- [ ] 374 Hata raporlarini siniflandir (P0/P1/P2).
- [ ] 375 P0 hatalari kapat.
- [ ] 376 P1 hatalari planla.
- [ ] 377 RC2 build al.
- [ ] 378 KULLANICIDAN ONAY ISTE: "RC2 onayi (evet/hayir)".
- [ ] 379 Onay varsa Faz G kapat.
- [ ] 380 Faz G kapanis raporu yaz.

## FAZ H - Store, Release, Operasyon (381-460)

- [ ] 381 Android signing yapisini kontrol et.
- [ ] 382 iOS signing yapisini kontrol et.
- [ ] 383 KULLANICIDAN ONAY ISTE: "Signing dosyalari hazir mi?".
- [ ] 384 Play Console app olustur.
- [ ] 385 App Store Connect app olustur.
- [ ] 386 Privacy manifestleri doldur.
- [ ] 386A App Store icin "Always Location" gerekcesini urun akisina gore yaz.
- [ ] 386AA Apple review notuna "Driver Guidance Lite (siradaki durak + mesafe + harita)" gerekcesini ekle.
- [ ] 386B Apple review icin background location kanit videosu/screenshot paketi hazirla.
- [ ] 386C Apple metadata/review notu terminoloji kilidini uygula: `tracking` yerine `Route Coordination` / `Trip Sharing`.
- [ ] 387 Data safety formlarini doldur.
- [ ] 387A Google Play background location declaration formunu doldur.
- [ ] 387AA Play formu metnini birebir kontrol et: `sadece sofor`, `aktif sefer`, `sefer bitince durur`, `yolcu konumu alinmaz`.
- [ ] 387AB Data Safety formunu muhafazakar doldur: Location=evet (driver), Personal Info=evet, Auth Info=evet, Third-party sharing=hayir, delete request=evet.
- [ ] 387AC Data Safety'de guest akisini acikla: `guest location toplanmaz`, `driver location gorur`, `TTL ile guest session silinir`.
- [ ] 387AD Data Safety purpose alaninda `App functionality` disinda gereksiz secim isaretleme (analytics/ads yok).
- [ ] 387B App Store IAP urunlarini olustur (`monthly`, `yearly`, trial policy) ve screenshot/dil metinlerini tamamla.
- [ ] 387C Google Play subscription urunlarini olustur (base plan + trial + ulke bazli fiyat).
- [ ] 387D RevenueCat entitlement haritasini dogrula (store product <-> entitlement birebir).
- [ ] 387E Play kategori secimini `Travel & Local` olarak kilitle (gerekce notu ile).
- [ ] 387F Google Play Billing Library `6.x` uyumunu release checklist'inde kanitla (kullanilan plugin/surum + test kaniti).
- [ ] 387G App Store Connect'te subscription grace period'u ac ve trial/yenileme senaryosunu test et.
- [ ] 388 KVKK/policy URL'lerini metadata'ya gir.
- [ ] 388A Privacy Policy'de su ifadeyi zorunlu yap: `Konum verisi sadece aktif seferde soforden alinir; yolcu/guest konumu toplanmaz; veriler ucuncu taraf reklam aglariyla paylasilmaz`.
- [ ] 388B Store review oncesi hesap silme yolu kolay erisilebilir mi kontrol et (Apple guideline 5.1.1(v) risk gate).
- [ ] 388C Share link landing metadata'sini dogrula: Open Graph (`og:title`, `og:description`, `og:image`) dogru render oluyor mu.
- [ ] 388D Deep-link dogrulama dosyalarini deploy et ve test et: `apple-app-site-association` + `assetlinks.json`.
- [ ] 389 App ikon/splash varliklarini sonlandir.
- [ ] 390 Store screenshot setini amber UI ile olustur.
- [ ] 390A Onboarding video/pilot poster varliklarini release paketi icin sabitle (ilk frame + fallback frame + telif kontrolu).
- [ ] 391 Short/long description metinlerini yaz.
- [ ] 391A Kisa aciklama policy kilidi: `personel servis canli takip` degeri net gecsin; yolcu konumu alinmadigi vurgusu yer alsin.
- [ ] 391B Uzun aciklama policy kilidi: `konum paylasimi sadece aktif seferde soforden`, `sefer bitince durur`, `yolcu konumu alinmaz`, `veri ucuncu tarafla paylasilmaz`.
- [ ] 391C App Store listing/review metninde `kisi takibi` dili kullanma; `guzergah koordinasyonu` ve `bekleme suresi optimizasyonu` vurgula.
- [ ] 392 Anahtar kelime setini yaz.
- [ ] 393 Destek email ve web url gir (varsayilan: `infonetoapp@gmail.com`).
- [ ] 394 Version code/build number artis stratejisi yaz.
- [ ] 394A Fastlane setup yap (`beta_android`, `beta_ios`, `release_android`, `release_ios`).
- [ ] 395 Internal test track'e Android yukle.
- [ ] 395A Play kapali test surecini tamamla (minimum testci ve sure sartlarini karsila; release gate'e kanit ekle).
- [ ] 396 TestFlight build yukle.
- [ ] 397 Smoke test checklist'i testcilere gonder.
- [ ] 398 Test geri bildirimlerini topla.
- [ ] 399 P0/P1 issue triage yap.
- [ ] 400 Hotfix gerekiyorsa RC3 cikart.
- [ ] 401 DOGRULAMA: internal test raporu tamamlandi mi?
- [ ] 401A DOGRULAMA: Apple/Google location policy checklist tamamen gecti mi?
- [ ] 401B DOGRULAMA: trial bitisinde paywall dogru anda aciliyor, restore/manage calisiyor, billing akisi policy'ye uygun.
- [ ] 401F DOGRULAMA: V1.0 release profilinde gercek purchase API cagrisi yok; mock/read-only subscription akisi disina cikilmiyor.
- [ ] 401C DOGRULAMA: hesap silme oncesi aktif abonelik interceptor'u zorunlu manage yonlendirmesi veriyor mu?
- [ ] 401D DOGRULAMA: Play listing + Data Safety + uygulama izin davranisi birbiriyle celismiyor mu?
- [ ] 401E DOGRULAMA: Apple review notlari `tracking` dili yerine `Route Coordination/Trip Sharing` terminolojisiyle uyumlu mu?
- [ ] 401G DOGRULAMA: onboarding video aktifken acilis suresi, crash orani ve auth basarisina negatif etki yok mu?
- [ ] 402 Staged rollout plani yaz (%5 -> %20 -> %100).
- [ ] 403 Rollback planini dokumante et.
- [ ] 404 Remote config kill-switchleri aktif et.
- [ ] 404A `docs/feature_flags.md` ile key isimlerini birebir esitle (`tracking_enabled`, `announcement_enabled`, `guest_tracking_enabled`, `force_update_min_version`, `directions_enabled`, `map_matching_enabled`).
- [ ] 404B Her flag icin tip/varsayilan/scope (dev-stg-prod) tablosunu release notuna ekle.
- [ ] 405 Alert kurallari ac (crash, stale, auth).
- [ ] 406 On-call sorumluluklarini yaz.
- [ ] 407 Incident response SLA yaz.
- [ ] 408 Runbook linklerini operasyon paneline ekle.
- [ ] 409 Grafana/Cloud dashboard bagla (varsa).
- [ ] 410 Haftalik maliyet raporu otomasyonu kur (MAU, Directions + Map Matching request sayisi, hard cap kullanimi).
- [ ] 411 KULLANICIDAN ONAY ISTE: "Production release tarihi".
- [ ] 412 Release adayini freeze et.
- [ ] 413 Prod deploy dry-run yap.
- [ ] 414 Prod deploy gercekles tir.
- [ ] 415 %5 rollout baslat.
- [ ] 416 24 saat metrik izle.
- [ ] 417 Esik bozulursa rollout durdur.
- [ ] 418 Sorun yoksa %20 rollout'a gec.
- [ ] 419 24 saat metrik izle.
- [ ] 420 Sorun yoksa %100 rollout'a gec.
- [ ] 421 DOGRULAMA: rollout tamamlandi mi?
- [ ] 422 Post-release smoke test yap.
- [ ] 423 Crash-free metriklerini kontrol et.
- [ ] 424 Konum stale metrigini kontrol et.
- [ ] 425 Push basari oranini kontrol et.
- [ ] 426 ETA hata oranini kontrol et.
- [ ] 427 Support ticket trendini kontrol et.
- [ ] 428 Kritik issue var mi kontrol et.
- [ ] 429 Gerekirse hotfix dalini ac.
- [ ] 430 Patch release yap.
- [ ] 431 Patch notlarini yayinla.
- [ ] 432 Maliyet/performans haftalik raporunu guncelle.
- [ ] 433 Bakim backlog'unu olustur.
- [ ] 434 V1.1 scope planini cikar.
- [ ] 434A V1.1 viral buyume paketi: iOS App Clip POC (QR -> mini native takip karti) planini cikar.
- [ ] 434B V1.1 viral buyume paketi: Android Instant App feasibility + teknik kisit notlarini cikar.
- [ ] 434C App Clip/Instant icin olcum plani yaz (`QR scan -> mini experience -> full install conversion`).
- [ ] 435 RevenueCat trial bitis davranisini V1.1 release adiminda uygula (`read-only mode`, soft-block, veri kaybi yok).
- [ ] 435A V1.0 icin payment mock/simulate akisiyla trial day 15 senaryosunu test et.
- [ ] 436 Sirket paneli V1.2 altyapi notlarini not et.
- [ ] 437 Teknik borc listesi guncelle.
- [ ] 438 Dokuman stale kontrolu yap.
- [ ] 439 API kontrat stale kontrolu yap.
- [ ] 440 UI spec stale kontrolu yap.
- [ ] 441 Security gate stale kontrolu yap.
- [ ] 442 Son test raporunu arsivle.
- [ ] 443 Son build artifactlerini arsivle.
- [ ] 444 Release checklist'ini imzala.
- [ ] 445 KULLANICIDAN ONAY ISTE: "Release tamam kabul ediyor musun?".
- [ ] 446 Onayla birlikte runbook'u "Completed" etiketle.
- [ ] 447 Sonraki sprint icin risk toplantisi yap.
- [ ] 448 Kullanici geri bildirimlerini urun ekibine aktar.
- [ ] 449 NPS/retention olcum planini yaz.
- [ ] 450 İlk 30 gun operasyon takvimini olustur.
- [ ] 451 Week-1 incident review.
- [ ] 452 Week-2 performance review.
- [ ] 453 Week-3 cost review.
- [ ] 454 Week-4 roadmap review.
- [ ] 455 V1.0 postmortem dokumani yaz.
- [ ] 456 "Ne iyi gitti / ne gelistirilecek" listesi yaz.
- [ ] 457 Uygulama sahipligi ve sorumluluklarini final et.
- [ ] 458 Bilinen limitasyonlari dokumante et.
- [ ] 459 V1.1 giris kriterlerini yaz.
- [ ] 460 Faz H final kapanis raporu yaz.

---

## 5) Cursor'un Senden Isteyecegi Onay Noktalari (Ozet)

- O-01 Runbook kilidi onayi
- O-02 Firebase proje/bundle/package bilgileri
- O-03 SHA-256 ve APNs bilgileri
- O-04 Sentry DSN onayi
- O-05 Amber UI final onayi
- O-06 Domain/Data katmani onayi
- O-07 Functions staging/prod deploy onayi
- O-08 Mapbox secret token paylasimi
- O-09 Mobil RC onayi
- O-10 Production release tarihi/onayi
- O-11 Release kapanis onayi
- O-12 KVKK hukuki onay gate
- O-13 Directions varsayilan kapali (budget=0) onayi
- O-14 Font yukleme yontemi onayi (local asset onerilen)
- O-15 Apple/Google background location review checklist onayi
- O-16 Product ID + fiyat + deneme konfigurasyonu onayi
- O-17 Storefront bazli billing policy onayi (TR/US vb.)
- O-18 Ghost Drive varsayilan akisi + stop adayi onayi
- O-19 Delay inference esigi onayi (`scheduled + 10 dk`)
- O-20 `Seferi Bitir` guvenli etkileşim onayi (`slide` veya `uzun bas`)
- O-21 Heartbeat red alarm pattern onayi (flash + haptic)
- O-22 `Bugun Binmiyorum` liste siralama/strikethrough onayi
- O-23 Hesap silme oncesi aktif abonelik interceptor metni/onayi
- O-24 Ghost Drive polyline tolerance esigi onayi (`500m`)
- O-25 `Seferi Baslat` undo penceresi onayi (`10 sn`)
- O-26 V1.1 App Clip/Instant App kapsam onayi
- O-27 Android canli bildirim stratejisi onayi (`Live Updates API + fallback`)
- O-28 Play background location justification metni onayi
- O-29 Data Safety formu yanit seti onayi
- O-30 Play kategori secimi onayi (`Travel & Local`)
- O-31 Google Play Billing `6.x` uyum onayi
- O-32 Android FGS manifest/izin seti onayi (`foregroundServiceType=location`, `WAKE_LOCK`)
- O-33 UTF-8/TR karakter kalite gate onayi
- O-34 Hesap silme erisilebilirlik onayi (Ayarlar icinde kolay erisim)
- O-35 Platform bazli restore etiketi onayi (iOS/Android farkli)
- O-36 Izin isteme zamanlama matrisi onayi (notification + gps + battery)
- O-37 Izin red fallback metinleri/onayi (hard-block vs degrade)
- O-38 Map Matching acilis + aylik budget onayi
- O-39 Kalman smoothing parametre onayi (`processNoise=0.01`, `measurementNoise=3.0`, `updateIntervalMs=1000`)
- O-40 Sesli geri bildirim metin/pattern onayi (TTS/bip)
- O-41 Terminated queue flush stratejisi onayi (WorkManager/BGTask)
- O-42 Virtual stop varsayilan davranis onayi (zorunlu/opsiyonel)
- O-43 `Sorun Bildir / Shake to Report` veri kapsami onayi (PII redaction)
- O-44 Apple review terminoloji onayi (`Route Coordination` / `Trip Sharing`)
- O-45 Flutter lock onayi (`3.24.5`)
- O-46 Multi-device policy onayi (`single-active-device` + finishTrip cihaz kurali)
- O-47 Timezone policy onayi (`scheduledTime=Europe/Istanbul`, timestamp=UTC)
- O-48 RevenueCat V1.0 karari onayi (mock/read-only, production entegrasyon V1.1)
- O-49 Feature flag schema onayi (6 zorunlu key + varsayilanlar)

---

## 6) "Cursor Benden Ne Isteyecek?" Hazir Cevap Sablonlari

Kopyala-yapistir cevap seti:

- `Firebase proje adlari: neredeservis-dev / neredeservis-stg / neredeservis-prod`
- `Android package: com.neredeservis.app`
- `iOS bundle: com.neredeservis.app`
- `Region: europe-west3`
- `Flutter exact surum: 3.24.5`
- `Mapbox public token: <BURAYA_PUBLIC_TOKEN>`
- `Mapbox secret token: <BURAYA_SECRET_TOKEN>`
- `Sentry DSN: <BURAYA_DSN>`
- `Domain: https://nerede.servis`
- `Gizlilik politikasi URL: <BURAYA_URL>`
- `KVKK versiyon: v1.0`
- `KVKK hukuki onay: <TARIH / ONAYLAYAN>`
- `Directions varsayilan durumu: kapali (evet)`
- `Font yukleme: local asset (evet)`
- `Apple Always Location metni: <BURAYA_METIN>`
- `Google background location declaration: <BURAYA_METIN>`
- `Play background location gerekcesi (onerilen): Sofor aktif sefer baslattiginda yolcularin guvenli ve dogru takip edebilmesi icin uygulama arka planda konum paylasir. Sefer bitince takip durur.`
- `RevenueCat products: monthly=<id>, yearly=<id>, trial=<gun>`
- `Store pricing: TR monthly=<fiyat>, yearly=<fiyat>`
- `Storefront policy: <ulkeler> / alternatif billing: <acik-kapali>`
- `Ghost Drive varsayilan mi: <evet/hayir>`
- `Delay inference esigi: <dk>`
- `Seferi Bitir guard: <slide|uzun bas>`
- `Heartbeat red pattern: <haptic_kod/flash_hiz>`
- `Bugun Binmiyorum liste kurali: <alt siraya indir + ustu cizili>`
- `Delete interceptor metni: <onayli metin>`
- `Ghost Drive off-route tolerance: <metre>`
- `Start undo window: <sn>`
- `V1.1 App Clip/Instant kapsam: <evet/hayir + not>`
- `App Clip associated domain: <ornek appclips:nerede.servis>`
- `App Clip bundle id: <com.neredeservis.app.Clip>`
- `Android Instant App stratejisi: <feature-module / ertele>`
- `Android Live Update stratejisi: <LiveUpdates + fallback detayi>`
- `Play background location justification: <onayli metin>`
- `Data Safety cevap seti: <Location/PersonalInfo/Auth/Sharing/Delete>`
- `Play kategori: <Travel & Local>`
- `Data Safety (onerilen): Location=driver_only, Passenger/Guest location=no, Personal Info=yes, Auth Info=yes, Sharing=no, Delete request=yes, Purpose=App functionality`
- `Billing uyumu: <Play Billing 6.x kanitlandi / plugin surumu>`
- `Android FGS policy metni: <onayli bildirim metni>`
- `UTF-8 kalite gate: <passed/failed>`
- `Hesap silme erisimi: <Ayarlar > ... > Hesabimi Sil>`
- `Restore etiketi: <iOS=Restore Purchases, Android=Satin Alimlari Geri Yukle>`
- `Bildirim izni tetigi: <yolcu_katilim / sofor_duyuru / iki rol ayri>`
- `GPS while-in-use tetigi: <Seferi Baslat + GhostDrive>`
- `GPS background tetigi: <aktif sefer commit sonrasi>`
- `Pil optimizasyonu tetigi: <ilk aktif sefer sonrasi veya OEM kill sinyali>`
- `Izin red fallback metni: <notification/gps/battery icin onayli metinler>`
- `Map Matching: <acik/kapali + aylik max istek + fallback kurali>`
- `Kalman parametresi: <denge/agresif + process/noise degerleri>`
- `Kalman parametresi (onerilen): processNoise=0.01, measurementNoise=3.0, updateIntervalMs=1000`
- `Sesli geri bildirim: <TTS/bip + metinler>`
- `Terminated flush: <Android=WorkManager, iOS=BGTask/BackgroundFetch>`
- `Virtual stop varsayilan: <zorunlu/opsiyonel>`
- `Support report kanali: infonetoapp@gmail.com (opsiyonel Slack webhook eklenebilir)`
- `Shake-to-report: <acik/kapali>`
- `Apple review terminoloji: <Route Coordination/Trip Sharing metni>`
- `Timezone policy: scheduledTime=Europe/Istanbul, server timestamp=UTC`
- `Multi-device policy: single-active-device, finishTrip sadece startedByDeviceId (acil override audit loglu)`
- `RevenueCat V1.0 policy: mock/read-only state, production billing V1.1`
- `Feature flags: tracking_enabled=true, announcement_enabled=true, guest_tracking_enabled=true, force_update_min_version=<semver>, directions_enabled=false, map_matching_enabled=true`

---

## 7) Son Kural

- Bu runbook adimlari atlanmaz.
- "Yapilmis say" yaklasimi yok.
- Her kritik adimda kanit + dogrulama + onay gerekir.
- Onaysiz production degisikligi yapilmaz.
- Limit asimi icin coklu hesap acarak ucretsiz model suistimali yapilmaz.

