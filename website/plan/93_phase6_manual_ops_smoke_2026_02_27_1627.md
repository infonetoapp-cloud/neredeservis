# Faz 6 Manual Ops Smoke Report

Tarih: 2026-02-27 16:27:18
Durum: PASS

| Scope | Check | Status | Detail |
| --- | --- | --- | --- |
| PROD | login page reachable | PASS | HTTP=200; note=- |
| PROD | env badge match | PASS | expected=PROD; actual=PROD |
| PROD | routes surface reachable | PASS | HTTP=200; note=- |
| PROD | live ops surface reachable | PASS | HTTP=200; note=- |
| PROD | admin surface reachable | PASS | HTTP=200; note=- |
| PROD | token route preview endpoint reachable | PASS | HTTP=404; note=HTTP redirect/error response |
| STG | login page reachable | PASS | HTTP=200; note=- |
| STG | env badge match | PASS | expected=STG; actual=STG |
| STG | routes surface reachable | PASS | HTTP=200; note=- |
| STG | live ops surface reachable | PASS | HTTP=200; note=- |
| STG | admin surface reachable | PASS | HTTP=200; note=- |
| STG | token route preview endpoint reachable | PASS | HTTP=200; note=- |

Not:
- Bu script surface-level probe kaniti uretir; route/stop CRUD, live triage ve audit mutasyon kabul adimlari yine manuel pilot tenant ile tamamlanmalidir.
- Detayli acceptance adimlari: website/plan/91_phase6_pilot_acceptance_checklist_2026_02_27.md
