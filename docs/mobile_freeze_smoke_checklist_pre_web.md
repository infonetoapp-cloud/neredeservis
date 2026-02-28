# Mobil Freeze Smoke Checklist (Web Öncesi)

Amaç: Web geliştirmesine geçmeden önce mobil uygulamada kritik akışların çalıştığını hızlı ve tekrarlanabilir şekilde doğrulamak.

## Preflight Guardrail (Yerel)

Tüm komutları FVM ile çalıştır:

```powershell
./.fvm/flutter_sdk/bin/dart.bat analyze lib/app/router
./.fvm/flutter_sdk/bin/flutter.bat test --no-pub test/app/router -r compact
./.fvm/flutter_sdk/bin/flutter.bat test --no-pub test/ui/join_screen_test.dart test/ui/passenger_settings_screen_test.dart test/ui/passenger_tracking_screen_test.dart -r compact
```

Notlar:
- Global `flutter` yerine FVM kullan.
- Son komut uzun sürerse en az `join_screen` ve `passenger_tracking_screen` testlerini koş.

## Smoke Scope (Kritik Akışlar)

### Driver

1. `Start Trip`
- Driver hesabı ile giriş yap
- Driver home/map ekranı açılıyor mu
- Sefer başlat aksiyonu çalışıyor mu
- Hata durumunda uygulama crash yerine kullanıcı mesajı gösteriyor mu

2. `Active Trip`
- Aktif sefer ekranı açılıyor mu
- Harita/rota çizimi geliyor mu (boş veya bozuk veri gelirse ekran düşmüyor mu)
- Geri/plandan döndüğünde ekran state’i korunuyor mu

3. `Finish Trip`
- Finish/slide aksiyonu çalışıyor mu
- Pending sync / warning dialog’ları açılıyor mu
- Ağ kapalı/açık senaryosunda dialog mesajları ve fallback davranışı düzgün mü

4. `Completed`
- Sefer tamamlandıktan sonra doğru ekrana yönleniyor mu
- Driver corridor içinde kalıyor mu (yanlış passenger route’a düşmüyor)

### Passenger

1. `Join`
- Kod ile katılım ekranında boş/invalid giriş validasyonu çalışıyor mu
- Loading sırasında çift submit engelleniyor mu
- Backend hata verirse inline error gösteriliyor mu (crash yok)

2. `Tracking Açılışı`
- Join sonrası tracking ekranına geçiş çalışıyor mu
- Passenger entry guard sonsuz spinner’da kalmıyor mu
- Ağ sorunu / yavaşlıkta timeout sonrası hata fallback ve `Tekrar Dene` çalışıyor mu

## Manuel Negatif Senaryolar (Minimum)

1. Ağ kapalıyken passenger tracking açılışı
- Beklenen: sonsuz loading yok, timeout + fallback UI

2. Bozuk konum verisi (staging/test user ile)
- Beklenen: harita ekranı crash olmaz, invalid coordinate ignore edilir

3. Join form callback yok / hata fırlatıyor
- Beklenen: inline kullanıcı mesajı, ekran responsive kalır

## Freeze Karar Kriteri

`Freeze-ready` saymak için minimum:

1. Router analyze (targeted veya `lib/app/router`) temiz/yalnız info seviyesinde
2. `test/app/router` green
3. Yukarıdaki Driver + Passenger smoke senaryoları manuel geçti
4. Kritik ekranda crash gözlenmedi (driver active trip, passenger tracking)

## Bilinçli Kapsam Dışı (Bu Checklist)

- Görsel redesign / pixel polish
- Web/panel akışları
- Yeni feature geliştirme
- Büyük mimari refactor (Faz 4+)
