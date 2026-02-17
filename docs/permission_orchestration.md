# NeredeServis Permission Orchestration (V1.0)

## 1) Amac
- Izinler onboarding basinda toplu istenmez.
- Izin sadece ilgili deger aninda istenir.
- Red durumunda uygulama "neden + ne kaybedilir + nasil acilir" mesajini net verir.

## 2) Izin Zamanlama Matrisi

| Izin | Kimden | Ne zaman istenir | Izin verilirse | Izin verilmezse |
|---|---|---|---|---|
| Notification | Yolcu | Route katilimi tamamlandiginda veya `Bildirim Acik Kalsin` CTA tiklaninca | Sabah/haraket/gecikme push alir | Push yok; in-app kart/banner + Ayarlar CTA |
| Notification | Sofor | Ilk `Duyuru Gonder` veya sabah hatirlatma ayari acilirken | Duyuru/policy mesajlari push ile desteklenir | Push yok; kritik geri bildirim uygulama icinde kalir |
| Konum `while-in-use` | Sofor | `Seferi Baslat` veya `Ghost Drive Kaydi Baslat` aninda | Aktif sefer publish baslar | Aktif sefer hard-block; route yonetimi serbest |
| Konum `background/always` | Sofor | `while-in-use` verildikten sonra aktif sefer commit adiminda | Ekran kilitli/arka planda publish devam eder | Foreground-only tracking; stale riski artar |
| Pil optimizasyonu istisnasi (Android) | Sofor | Ilk aktif sefer sonrasi veya OEM kill sinyali algilaninca | Arka plan servis stabilitesi artar | OEM kill riski; publish araligi degrade olabilir |

## 3) Red Durumunda Beklenen Davranis

### 3.1 Notification red
- Push scheduler/token flow pasif kalir.
- Yolcuya ve sofore in-app fallback gosterilir.
- Mesaj: `Bildirim kapali. Servis uyarilarini zamaninda almak icin Ayarlar'dan acabilirsiniz.`

### 3.2 Konum `while-in-use` red
- `Seferi Baslat` aksiyonu server'a gitmez.
- Mesaj: `Canli takip icin konum izni gerekli. Bu izin olmadan sefer baslatilamaz.`
- CTA:
  - `Tekrar Dene`
  - `Ayarlar'dan Ac`

### 3.3 Konum `background/always` red
- Sefer aktif olabilir ama `foreground-only` mod zorunlu.
- Heartbeat warning state: sari.
- Yolcu stale ihtimali artarsa stale etiketi gorunur.
- Mesaj: `Uygulama arka plandayken konum yayini kesilebilir. Daha stabil takip icin arka plan iznini acin.`

### 3.4 Pil optimizasyonu red (Android)
- Uygulama ekran kapandiginda OEM tarafli kill riski yuksek.
- Heartbeat warning state: sari/kirmizi (duruma gore).
- Mesaj: `Pil optimizasyonu aktif oldugu icin yayin durabilir. Kesintisiz takip icin istisna ekleyin.`
- CTA:
  - `Ayarlar'a Git`
  - `Simdilik Devam Et`

## 4) Tekrar Isteme Kurali
- `Don't ask again` durumunda otomatik prompt gosterilmez.
- Sadece kullanici aksiyonu ile (`Ayarlar'dan Ac`) yonlendirme yapilir.
- Ayni izin icin otomatik tekrar isteme cooldown: minimum 24 saat.

## 5) Role Bazli Kural (Kesin)
- Yolcu/guest rolde konum izni prompt yolu kapali.
- Sofor rolde notification + konum + (Android) pil optimizasyonu akisi acik.

## 6) QA Senaryolari
- Notification red -> in-app fallback calisiyor, push gelmiyor.
- `while-in-use` red -> `Seferi Baslat` hard-block.
- `background` red -> foreground-only + stale warning.
- Pil optimizasyonu red -> degrade mode + heartbeat warning + settings CTA.
- Yolcu/guest rolde hicbir konum izni promptu acilmiyor.
