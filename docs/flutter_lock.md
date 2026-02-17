# NeredeServis Flutter Lock

## Locked Toolchain
- Flutter: `3.24.5`
- Channel: `stable`
- FVM: required

## Lock Commands
```bash
fvm use 3.24.5
fvm flutter --version
fvm flutter doctor -v
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
