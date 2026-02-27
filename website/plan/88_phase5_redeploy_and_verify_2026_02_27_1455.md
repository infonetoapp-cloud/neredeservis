# Faz 5 Redeploy And Verify Report

Tarih: 2026-02-27 14:55:01

| Step | Status | Note |
| --- | --- | --- |
| production redeploy | BLOCKED | Vercel free daily deploy limit |
| prod smoke probe (skip stg) | PARTIAL | see linked smoke report |

## Linked Smoke Report
- website/plan/87_phase5_manual_smoke_probe_2026_02_27_1455.md

## Redeploy Raw Output (first 40 lines)
- Fetching deployment "nsv-web-dev.vercel.app" in infonetoapp-clouds-projects???
- > Fetching deployment "nsv-web-dev.vercel.app" in infonetoapp-clouds-projects???
- Redeploying project dpl_7BvbWei5QM8MFbNkQwFzc71pPrHH
- Error: Resource is limited - try again in 14 minutes (more than 100, code: "api-deployments-free-per-day"). (402)
