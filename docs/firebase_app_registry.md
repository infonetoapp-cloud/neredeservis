# Firebase App Registry

GeneratedAt: 2026-02-17 13:55:00 +03:00

## Naming Decision
- Base package/bundle: `com.neredeservis.app`
- Flavor strategy:
  - dev: `.dev`
  - stg: `.stg`
  - prod: base id (suffix yok)

## Environment Mapping

### dev (`neredeservis-dev-01`)
- Android package: `com.neredeservis.app.dev`
- Android appId: `1:882097896542:android:df71941b8689ead1db88cf`
- iOS bundle: `com.neredeservis.app.dev`
- iOS appId: `1:882097896542:ios:a729dd50b64a442ddb88cf`
- Config files:
  - `firebase_app_configs/dev/google-services.json`
  - `firebase_app_configs/dev/GoogleService-Info.plist`

### stg (`neredeservis-stg-01`)
- Android package: `com.neredeservis.app.stg`
- Android appId: `1:691483247415:android:61c42d64a84312938f90b2`
- iOS bundle: `com.neredeservis.app.stg`
- iOS appId: `1:691483247415:ios:792bc9b1a3b45a718f90b2`
- Config files:
  - `firebase_app_configs/stg/google-services.json`
  - `firebase_app_configs/stg/GoogleService-Info.plist`

### prod (`neredeservis-prod-01`)
- Android package: `com.neredeservis.app`
- Android appId: `1:705689926965:android:9c8cd8fa043d295ed7e07c`
- iOS bundle: `com.neredeservis.app`
- iOS appId: `1:705689926965:ios:3d3ba8b962fe4a05d7e07c`
- Config files:
  - `firebase_app_configs/prod/google-services.json`
  - `firebase_app_configs/prod/GoogleService-Info.plist`

## Notes
- Bu dosya app kimliklerinin tek kaynak kaydidir.
- Flutter tarafinda flavor klasorlerine kopyalama adimi `STEP-020`'de yapilacaktir.
