# Faz 5 Manual Smoke Probe Report

Tarih: 2026-03-02 12:29:20
Durum: PASS

| Scope | Check | Status | Detail |
| --- | --- | --- | --- |
| PROD | login page reachable | PASS | HTTP=200; note=- |
| PROD | giris page reachable | PASS | HTTP=308; location=/login; note=- |
| PROD | env badge match | PASS | expected=PROD; actual=UNKNOWN; hostFallback=PROD |
| PROD | google login ui visible | PASS | Google login signal detected in chunk: /_next/static/chunks/4584-0e039645f37d4101.js |
| PROD | anonymous guard dashboard->login | PASS | HTTP=200; location=-; mode=client_guard_shell |
| PROD | public route preview endpoint reachable | PASS | HTTP=200; note=- |
| PROD | gizlilik page reachable | PASS | HTTP=200; note=- |

Not:
- Bu script manuel closeout checklistini tam otomatik kapatmaz; yalniz STG/PROD login-guard-env gorunurlugu icin hizli probe kaniti uretir.
- CRUD mutasyon smoke, live stream davranisi, audit triage ve CORS/cost/monitoring adimlari manuel olarak tamamlanmalidir.
