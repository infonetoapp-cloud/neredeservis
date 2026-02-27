# FAZ H Store Policy Pack (STEP-386A..387AD)

Tarih: 2026-02-20  
Durum: Hazir (console girisi bekliyor)  
Etiket: codex

## 1) Apple - Always Location Gerekcesi (STEP-386A)
`NeredeServis, personel servis operasyonunda surucu aktif seferdeyken yolculara yaklasma bilgisini canli gostermek icin konum kullanir. Surucu ekrani kilitliyken veya uygulama arka plandayken de rota koordinasyonu devam etmelidir; aksi halde ETA ve canli durum bozulur. Konum erisimi yalniz sofor rolunde ve sadece aktif sefer suresince kullanilir. Sefer sonlandiginda arka plan konum yayini otomatik durur.`

## 2) Apple Review Notu - Driver Guidance Lite (STEP-386AA)
`App'te "Driver Guidance Lite" modu vardir: aktif seferde surucuye siradaki durak, kalan mesafe ve harita uzerinden guzergahta kalma yardimi saglar. Bu akis "kisi takibi" amacli degildir; servis guzergah koordinasyonu ve yolcu bekleme suresi optimizasyonu icindir.`

## 3) Apple Review Terminoloji Kilidi (STEP-386C)
Zorunlu dil:
- `Route Coordination`
- `Trip Sharing`
- `ETA`, `next stop`, `driver guidance`

Yasakli dil:
- `tracking people`
- `person tracking`
- `kisi takibi/izleme`

## 4) Apple Background Location Kanit Paketi (STEP-386B)
Hazir kanitlar:
- UI screenshot seti: `tmp/ui_regression_screens/20260220-034438`
- Manifest: `tmp/ui_regression_screens/20260220-034438/manifest.md`
- Fiziksel test oturumu: `tmp/faz_g_365_370/20260220-031321`

Store'a yuklenecek final paket:
1. Surucu aktif seferde konum yayin ekrani (`Canli/Yayindasin` gorunur).
2. `Seferi Bitir` sonrasi yayin durdu kaniti.
3. Yolcu/misafir rolunde konum izni istenmedigi kaniti.
4. Izin red fallback ekrani (`foreground-only` uyari akisi).

## 5) Google Play - Background Location Declaration (STEP-387A/387AA)
Kisa metin:
`Sofor aktif sefer baslattiginda yolcularin guvenli ve dogru takip edebilmesi icin uygulama arka planda konum paylasir. Sefer bitince takip durur.`

Uzun metin:
`NeredeServis bir personel servis koordinasyon uygulamasidir. Sofor aktif seferi baslattiginda uygulama, yolcularin bekleme suresini azaltmak ve servisin yaklasma bilgisini gostermek icin arka planda konum guncellemesi gonderir. Konum erisimi sadece sofor rolunde ve aktif sefer boyunca kullanilir. Sefer sonlandiginda arka plan konum yayini otomatik olarak durur. Yolcu ve misafir rolde kullanici konumu alinmaz.`

Kontrol kilidi:
- Sadece sofor
- Sadece aktif sefer
- Sefer bitince durur
- Yolcu/misafir konumu alinmaz

Kaynak: `docs/google_play_background_location_justification_tr.md`

## 6) Google Play - Data Safety Cevap Matrisi (STEP-387/387AB/387AC/387AD)
Onerilen cevap seti:
- Location data: `Yes` (driver-only, active trip)
- Personal info: `Yes` (name/phone/email profil alanlari)
- Auth info: `Yes` (email/google auth kimlik baglanti verisi)
- Third-party sharing: `No`
- Account delete request: `Yes` (uygulama ici talep + backend delete flow)
- Guest location collection: `No`
- Data purpose: sadece `App functionality`
- Analytics/Ads purpose: `No`

Guest aciklama metni:
`Misafir akisi servis takibini SRV kodu ile yapar; misafirin cihazi konum verisi gondermez. Surucu konumu gorunur, misafir session verisi TTL politikasi ile temizlenir.`

## 7) Console Durumu
- Bu paket metinleri hazirlandi.
- Play Console / App Store Connect formlarina son giris henuz yapilmadi (hesap erisimi gerekiyor).
