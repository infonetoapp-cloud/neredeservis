# NeredeServis Support Report Spec (V1.0)

## 1) Amac
- `Sorun Bildir` ve opsiyonel `Shake to Report` akisiyla tanilamayi hizlandirmak.
- "Uygulama bozuk" tipi belirsiz geri bildirimleri teknik olarak aksiyona donusturmek.

## 2) Tetikleyiciler
- Manuel: `Ayarlar > Sorun Bildir`
- Opsiyonel kisayol: telefonu sallama (`Shake to Report`)

## 3) Toplanacak Alanlar (PII'siz)
- `uid` (hashlenmis/kimliklendirilmis format)
- `role` (`driver|passenger|guest`)
- `routeId` (opsiyonel)
- `tripId` (opsiyonel)
- `trigger` (`manual|shake`)
- `note` (kullanici metni, max 500 karakter)
- `permissionState` (notification/while-in-use/background/battery opt)
- `networkType` (wifi/cellular/offline)
- `batteryLevel` (yuzde)
- `queueDepth` (`trip_action_queue`, `location_queue`)
- `last5mLogSummary` (error/warn olay ozeti, count bazli)
- `appState` (foreground/background/terminated son bilinen)
- `createdAt` (server time)

## 4) Redaction Kurali
- Ham telefon numarasi yok.
- E-posta acik metin yok.
- WhatsApp/duyuru icerigi tam metin yok; sadece event turu ve hata kodu var.
- Konum noktalari rapora ham dizi olarak konmaz; yalniz sayisal ozet (or. son nokta yasi, gps accuracy araligi).

## 5) Gonderim Kanali
- Birincil: Firestore `support_reports/{reportId}`
- Ikincil (opsiyonel): support e-posta (`infonetoapp@gmail.com`) veya Slack webhook
- Kanal hatasinda lokal kuyruga alinip baglanti geldiginde tekrar denenir.

## 6) Saklama ve Silme
- Rapor retention: 30 gun
- KVKK delete talebinde `uid` ile bagli support raporlari da silinir/anonimlestirilir.

## 7) Kabul Kriterleri
- Rapor olusumu 3 sn icinde tamamlanir.
- PII redaction testleri green.
- Support ekibi raporla sorunun kok nedenine en fazla 1 adimda ulasabilir.
