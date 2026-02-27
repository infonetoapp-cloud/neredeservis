# Block A Contract Alignment Matrix (W2A-001..017)

Tarih: 2026-02-27  
Durum: Active (app parity icin kaynak matrix)

## 1) Amac

Blok A cutover kalemleri icin:
- web tarafinda ne kadarinin gercekten tamamlandigini,
- app tarafinda neyin parser/mapping olarak hala bekledigini,
- hangi kontrat dokumanina bagli oldugunu
tek yerde gostermek.

## 2) Matrix

| W2A | Kapsam | Kontrat Kaynagi | Web Durumu | App Durumu |
| --- | --- | --- | --- | --- |
| W2A-001 | Force update + 426 cutoff | `API-DIFF-001`, `plan/58_*`, `plan/71_*` | done (web error-map + user-facing copy hazir) | done (hard-block update route + min-version gate runtime) |
| W2A-002 | Live ops offline/stale/drift | `API-DIFF-016`, `plan/59_*`, `plan/72_*` | done | done (live state/source mapper + stream state smoke PASS) |
| W2A-003 | Route soft-lock/conflict | `API-DIFF-011..015`, `plan/42_*`, `plan/62_*` | done | done (reasonCode copy mapping + conflict recovery smoke PASS) |
| W2A-004 | Company context resolver | `API-DIFF-004`, `plan/08_*`, `plan/54_*` | done | done (active company resolver + relogin/mode smoke PASS) |
| W2A-006 | createCompany/listMyCompanies | `API-DIFF-003..004` | done (runtime guard) | done (typed parser + callable client) |
| W2A-007 | listCompanyMembers | `API-DIFF-005` | done (runtime guard) | done (typed parser + callable client) |
| W2A-008 | listCompanyRoutes | `API-DIFF-006` | done (runtime guard) | done (typed parser + callable client) |
| W2A-009 | listCompanyVehicles | `API-DIFF-007` | done (runtime guard) | done (typed parser + callable client) |
| W2A-010 | create/updateVehicle | `API-DIFF-008..009` | done (runtime guard) | done (typed parser + callable client) |
| W2A-011 | createCompanyRoute | `API-DIFF-010` | done (runtime guard) | done (typed parser + callable client) |
| W2A-012 | updateCompanyRoute + token | `API-DIFF-011` | done (runtime guard) | done (parser + lastKnownUpdateToken propagation) |
| W2A-013 | upsertCompanyRouteStop | `API-DIFF-013` | done (runtime guard) | done (typed parser + company-scoped mutation path) |
| W2A-014 | deleteCompanyRouteStop | `API-DIFF-014` | done (runtime guard) | done (typed parser + company-scoped mutation path) |
| W2A-015 | reorderCompanyRouteStops | `API-DIFF-015` | done (runtime guard) | done (typed parser + callable client) |
| W2A-016 | listActiveTripsByCompany | `API-DIFF-016` | done (runtime guard) | done (typed parser + callable client) |
| W2A-017 | RTDB stream overlay/fallback | `plan/59_*`, `plan/72_*` | done | done (RTDB stream state mapper + fallback smoke PASS) |

## 3) Hemen Uygulanacak App Parser Paketleri

1. Company context parser paketi: `W2A-004, 006, 007`
2. Route/stop parser paketi: `W2A-008, 011, 012, 013, 014, 015`
3. Vehicle parser paketi: `W2A-009, 010`
4. Live ops parser paketi: `W2A-002, 016, 017`
5. Error code/copy paketi: `W2A-001, 003`

## 4) Not

- Bu matrix yeni endpoint uretmez; sadece app cutover icin kontrat takip kaynagidir.
- App tarafinda her paket kapandiginda `00_web_to_app_change_register.md` ilgili W2A status'u guncellenir.
- W2A-001 closure notu: startup min-version gate `MIN_REQUIRED_APP_VERSION` degiskeni ile calisir; ortamlarda bu degiskenin tanimli olmasi zorunludur.
