# Faz 5 Local Gate Run Report

Tarih: 2026-02-27 14:30:38
Durum: PASS
Port: 3200

| Step | Status | Details |
| --- | --- | --- |
| web lint | PASS | ok |
| web build | PASS | ok |
| functions lint | PASS | ok |
| functions build | PASS | ok |
| rules tests (emulators:exec) | PASS | ok |
| route smoke /login | PASS | 200 |
| route smoke /drivers | PASS | 200 |
| route smoke /routes | PASS | 200 |
| route smoke /vehicles | PASS | 200 |
| route smoke /live-ops | PASS | 200 |
| route smoke /admin | PASS | 200 |
| web route smoke summary | PASS | all critical routes are 200 |

Not:
- Bu rapor script tarafindan otomatik uretilmistir.
- Manual STG/PROD kontrolleri yine release runbook checklistine gore ayrica yapilmalidir.
