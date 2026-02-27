# Faz 5 Manual Smoke Probe Report

Tarih: 2026-02-27 14:42:37
Durum: PARTIAL

| Scope | Check | Status | Detail |
| --- | --- | --- | --- |
| PROD | login page reachable | PASS | HTTP=200; note=- |
| PROD | env badge match | FAIL | expected=PROD; actual=DEV |
| PROD | google login ui visible | PASS | Google text detected |
| PROD | anonymous guard dashboard->login | FAIL | HTTP=200; location=- |
| PROD | public route preview endpoint reachable | FAIL | HTTP=404; note=HTTP redirect/error response |
| STG | login page reachable | FAIL | HTTP=525; note=HTTP redirect/error response |
| STG | env badge match | FAIL | expected=STG; actual=UNKNOWN |
| STG | google login ui visible | FAIL | Google text not detected in HTML |
| STG | anonymous guard dashboard->login | FAIL | HTTP=525; location=- |
| STG | public route preview endpoint reachable | FAIL | HTTP=525; note=HTTP redirect/error response |

Not:
- Bu script manuel closeout checklistini tam otomatik kapatmaz; yalniz STG/PROD login-guard-env gorunurlugu icin hizli probe kaniti uretir.
- CRUD mutasyon smoke, live stream davranisi, audit triage ve CORS/cost/monitoring adimlari manuel olarak tamamlanmalidir.
