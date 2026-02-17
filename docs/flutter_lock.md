# NeredeServis Flutter Lock

## Locked Toolchain
- Flutter: `3.24.5`
- Channel: `stable`
- FVM: required (`.fvm/flutter_sdk` referansi zorunlu)
- Dart: `3.5.4`
- DevTools: `2.37.3`

## Lock Commands
```bash
fvm use 3.24.5
fvm flutter --version
fvm flutter doctor -v
```

PowerShell fallback (global `fvm` yoksa):
```powershell
.\.fvm\flutter_sdk\bin\flutter.bat --version
.\.fvm\flutter_sdk\bin\flutter.bat doctor -v
```

## CI Guard
- CI ve local build sadece `fvm flutter` ile calistirilir.
- `flutter` binary'si dogrudan kullanilmaz.

## Update Policy
- Flutter upgrade yalniz sprint sonunda yapilir.
- Upgrade oncesi zorunlu:
  - `flutter pub outdated`
  - `dart fix --dry-run`
  - full test + emulator integration

## Last Verified
- Date: `2026-02-17`
- Owner: `NeredeServis`
- Framework revision: `dec2ee5c1f98f8e84a7d5380c05eb8a3d0a81668`
- Engine revision: `a18df97ca57a249df5d8d68cd0820600223ce262`
- Host OS: `Microsoft Windows 10.0.19045.6466 (tr-TR)`
- Host OS fingerprint sha256: `c8c9f99c2a0a7fd66a0118852dd9b394df7e5627f04af0dc3206621fb864fb42`

## Doctor Notes (2026-02-17)
- `flutter` ve `dart` PATH'inin global SDK'ya isaret ettigi uyarisi var.
- Proje calistirma standardi:
  - her zaman `.fvm/flutter_sdk` veya `fvm flutter` kullan.
- Android license uyarisi:
  - gerekirse `flutter doctor --android-licenses` calistirilacak.
