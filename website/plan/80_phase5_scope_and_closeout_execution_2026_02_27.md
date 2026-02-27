# Faz 5 Scope Lock + Closeout Execution (2026-02-27)

Tarih: 2026-02-27  
Durum: Closed (engineering closeout completed)

## 1) Scope Lock (Acil Kural)

Faz 5 kapanisina kadar aktif implementasyon kapsamı:

- `website/**`
- `functions/**`

Bu sprintte kapsam disi (degistirilmeyecek):

- `lib/**`
- `android/**`
- `ios/**`
- diger mobil odakli app katmanlari

Amac:

- web release gate kapanisini mobil churn'den izole etmek
- CI/build hatalarinda etki alanini daraltmak
- Faz 5 -> Faz 6 gecisini daha guvenli yapmak

## 2) Gate Validation Kanitlari

Calistirilan komutlar ve durum:

1. Web lint  
`npm run lint` (`website/apps/web`) -> **PASS**
2. Web build  
`npm run build` (`website/apps/web`) -> **PASS**
3. Functions lint  
`npm run lint` (`functions`) -> **PASS**
4. Functions build  
`npm run build` (`functions`) -> **PASS**
5. Rules tests (emulator yokken)  
`npm run test:rules:unit` (`functions`) -> **EXPECTED_FAIL** (emulator baglantisi yok, bloklayici degil)
6. Rules tests (emulator ile)  
`npx firebase emulators:exec --only firestore,database "npm run test:rules:unit"` -> **PASS**
   - 34 testten 34 PASS
7. Local route smoke (web)
`npm run dev -- --port 3200` altinda `/login`, `/drivers`, `/routes`, `/vehicles`, `/live-ops`, `/admin` -> **200/200**
8. Faz 5 local gate otomasyonu
`npm run gate:local` (`website/apps/web`) -> **PASS**
   - Kanit: `website/plan/82_phase5_local_gate_run_2026_02_27_1430.md`
9. Vercel env audit otomasyonu
`npm run audit:vercel-env` (`website/apps/web`) -> **PASS**
   - Kanit: `website/plan/83_vercel_env_audit_2026_02_27_1431.md`
10. Domain probe otomasyonu
`npm run probe:domains` (`website/apps/web`) -> **PASS**
   - Kanit: `website/plan/84_domain_probe_2026_02_27_1432.md`
11. Faz 5 readiness orchestration otomasyonu
`npm run readiness:phase5` (`website/apps/web`) -> **PASS**
   - Kanit: `website/plan/85_phase5_release_readiness_2026_02_27_1430.md`
12. Faz 5 manual smoke probe otomasyonu
`npm run smoke:manual:phase5` (`website/apps/web`) -> **PASS**
   - Kanit: `website/plan/87_phase5_manual_smoke_probe_2026_02_27_1548.md`
13. Faz 5 redeploy+verify otomasyonu
`npm run redeploy:phase5:wait-retry` (`website/apps/web`) -> **PASS**
   - Kanit: `website/plan/88_phase5_redeploy_and_verify_2026_02_27_1512.md`
## 3) Faz 5 Teknik Blokaj Durumu

Teknik blokaj (cozuldu):

- `rules-tests/callable_integration.test.mjs` icindeki `STEP-289` assertion mismatch cozuldu.
- Kök neden: `joinRouteBySrvCode` rate-limit env degerleri modül yuklenirken sabitleniyordu; testteki runtime env override callable tarafina yansimiyordu.
- Duzeltme: `joinRouteBySrvCode` icinde `readJoinRouteRateWindowMs` + `readJoinRouteRateMaxCalls` runtime okunur hale getirildi.
- Ek duzeltme: canonical share domain refactor'u sonrasi `STEP-287 generateRouteShareLink` test beklentisi yeni varsayilan hosta (`https://app.neredeservis.app/r`) guncellendi.

Guncel sonuc:

- Emulatorlu rules test kosusunda **34/34 PASS**
- Teknik blokaj kalmadi.
- Local route smoke (6 kritik sayfa) **PASS**
- Tek komut local gate otomasyonu **PASS** (`npm run gate:local`)
- Vercel env key presence audit **PASS** (`npm run audit:vercel-env`)
- Domain/canonical probe **PASS** (apex+www redirect, app domain login 200/PROD, stg-app login 200/STG)
- Manual smoke probe **PASS** (PROD+STG login/env-badge/google/guard)
- Prod redeploy **PASS**; `app.neredeservis.app` env badge `PROD` olarak dogrulandi (87/88 raporlari)
- STG DNS/SSL blokaji kapandi; `stg-app` kaydi + alias duzeltmesi sonrasi STG smoke PASS
- STG domain health otomasyonu **PASS**: `npm run check:stg-domain:phase5` (kanit: `website/plan/89_phase5_stg_domain_dns_check_2026_02_27_1548.md`)

## 4) Phase 6'ya Devreden Maddeler

1. Route/stop tam CRUD acceptance smoke (pilot tenant dataset).
2. Live ops stream/triage acceptance smoke (pilot tenant dataset).
3. Audit log acceptance smoke.
4. Prod CORS/cost/monitoring/Firebase mapping final kontrolleri.
5. Pilot onboarding checklist ve ilk tenant runbook adimlari.
