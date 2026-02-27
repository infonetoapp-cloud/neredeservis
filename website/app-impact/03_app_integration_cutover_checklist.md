# App Integration Cutover Checklist (Web + App Alignment)

Tarih: 2026-02-24
Durum: Cutover oncesi checklist (taslak)

## 1. Ne Icin?

Web MVP tamamlanirken app tarafinda uygulanmasi gereken degisikliklerin
atlanmamasi icin son kontrol listesi.

## 2. Kapanis Kriterleri (taslak)

- [x] `00_web_to_app_change_register.md` icindeki `P0` kayitlar triaged/planned
- [x] `contract` kategorisindeki kayitlar icin app error mapping karari net
- [x] force update / `426` fallback davranisi app tarafinda tanimli (`website/app-impact/19_app_runtime_behavior_alignment_contract_2026_02_27.md`)
- [x] live ops stale/offline semantigi app + web tutarli (`website/app-impact/19_app_runtime_behavior_alignment_contract_2026_02_27.md`)
- [x] route/trip mutasyon lock reason code'lari app tarafinda ele aliniyor (`website/app-impact/19_app_runtime_behavior_alignment_contract_2026_02_27.md`)
- [x] cutover oncesi app regression smoke checklist hazir (`website/app-impact/13_app_regression_smoke_checklist_phase9.md`)
- [x] "wont_do_mvp" kararlar reviewer/plan notlarinda acik

## 3. Kirmizi Bayraklar (cutover durdurur)

- `P0` kayitlarin sahibi/kapsami belirsiz
- force update fallback davranisi tanimsiz
- app server reason code'lari genel hataya dusuyor
- live ops status semantigi (stale/offline/access) karisik
