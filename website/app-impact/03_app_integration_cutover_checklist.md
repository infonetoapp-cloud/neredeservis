# App Integration Cutover Checklist (Web + App Alignment)

Tarih: 2026-02-24
Durum: Cutover oncesi checklist (taslak)

## 1. Ne Icin?

Web MVP tamamlanirken app tarafinda uygulanmasi gereken degisikliklerin
atlanmamasi icin son kontrol listesi.

## 2. Kapanis Kriterleri (taslak)

- [ ] `00_web_to_app_change_register.md` icindeki `P0` kayitlar triaged/planned
- [ ] `contract` kategorisindeki kayitlar icin app error mapping karari net
- [ ] force update / `426` fallback davranisi app tarafinda tanimli
- [ ] live ops stale/offline semantigi app + web tutarli
- [ ] route/trip mutasyon lock reason code'lari app tarafinda ele aliniyor
- [ ] cutover oncesi app regression smoke checklist hazir
- [ ] "wont_do_mvp" kararlar reviewer/plan notlarinda acik

## 3. Kirmizi Bayraklar (cutover durdurur)

- `P0` kayitlarin sahibi/kapsami belirsiz
- force update fallback davranisi tanimsiz
- app server reason code'lari genel hataya dusuyor
- live ops status semantigi (stale/offline/access) karisik

