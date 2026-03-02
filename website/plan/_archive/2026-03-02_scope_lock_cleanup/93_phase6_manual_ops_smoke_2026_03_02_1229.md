# Faz 6 Manual Ops Smoke Report

Tarih: 2026-03-02 12:29:46
Durum: PASS

| Scope | Check | Status | Detail |
| --- | --- | --- | --- |
| PROD | login page reachable | PASS | HTTP=200; note=- |
| PROD | giris page reachable | PASS | HTTP=308; location=/login; note=- |
| PROD | env badge match | PASS | expected=PROD; actual=UNKNOWN; hostFallback=PROD |
| PROD | routes surface reachable | PASS | HTTP=200; note=- |
| PROD | live ops surface reachable | PASS | HTTP=200; note=- |
| PROD | admin surface reachable | PASS | HTTP=200; note=- |
| PROD | token route preview endpoint reachable | PASS | HTTP=200; note=- |
| PROD | iletisim page reachable | PASS | HTTP=200; note=- |

Not:
- Bu script surface-level probe kaniti uretir; route/stop CRUD, live triage ve audit mutasyon kabul adimlari yine manuel pilot tenant ile tamamlanmalidir.
- Detayli acceptance adimlari: website/plan/91_phase6_pilot_acceptance_checklist_2026_02_27.md
