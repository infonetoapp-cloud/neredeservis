# NeredeServis Setup

## Toolchain
- Flutter: `3.24.5` (FVM lock)
- Dart: `3.5.4`
- Java: `17` (CI standard)
- Android SDK + platform tools

## First-time setup
1. `.\.fvm\flutter_sdk\bin\flutter.bat pub get`
2. `powershell -ExecutionPolicy Bypass -File .\scripts\install_git_hooks.ps1`
3. Optional: `git config --get core.hooksPath` should return `.githooks`

## Sentry env files (local, not committed)
- `.env.dev`
- `.env.staging`
- `.env.prod`

Example (`.env.staging`):
`APP_FLAVOR=stg`
`SENTRY_ENABLED=true`
`SENTRY_DSN=<your_dsn>`
`ADAPTY_ENABLED=false`
`ADAPTY_API_KEY=<your_adapty_public_sdk_key>`

`scripts/build_flavor.*` and `scripts/run_flavor.*` automatically pass these files via `--dart-define-from-file`.

## Local commands (PowerShell)
- Build dev debug: `.\scripts\build_dev.ps1`
- Build stg debug: `.\scripts\build_stg.ps1`
- Build prod debug: `.\scripts\build_prod.ps1`
- Build release: `.\scripts\build_dev.ps1 -Mode apk-release`
- Run dev: `.\scripts\run_dev.ps1`
- Watch codegen: `.\scripts\watch_codegen.ps1`

## Local commands (bash)
- `./scripts/build_dev.sh`
- `./scripts/build_stg.sh`
- `./scripts/build_prod.sh`
- `./scripts/build_dev.sh apk-release`
- `./scripts/run_dev.sh`
- `./scripts/watch_codegen.sh`
- `./scripts/install_git_hooks.sh`

## CI summary
- `Analyze` job: `flutter analyze`
- `Unit Test` job: `flutter test`
- `Android Flavor Build` job: dev/stg/prod debug APK build
- `Android Emulator Integration` job: `integration_test/smoke_startup_test.dart`
- `iOS Compile (No Codesign)` job: non-blocking compile guard in no-Mac mode
