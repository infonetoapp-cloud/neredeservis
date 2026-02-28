# Phase 3 Agent Kickoff Prompts

Tarih: 2026-02-25  
Durum: Ready

Bu promptlar her agent chatine dogrudan yapistirilir.

## A1 - Contract and RBAC Owner

```text
Rolun: A1 Contract and RBAC Owner.

Scope:
- functions/src/common/**
- firestore.rules
- database.rules.json
- website/app-impact/04_api_contract_diff_register.md

Kesin yasak:
- web UI dosyalari
- functions/src/callables/**

Gorev (Phase 3 Slice 1):
1) RBAC policy edge-case listesini cikar.
2) input/output contract dosyalarinda gerekli minimal netlestirmeyi yap.
3) rules tarafinda tenant isolation + role guard parity kontrolu yap.
4) Degisiklikleri kucuk PR olarak hazirla.

Done:
- lint/build/file-size gecer
- contract drift yok
- app-impact kontrol sorusu cevaplandi
```

## A2 - Web Dashboard UI/UX

```text
Rolun: A2 Web Dashboard UI/UX.

Scope:
- website/apps/web/src/app/(dashboard)/**
- website/apps/web/src/components/dashboard/**
- website/apps/web/src/features/**
- website/apps/web/src/lib/** (contract disi)

Kesin yasak:
- functions/**
- firestore.rules, database.rules.json

Gorev (Phase 3 Slice 1):
1) Drivers/Routes/Vehicles ekranlarinda role ve member lifecycle UX hardening yap.
2) Hata/uyari copy semantigini netlestir.
3) Query deep-link parity ve empty/error state tutarliligini kontrol et.

Done:
- npm run lint + npm run build gecer
- UI davranisi bozulmaz
- app-impact kontrol sorusu cevaplanir
```

## A3 - Functions Business Endpoints

```text
Rolun: A3 Functions Business Endpoints.

Scope:
- functions/src/callables/**
- functions/src/common/** (contract disi helper)
- functions/src/index.ts (yalniz export/wiring)

Kesin yasak:
- contract dosyalari (A1 lock)
- web UI dosyalari

Gorev (Phase 3 Slice 1):
1) Member invite/update/remove endpoint guardlarini sertlestir.
2) Route permission mutation endpointlerinde actor/target guard parity tamamla.
3) Endpoint hata kodu ve message semantigini A1 contracti ile hizala.

Done:
- npm run lint + npm run build + npm run check:file-size gecer
- endpoint davranisi deterministic
- app-impact kontrol sorusu cevaplanir
```

## A4 - Live Ops and RTDB

```text
Rolun: A4 Live Ops and RTDB.

Scope:
- website/apps/web/src/components/dashboard/live-ops*
- website/apps/web/src/components/dashboard/use-live-ops*
- functions/src/callables/*live*
- functions/src/common/*live*

Kesin yasak:
- contract dosyalari (A1 lock)
- admin/docs dosyalari

Gorev (Phase 3 Slice 1):
1) Live ops role visibility guard ve denied-state UX netlestir.
2) RTDB stream fallback semantigini (trip mismatch, stale, offline) regress etmeden koru.
3) Query/selection parity bozulmalarini temizle.

Done:
- web lint/build gecer
- functions lint/build/file-size (dokunulan yerde) gecer
- app-impact kontrol sorusu cevaplanir
```

## A5 - QA/CI/Automation

```text
Rolun: A5 QA/CI/Automation.

Scope:
- .github/workflows/**
- website/apps/web/package.json
- functions/package.json
- website/plan/18_quality_gates_and_definition_of_done.md

Kesin yasak:
- product logic dosyalari
- contract dosyalari

Gorev (Phase 3 Slice 1):
1) required checks stabil calisiyor mu denetle.
2) docs-only ve scope-disi degisikliklerde gereksiz job calismasini engelle.
3) phase3 smoke checklistini netlestir.

Done:
- CI kirmizi kalmaz
- required checks tutarli
- gate dokumani guncel
```

## A6 - Admin Surface and Docs Sync

```text
Rolun: A6 Admin Surface and Docs Sync.

Scope:
- website/apps/web/src/app/(dashboard)/admin/**
- website/apps/web/src/components/admin/**
- website/plan/**
- website/app-impact/**

Kesin yasak:
- contract/rules dosyalari (A1 lock)
- functions business logic

Gorev (Phase 3 Slice 1):
1) /admin shell v1 route + guard + empty states olustur.
2) phase dokumanlari ve app-impact kayitlarini guncel tut.
3) merge queue ve daily sync board kayitlarini duzenli guncelle.

Done:
- web lint/build gecer
- docs plan ile kod ayni resmi yansitir
- app-impact kayitlari eksiksiz
```

