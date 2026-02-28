# Mobile Force Update + Client Version Enforcement Plan

Tarih: 2026-02-24
Durum: V2 plan (critical for compatibility layer sunset, aggressive cutoff)

## 1. Amac

Legacy mobile compatibility layer'i sonsuza kadar tasimamak icin:
- eski clientlari kontrollu sekilde uyarmak (kisa warning penceresi)
- cutoff tarihinde zorunlu guncelleme uygulatmak
- eski mutasyonlari server tarafinda reddetmek
- compatibility adapter omrunu kisa tutmak

## 2. Neden gerekli?

Sadece deprecation date yazmak yeterli degil. Kullanici eski app ile gelmeye devam ederse:
- compatibility layer kapanamaz
- owner-only vs yeni RBAC semantik cakismasi uzar
- data corruption riski devam eder

## 3. Iki Katmanli Model (zorunlu)

### 3.1 Client-side UX lock (Remote Config)

- Firebase Remote Config ile min version kurallari
- `min_required_version_android`
- `min_required_version_ios`
- opsiyonel: `min_warn_version_*`

Davranis:
- version < min_warn: normal
- min_warn <= version < min_required: warning banner/modal
- version < min_required: Force Update ekranı (bloklayici)

Risk notu (legacy app kapasitesi):
- Eski mobil surumde Force Update UI kodu yoksa client-side lock calismayabilir
- Bu durumda server-side reject tek guvenilir kilit olur; UX bozulmasini azaltmak icin legacy shim/fallback planlanir

### 3.2 Server-side enforcement (gerekli)

Kritik mutasyon endpointleri icin:
- `clientAppVersion`
- `clientPlatform`
- `clientBuildNumber`
kontrol edilir.

Kural:
- cutoff sonrasi eski client mutasyonlari reject edilir
- read-only grace gerekiyorsa explicit whitelist ile tanimlanir
- reject path user-safe ve standart olmalidir (`426 Upgrade Required` tercih edilir)

Operasyon notu (review netlestirmesi):
- cutoff "aktif sefer ortasi" riskini azaltmak icin rollout saatleri operasyon penceresine gore secilir
- gerekiyorsa yalnizca seferi guvenle bitirmeye yarayan dar endpoint subset'i gecici whitelist edilir
- bu whitelist open-ended read/write compatibility'ye donusturulmez

Legacy client fallback notu (opsiyonel, time-boxed):
- Eski app'in lokal state temizligi icin tekil kritik endpointler (ornegin `finishTrip`) icin gecici "legacy finalize shim" dusunulebilir
- Bu shim yalnizca local state'i toparlamaya yarar; yeni domain state mutasyonu yaratmaz veya strict audit ile no-op davranir
- Time-boxed olmalidir (sunset tarihi zorunlu)

Neden:
- Remote Config offline olabilir
- client manipule edilebilir
- eski app config cekemeyebilir

## 4. Version Kaynagi ve Normalizasyon

Version parsing kurallari net olmalı:
- semantic version (`x.y.z`) veya build number
- platform bazli compare (Android/iOS farklari)
- server tarafinda tek utility ile parse/compare

Kural:
- string compare ile karar verme

## 5. Force Update UX Gereksinimleri

Ekranda:
- neden guncelleme gerektiği (kisa, teknik olmayan dil)
- minimum versiyon bilgisi
- tek primary CTA: "Guncelle"
- app store/play store deep link
- opsiyonel secondary: "Daha sonra" (sadece warning modunda)

Hard lock modunda:
- app ana akislarina giris yok
- tekrar dene butonu (config refresh icin) olabilir

## 6. Rollout Stratejisi

1. Telemetry toplama (aktif versiyon dagilimi)
2. Kisa warning period baslat
3. Force update client-side lock aktif et
4. Server-side mutasyon reject aktif et (`426 Upgrade Required` / structured error)
5. Legacy compatibility mutasyon handlerlarini upgrade-required shim'e indir
6. Legacy compatibility path kapatma (read path kaldiysa ayri sunset)

Kural:
- client lock ve server reject ayni haftada plansiz acilmaz; rollout checklist ile gider
- rollout takvimi kod oncesi kayda gecirilir; "sonra bakariz" diye acik uclu birakilmaz

## 6.1 Aggressive Cutoff Ilkesi (MVP/Pilot)

Solo-founder delivery hizi icin:
- legacy write compatibility en uzun omurlu katman olmamalidir
- migration dry-run tamamlanir tamamlanmaz force update rollout penceresi baslatilir
- gecici uzatma sadece yazili incident gerekcesiyle yapilir (default degil)

## 7. Cutoff Politikasi Template

Her legacy path icin kayit tutulur:
- endpoint / callable name
- etkiledigi client versiyon araligi
- warning start date
- force update date
- server reject date
- temporary rollback owner
- max extension window (gun)

## 8. Observability / Metrics

- active_client_version_distribution
- force_update_screen_shown_count
- force_update_clickthrough_rate
- server_reject_old_client_count
- legacy_endpoint_calls_by_version
- cutoff sonrası support ticket count

## 9. Test Checklist (min)

- Remote Config warning mode test
- Remote Config hard lock test
- legacy app Force Update UI yokken server-only reject UX smoke test
- offline modda stale config davranisi test
- server-side old version reject test
- old version -> `426` response envelope test
- (opsiyonel shim varsa) legacy finalize shim audit/no-op testi
- server-side allowed version pass test
- store deep link test (Android/iOS)

## 10. Fazlama

- Faz 2-3: version telemetry + parsing utility tasarimi
- Faz 4-5: force update UX + server enforcement implementasyon hazirligi + cutoff template freeze
- Faz 5-6: pilot cutoff rehearsal (warning -> hard lock -> 426)
- Faz 6+: legacy path retirement uygulamasi (adapter shrink/remove)

## 11. Referanslar

- `58_mobile_migration_backward_compatibility_and_bulk_import_plan.md`
- `61_security_hardening_2fa_session_sso_csp_secrets_password_flows.md`
- `63_test_strategy_feature_flags_rollout_backup_retention_notifications_plan.md`
