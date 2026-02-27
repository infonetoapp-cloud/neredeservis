# FAZ H Haftalik Maliyet Raporu Otomasyonu (STEP-410)

Tarih: 2026-02-20  
Durum: Tamamlandi  
Etiket: codex

## Script
- `scripts/generate_weekly_cost_report.ps1`

## Girdi Modelleri
1. Dogrudan parametre:
   - `-WeekLabel`
   - `-Mau`
   - `-DirectionsRequests`
   - `-MapMatchingRequests`
   - `-DirectionsMonthlyCap`
   - `-MapMatchingMonthlyCap`
2. JSON dosyasi:
   - `-MetricsFile <path>`
   - Desteklenen alanlar:
     - `weekLabel`
     - `mau`
     - `directionsRequests`
     - `mapMatchingRequests`
     - `directionsMonthlyCap`
     - `mapMatchingMonthlyCap`

## Cikti
- `tmp/cost_reports/<weekLabel>/weekly_cost_report.md`
- `tmp/cost_reports/<weekLabel>/weekly_cost_report.json`

## Ornek Calistirma
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\generate_weekly_cost_report.ps1 `
  -WeekLabel 2026-W08 `
  -Mau 1200 `
  -DirectionsRequests 0 `
  -MapMatchingRequests 420 `
  -DirectionsMonthlyCap 0 `
  -MapMatchingMonthlyCap 5000
```
