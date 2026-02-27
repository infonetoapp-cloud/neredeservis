# FAZ H Release Ops Plani (STEP-394 / 402 / 403 / 404A / 404B)

Tarih: 2026-02-20  
Durum: Hazir  
Etiket: codex

## 1) Version Code / Build Number Stratejisi (STEP-394)

### Android
- `versionCode` her store upload'da artar (zorunlu, geri alinmaz).
- Onerilen sema:
  - RC/internal: `major*10000 + minor*100 + build`
  - Ornek: `1.0.0` icin ilk production `10000`, hotfix `10001`, `10002`...
- `versionName` semver olarak kalir (`1.0.0`, `1.0.1`).

### iOS
- `CFBundleShortVersionString` = semver (`1.0.0`).
- `CFBundleVersion` = artan build numarasi (`1`, `2`, `3`...).
- Ayni version icinde her yeni archive'da build numarasi arttirilir.

### Git/Release Etiket Kurali
- Internal RC: `NSV-RC<n>-<yyyy-mm-dd>`
- Production: `NSV-v<semver>`

## 2) Staged Rollout Plani (STEP-402)
- Faz-1 `%5` (24 saat):
  - Crash-free, auth basari orani, join basari orani, stale oranlari izlenir.
- Faz-2 `%20` (24 saat):
  - Faz-1 KPI korunursa gecilir.
- Faz-3 `%100`:
  - Kritik esik asimi yoksa full rollout.

### Esik Ornekleri (release gate)
- Crash-free < `%99.5` ise rollout durdur.
- Auth basari oraninda `%2+` mutlak dusus varsa rollout durdur.
- Join/trip kritik P0 issue gorulurse rollout durdur.

## 3) Rollback Plani (STEP-403)

### Android (Play)
1. Rollout'u aninda `halt` et.
2. Onceki stabil surume `production` track'te geri don.
3. Kill-switch gerekiyorsa Remote Config ile kritik ozellikleri kapat:
   - `tracking_enabled=false`
   - `announcement_enabled=false`
   - `guest_tracking_enabled=false`
4. Incident kaydi ac ve hotfix RC olustur.

### iOS (App Store Connect)
1. Phased release'i `Pause` et.
2. Onceki stabil build'e geri yayin stratejisini uygula.
3. Gerekirse server-side/feature-flag kill-switch ile riskli akis kapat.
4. Incident kaydi + hotfix sprint tetikle.

## 4) Feature Flag Anahtar Esitleme (STEP-404A)
`docs/feature_flags.md` ile release checklist key seti birebir:
- `tracking_enabled`
- `announcement_enabled`
- `guest_tracking_enabled`
- `force_update_min_version`
- `directions_enabled`
- `map_matching_enabled`

## 5) Flag Tip/Varsayilan/Scope Tablosu (STEP-404B)
| Key | Type | Default (prod) | Scope |
|---|---|---|---|
| `tracking_enabled` | bool | `true` | dev/stg/prod |
| `announcement_enabled` | bool | `true` | dev/stg/prod |
| `guest_tracking_enabled` | bool | `true` | dev/stg/prod |
| `force_update_min_version` | string | `0.0.0` | dev/stg/prod |
| `directions_enabled` | bool | `false` | dev/stg/prod |
| `map_matching_enabled` | bool | `true` | dev/stg/prod |

Ek sayisal tunable seti (`docs/feature_flags.md`):
- `kalman_process_noise`
- `kalman_measurement_noise`
- `kalman_update_interval_ms`
- `mapbox_monthly_directions_cap`
- `mapbox_monthly_map_matching_cap`
- `mapbox_tile_cache_mb`
- `mapbox_style_preload_enabled`

## 6) Acik Kalan Madde
- STEP-404 (`kill-switchleri aktif et`) store/prod ortam erisimi gerektirir; konsol uygulama adiminda kapanir.
