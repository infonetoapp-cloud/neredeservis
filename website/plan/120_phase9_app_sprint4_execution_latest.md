# Phase 9 APP-SPRINT-4 Execution Runbook

Generated At: 2026-02-28 01:47:13
Source: website/app-impact/12_phase9_app_sprint_packages_latest.json
Package: APP-SPRINT-4

## Scope
- W2A: W2A-001, W2A-002, W2A-003, W2A-004
- Open Items: 0/12
- Goal: Acceptance smoke + cutover checklist closure.

## Step-by-Step
1. Parser crash-free smoke testini tum callable seti icin kos.
2. Error-code mapping smoke testini zorunlu kod seti icin kos.
3. Company recoverability + route/stop conflict + live fallback senaryolarini dogrula.
4. `03_app_integration_cutover_checklist.md` acik maddelerini tek tek kapat.
5. Smoke template sonucunu `pass|fail|blocked` olarak doldur ve bloklari raporla.

## Tasks
- [x] Parser crash-free smoke (all listed callables)
- [x] Error message mapping smoke (all listed codes)
- [x] Company context recoverability (logout/login + mode switch)
- [x] Route/stop conflict recovery (token mismatch -> reload -> retry)
- [x] Live ops fallback correctness (RTDB yoksa trip_doc, stale semantigi korunur)
- [x] `00_web_to_app_change_register.md` icindeki `P0` kayitlar triaged/planned
- [x] `contract` kategorisindeki kayitlar icin app error mapping karari net
- [x] force update / `426` fallback davranisi app tarafinda tanimli (`website/app-impact/19_app_runtime_behavior_alignment_contract_2026_02_27.md`)
- [x] live ops stale/offline semantigi app + web tutarli (`website/app-impact/19_app_runtime_behavior_alignment_contract_2026_02_27.md`)
- [x] route/trip mutasyon lock reason code'lari app tarafinda ele aliniyor (`website/app-impact/19_app_runtime_behavior_alignment_contract_2026_02_27.md`)
- [x] cutover oncesi app regression smoke checklist hazir (`website/app-impact/13_app_regression_smoke_checklist_phase9.md`)
- [x] "wont_do_mvp" kararlar reviewer/plan notlarinda acik

## Acceptance
- Parser crash-free smoke tum listedeki callable setinde PASS.
- Error mapping smoke listedeki tum zorunlu reason-code'larda PASS.
- 03 app integration cutover checklist maddeleri eksiksiz kapali.

## Smoke Evidence Protocol
- Evidence file: `website/app-impact/17_phase9_app_sprint4_smoke_template_latest.json`
- Her test satirinda `pass|fail|blocked` ve kisa not zorunlu.
- Block durumunda endpoint + code + sample payload eklenmeli.
