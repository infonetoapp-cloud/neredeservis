# NeredeServis - Paywall Copy Set (TR, Store Uyumlu)

**Versiyon:** v1.0  
**Tarih:** 2026-02-16  
**Kapsam:** Sofor rolunde paywall, trial, satin alma, restore, abonelik yonetimi metinleri

---

## 1) Kural Seti (Kisa)

- Paywall sadece sofor rolune gosterilir.
- Giris noktasi sadece 3 yer:
  - `Ayarlar > Abonelik`
  - `Trial bitti` banner tetigi
  - Premium aksiyon tetigi
- Ekranda her zaman:
  - iOS: `Restore Purchases`
  - Android: `Satin Alimlari Geri Yukle`
  - `Manage Subscription`
- Uygulama ici "webden daha ucuz" veya harici odeme yonlendirmesi kullanilmaz.

---

## 2) Ekran Bazli Metin Haritasi

| Ekran/Alan | Metin |
|---|---|
| Ayarlar kart basligi | `Abonelik` |
| Ayarlar kart alt metin (trial aktif) | `Deneme suren devam ediyor` |
| Ayarlar kart alt metin (aktif) | `Premium aktif` |
| Ayarlar kart alt metin (expired) | `Deneme bitti, canli mod kisitli` |
| Trial banner (aktif) | `Deneme suresi: {days_left} gun kaldi` |
| Trial banner (bitti) | `Denemen bitti. Canli modu acmak icin abonelik sec.` |
| Premium aksiyon intercept baslik | `Bu ozellik Premium` |
| Premium aksiyon intercept metin | `Canli ve tam hizli takip icin abonelik gerekli.` |
| Premium aksiyon intercept CTA | `Planlari Gor` |

---

## 3) Paywall Ana Ekran Kopyasi

## 3.1 Hero Baslik Varyantlari

- V1 (onerilen): `Servisi gecikmeden goster`
- V2: `Yolcularina anlik takip ver`
- V3: `Canli servis deneyimini ac`

## 3.2 Alt Baslik Varyantlari

- V1 (onerilen): `Premium ile konum ve bildirimler daha hizli, daha tutarli calisir.`
- V2: `Yolcular "Nerede?" diye aramadan, bilgiyi uygulamadan gorur.`
- V3: `Deneme bitti. Veri kaybetmeden Premium'a gecebilirsin.`

## 3.3 Deger Maddeleri (3 satir)

- `Daha sik guncelleme ile canli takip`
- `Duyuru ve bildirim akisinda oncelik`
- `Kesintide daha guclu senkron geri donusu`

## 3.4 Plan Kartlari

| Alan | Aylik | Yillik |
|---|---|---|
| Baslik | `Aylik Plan` | `Yillik Plan` |
| Fiyat satiri | `{monthly_price}/ay` | `{yearly_price}/yil` |
| Tasarruf etiketi | `` | `En avantajli` |
| Aciklama | `Esnek odeme` | `Uzun donem daha dusuk maliyet` |

## 3.5 CTA ve Alt Aksiyonlar

- Birincil CTA: `Premium'u Ac`
- Ikincil CTA: `Simdilik Sonra`
- Link: iOS=`Restore Purchases`, Android=`Satin Alimlari Geri Yukle`
- Link: `Manage Subscription`

## 3.6 Alt Bilgi/Legal Satiri

- `Abonelik otomatik yenilenir. Istedigin zaman store ayarlarindan iptal edebilirsin.`

---

## 4) Trial Durum Metinleri

## 4.1 Trial Aktif

- Durum etiketi: `Deneme Aktif`
- Yardimci metin: `Premium ozellikleri {trial_end_date} tarihine kadar acik.`
- Banner CTA: `Planlari Incele`

## 4.2 Trial Bitimine Az Kaldi (3 gun ve alti)

- Banner: `Deneme bitiyor: {days_left} gun kaldi`
- Alt metin: `Kesintisiz devam icin plan secimini simdiden yap.`
- CTA: `Simdi Sec`

## 4.3 Trial Bitti (Soft-Lock)

- Baslik: `Deneme suresi bitti`
- Metin: `Temel kullanim acik. Canli mod kisitli hizda devam eder.`
- CTA: `Premium'a Gec`
- Ikincil: `Simdilik Devam Et`

---

## 5) Satin Alma Akisi Metinleri

| Durum | Baslik | Mesaj | Aksiyon |
|---|---|---|---|
| Baslatildi | `Isleniyor` | `Store odeme ekrani aciliyor...` | `Bekle` |
| Beklemede | `Onay Bekleniyor` | `Islem store tarafinda onaylaninca otomatik aktif olacak.` | `Tamam` |
| Basarili | `Premium aktif` | `Aboneligin basariyla acildi.` | `Devam Et` |
| Iptal | `Islem iptal edildi` | `Abonelik acilmadi. Istedigin zaman tekrar deneyebilirsin.` | `Kapat` |
| Hata (network) | `Baglanti sorunu` | `Store'a ulasilamadi. Internetini kontrol et.` | `Tekrar Dene` |
| Hata (store) | `Store hatasi` | `Islem tamamlanamadi. Birazdan tekrar dene.` | `Tekrar Dene` |
| Hata (urun yok) | `Plan bulunamadi` | `Plan bilgisi su an alinmiyor.` | `Destek` |

