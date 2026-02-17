# NeredeServis Feature Flags (Single Source)

## Source
- Firebase Remote Config
- Runtime cache: app launch + periodic refresh

## Flags
| Key | Type | Default (prod) | Notes |
|---|---|---|---|
| `tracking_enabled` | bool | `true` | Driver live publish master kill switch |
| `announcement_enabled` | bool | `true` | Driver announcement and push bridge |
| `guest_tracking_enabled` | bool | `true` | Guest read access control |
| `force_update_min_version` | string | `\"0.0.0\"` | Semver string gate |
| `directions_enabled` | bool | `false` | Cost guard for Directions API |
| `map_matching_enabled` | bool | `true` | Ghost Drive post-process toggle |

## Numeric Tunables (Remote Config)
| Key | Type | Default (prod) | Notes |
|---|---|---|---|
| `kalman_process_noise` | double | `0.01` | Marker smoothing process noise |
| `kalman_measurement_noise` | double | `3.0` | Marker smoothing measurement noise |
| `kalman_update_interval_ms` | number | `1000` | Kalman update interval |
| `mapbox_monthly_directions_cap` | number | `0` | V1.0 cost shield, 0=paid path kapali |
| `mapbox_monthly_map_matching_cap` | number | `5000` | Ghost Drive post-process monthly cap |
| `mapbox_tile_cache_mb` | number | `256` | Tile cache upper bound |
| `mapbox_style_preload_enabled` | bool | `true` | Style pack preload on app start |

## Environment Policy
- `dev`: canary values allowed
- `staging`: prod-like, short-lived experiments allowed
- `prod`: only approved keys and defaults

## Release Rules
- New flag eklemeden once:
  - technical plan update
  - runbook update
  - rollback behavior documented
- Flag silme:
  - rollout + clean-up ticket zorunlu
