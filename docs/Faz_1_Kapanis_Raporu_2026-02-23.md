# Faz 1 Kapanis Raporu (Corridor + Router Modularizasyonu)

Tarih: 2026-02-23  
Durum: Tamamlandi (uygulama temeli / corridor mimarisi)

## 1. Faz 1 Amaci

- Sofor/yolcu koridorlarini mimari seviyede ayirmak.
- Router kararlarini tek noktada toplamak.
- Router'i modulerlestirip shell tabanli uzun omurlu bir zemine almak.
- Davranis degistirmeden role-switch transaction seam'i olusturmak.

## 2. Tamamlanan Isler

### 2.1 Router modularizasyonu

- `app_router.dart` route registry `public / driver / passenger / shared` parcalarina ayrildi.
- `lib/app/router/route_groups/public_routes.dart`
- `lib/app/router/route_groups/driver_routes.dart`
- `lib/app/router/route_groups/passenger_routes.dart`
- `lib/app/router/route_groups/shared_routes.dart`

### 2.2 Corridor coordinator + role-switch seam

- `RoleCorridorCoordinator` ile corridor classify / redirect / navigation plan mantigi merkezilestirildi.
- `RoleSwitchNavigationPlan` explicit destination helper ile gercek akislarada kullanilir hale geldi.
- `continue as passenger/driver/guest`, `_routeAfterAuth`, entry guards gibi role transition noktalari plan seam uzerinden geciyor.

### 2.3 Shell seam (DriverShell / PassengerShell)

- Driver ve Passenger corridor'lari `ShellRoute` altina alindi.
- `DriverShell` / `PassengerShell` no-op wrapper olarak basladi, sonra aktif metadata listener hook'lari eklendi.
- Shell seviyesine transition metadata tasiyan bus eklendi (`RoleCorridorShellTransitionBus`).
- Shell runtime snapshot/store eklendi:
  - son transition bilgisi
  - reset/bootstrap request count
  - bounded recent trace listesi

### 2.4 Settings/Paywall route ayrimi (Faz 1 pragmatik kapanis)

- `paywall` zaten baslangicta driver-scoped path idi: `/driver/paywall` (korundu).
- Yeni `driver settings` path eklendi: `/driver/settings`
- Driver drawer settings navigation artik `/driver/settings` kullanir.
- Legacy `/settings` route korunup compatibility alias olarak calisir:
  - driver -> `/driver/settings` redirect
  - diger roller -> mevcut app settings davranisi
- `ConsentGuard` role-aware redirect yapar:
  - driver `activeTrip` no-consent -> `/driver/settings`
  - diger roller -> `/settings`

## 3. Guard Matrix ve Regression Kapsami

Eklenen/genisletilen testler:

- `test/app/router/guard_matrix_test.dart`
  - AuthGuard private route bloklari (`driverSettings`, `paywall`, `settings`)
  - RoleGuard driver/passenger corridor ayrimi
  - ConsentGuard role-aware settings redirect hedefi
- `test/app/router/consent_guard_test.dart`
  - driver consent redirect / exemption senaryolari
- `test/app/router/role_corridor_shells_test.dart`
  - shell transition bus publish/ignore davranisi
  - shell runtime snapshot counter/trace davranisi

## 4. Observability (Minimum Faz 1 Seviyesi)

Shell runtime store su verileri tutuyor:

- son transition sequence / kaynak rol / hedef rol
- son currentLocation / targetLocation
- son resetStack / bootstrapRoleContext istekleri
- toplam transition sayisi
- reset request sayisi
- bootstrap request sayisi
- bounded recent transition trace listesi

Bu veri yapisi Faz 2/Faz 3'te telemetry/debug panel/export icin kullanilabilir.

## 5. Bilincli Kapsam Siniri (Dokumante)

- `AppRoutePath.passengerSettings` hali hazirda route-membership odakli bir yolcu ayar ekrani (`PassengerSettingsScreen`) oldugu icin app-level passenger settings path'i olarak yeniden kullanilmadi.
- App-level genel ayarlar icin compatibility amacli `/settings` korunuyor.
- Bu karar mevcut deep-link/kontratlari bozmadan Faz 1'i kapatmak icin bilincli olarak secildi.

## 6. Dogrulama Kanitlari

Calistirilan komutlar (Faz 1 kapanis paketi):

1. `./.fvm/flutter_sdk/bin/dart.bat format ...`
2. `./.fvm/flutter_sdk/bin/dart.bat analyze lib/app/router test/app/router`
   - Sonuc: PASS (`No issues found!`)
3. `./.fvm/flutter_sdk/bin/flutter.bat test test/app/router -r compact`
   - Sonuc: PASS (router/guard/corridor/shell testleri dahil)

## 7. Faz 2'ye Devir Notlari

- Router icindeki business/data side-effect extraction (Firebase/Firestore/Functions) Faz 2 ana isi olarak devam edecek.
- Shell runtime snapshot verisi uzerinden aktif reset/bootstrap orchestration davranisi (idempotent) sonraki adimda etkinlestirilebilir.
- `driver/settings` ayrimi tamamlandi; `passengerSettings` path semantik cakismasi icin ayrik migration karari Faz 2/ADR ile alinmali.