---

## 6) Restore / Geri Yukle Metinleri

| Durum | Mesaj |
|---|---|
| Basari (aktif bulundu) | `Satin alimin geri yuklendi. Premium aktif.` |
| Basari (kayit yok) | `Geri yüklenecek satin alim bulunamadi.` |
| Hata | `Geri yukleme su an tamamlanamadi. Lutfen tekrar dene.` |

Buton etiketleri:
- iOS: `Restore Purchases`
- Android: `Satin Alimlari Geri Yukle`
- `Tekrar Dene`
- `Tamam`

---

## 7) Manage Subscription Metinleri

- Buton etiketi: `Manage Subscription`
- Yardimci metin: `Abonelik yenileme ve iptal islemleri store ekraninda yonetilir.`
- Dis baglanti onayi (opsiyonel): `Store abonelik ekranina yonlendiriliyorsun.`

## 7.1 Hesap Silme Interceptor (Zorunlu)

Bu metin, kullanici `Hesabimi Sil` akisini tetiklediginde aktif aboneligi varsa gosterilir:

- Baslik: `Aktif aboneliginiz var`
- Govde: `Hesabi silmek odemeyi durdurmaz. Once store aboneliginizi iptal etmelisiniz.`
- Birincil buton: `Manage Subscription`
- Ikincil buton: `Vazgec`
- Bilgi satiri: `Aboneligi iptal ettikten sonra hesabinizi silebilirsiniz.`

---

## 8) Soft-Lock Durum Mesajlari

Bu set, trial bitisinde tam kilit yerine "kisitli mod" kullanildiginda:

- `Servis Baglantisi: Dusuk Oncelik Modu`
- `Canli mod kisitli: guncellemeler daha seyrek gonderiliyor.`
- `Tam hizli canli takip icin Premium ac.`
- `Verilerin guvende. Premium acildiginda tam moda otomatik donersin.`

---

## 9) Yasakli / Kacinilacak Ifadeler

- `Webden daha ucuz`
- `Store disi odeme`
- `Bize IBAN gonder`
- `Uygulama disindan satin al`

Alternatif guvenli ifadeler:
- `Planlari store uzerinden yonetebilirsin.`
- `Abonelik islemleri platform kurallarina uygun sekilde yapilir.`

---

## 10) l10n Anahtar Onerisi

| Key | Deger (TR) |
|---|---|
| `paywall_title` | `Servisi gecikmeden goster` |
| `paywall_subtitle` | `Premium ile konum ve bildirimler daha hizli, daha tutarli calisir.` |
| `paywall_cta_primary` | `Premium'u Ac` |
| `paywall_cta_secondary` | `Simdilik Sonra` |
| `paywall_restore_ios` | `Restore Purchases` |
| `paywall_restore_android` | `Satin Alimlari Geri Yukle` |
| `paywall_restore` | `Platforma gore secilen restore etiketi` |
| `paywall_manage` | `Manage Subscription` |
| `delete_interceptor_title` | `Aktif aboneliginiz var` |
| `delete_interceptor_body` | `Hesabi silmek odemeyi durdurmaz. Once store aboneliginizi iptal etmelisiniz.` |
| `delete_interceptor_cta_manage` | `Manage Subscription` |
| `delete_interceptor_cta_cancel` | `Vazgec` |
| `trial_banner_active` | `Deneme suresi: {days_left} gun kaldi` |
| `trial_banner_expired` | `Denemen bitti. Canli modu acmak icin abonelik sec.` |
| `purchase_success` | `Aboneligin basariyla acildi.` |
| `purchase_cancelled` | `Islem iptal edildi.` |
| `purchase_error_network` | `Store'a ulasilamadi. Internetini kontrol et.` |
| `restore_success` | `Satin alimin geri yuklendi. Premium aktif.` |
| `restore_empty` | `Geri yuklenecek satin alim bulunamadi.` |
| `restore_error` | `Geri yukleme su an tamamlanamadi.` |
| `softlock_hint` | `Canli mod kisitli: guncellemeler daha seyrek gonderiliyor.` |

---

## 11) QA Checklist (Copy)

- Metinler 320px genislikte satir tasirmiyor.
- CTA metinleri 18 karakteri asmiyor.
- Trial tarih/gun placeholderlari dogru formatta.
- iOS'ta `Restore Purchases` gorunur.
- Android'de `Satin Alimlari Geri Yukle` gorunur.
- `Manage Subscription` her iki platformda gorunur.
- Harici odeme yonlendiren metin yok.
- Hesap silme akisinda aktif abonelik varsa interceptor metni + `Manage Subscription` linki zorunlu gorunur.
- Android billing akisi (Billing Library 6.x uyumlu plugin) testte sorunsuz.
- UTF-8/TR karakterler (`ı, ş, ğ, ü, ö, ç`) paywall ve store metinlerinde bozulmuyor.
