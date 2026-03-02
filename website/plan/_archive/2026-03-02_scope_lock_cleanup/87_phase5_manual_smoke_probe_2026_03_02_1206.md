# Faz 5 Manual Smoke Probe Report

Tarih: 2026-03-02 12:06:33
Durum: PARTIAL

| Scope | Check | Status | Detail |
| --- | --- | --- | --- |
| PROD | login page reachable | PASS | HTTP=200; note=- |
| PROD | giris page reachable | PASS | HTTP=308; location=/login; note=- |
| PROD | env badge match | FAIL | expected=PROD; actual=UNKNOWN |
| PROD | google login ui visible | FAIL | Google text not detected in HTML |
| PROD | anonymous guard dashboard->login | PASS | HTTP=200; location=-; mode=client_guard_shell |
| PROD | public route preview endpoint reachable | PASS | HTTP=200; note=- |
| PROD | gizlilik page reachable | PASS | HTTP=200; note=- |

Not:
- Bu script manuel closeout checklistini tam otomatik kapatmaz; yalniz STG/PROD login-guard-env gorunurlugu icin hizli probe kaniti uretir.
- CRUD mutasyon smoke, live stream davranisi, audit triage ve CORS/cost/monitoring adimlari manuel olarak tamamlanmalidir.
