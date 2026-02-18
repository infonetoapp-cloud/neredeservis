# NeredeServis Error Catalog (STEP-295)

Tarih: 2026-02-18  
Durum: Active

## 1) Canonical Error Codes

| Canonical Code | Ne Zaman Doner | Retry | Not |
|---|---|---|---|
| `INVALID_ARGUMENT` | Input schema/validation fail | Hayir | Payload duzeltilmeden tekrar denenmez. |
| `UNAUTHENTICATED` | Auth yok/gecersiz token | Hayir | Kullanici yeniden giris yapmalidir. |
| `PERMISSION_DENIED` | Role/policy/token scope ihlali | Hayir | Yetki veya policy degismeden tekrar denenmez. |
| `NOT_FOUND` | Hedef dokuman/route/trip bulunamadi | Duruma bagli | Yanlis id/srvCode ise retry anlamsizdir. |
| `FAILED_PRECONDITION` | Sistem state kosulu saglanmadi | Duruma bagli | State duzeldikten sonra retry olabilir. |
| `RESOURCE_EXHAUSTED` | Rate limit / budget limiti asildi | Evet (backoff) | Cooldown sonrasi retry edilir. |
| `DEADLINE_EXCEEDED` | Upstream timeout | Evet (backoff) | Ozellikle directions/map matching akislari. |
| `UNAVAILABLE` | Upstream/service gecici ulasilamaz | Evet (backoff) | Gecici servis kesintisi. |
| `INTERNAL` | Beklenmeyen server hatasi | Evet (sinirli) | Telemetry + incident incelemesi gerekir. |

## 2) Domain-Specific Error Tags

Bu etiketler `message` alaninda veya domain-level kodlarda gorunur; canonical code ile birlikte yorumlanir.

| Domain Tag | Canonical Code | Kaynak |
|---|---|---|
| `TRANSITION_VERSION_MISMATCH` | `FAILED_PRECONDITION` | `startTrip`, `finishTrip` optimistic lock |
| `ROUTE_PREVIEW_TOKEN_INVALID` | `PERMISSION_DENIED` | `getDynamicRoutePreview` |
| `ROUTE_PREVIEW_TOKEN_SCOPE_MISMATCH` | `PERMISSION_DENIED` | `getDynamicRoutePreview` |
| `ROUTE_PREVIEW_TOKEN_EXPIRED` | `PERMISSION_DENIED` | `getDynamicRoutePreview` |
| `ROUTE_PREVIEW_TOKEN_INVALID_SIGNATURE` | `PERMISSION_DENIED` | `getDynamicRoutePreview` |
| `ROUTE_PREVIEW_SIGNING_SECRET_MISSING` | `FAILED_PRECONDITION` | `generateRouteShareLink`, `getDynamicRoutePreview` |
| `MAPBOX_DIRECTIONS_DISABLED` | `FAILED_PRECONDITION` | `mapboxDirectionsProxy` |
| `MAPBOX_DIRECTIONS_TIMEOUT` | `DEADLINE_EXCEEDED` | `mapboxDirectionsProxy` |
| `MAPBOX_DIRECTIONS_UPSTREAM_FAILED` | `UNAVAILABLE` | `mapboxDirectionsProxy` |
| `SRVCODE_COLLISION_LIMIT` | `RESOURCE_EXHAUSTED` | `createRoute` srvCode uretimi |

## 3) KVKK Delete Flow Notes

- `deleteUserData` aktif/trial abonelikte hard error firlatmaz; response-level block dondurur:
  - `status=blocked_subscription`
  - `interceptorMessage=Hesabi silmek odemeyi durdurmaz, once store aboneligini iptal et.`
  - `manageSubscriptionLabel=Manage Subscription`
- Bu davranis policy-gated bir is akisi oldugu icin hata kodu yerine kontrollu response modeli kullanir.

## 4) Client Mapping Rule

- Client tarafinda ilk kaynak canonical code olmalidir.
- Domain tag gorulurse ekran metni daha spesifiklestirilir.
- Bilinmeyen hata durumunda fallback:
  - code: `UNKNOWN`
  - generic mesaj + support report CTA.
