# P0 Endpoint Implementation Order Freeze (Faz 1 -> Faz 2)

Tarih: 2026-02-24
Durum: V1 freeze candidate

## 1. Amac

`42_p0_endpoint_contracts_v1_draft.md` icindeki endpointleri "hepsi bir anda" degil, implementasyon sirasina koymak.

Bu dokuman:
- kodlama baslangicinda odagi korur
- bagimlilik sirasini netlestirir
- sprint planini kolaylastirir

## 2. Prensip

Siralama kurali:
1. auth bootstrap ve context cozumleme
2. tenant / membership temel CRUD
3. dashboard icin gereken read modelleri
4. core operation CRUD (vehicle / route / stop)
5. route permission / assignment
6. live ops read/projection
7. audit list/read

## 3. Faz 1 Endpoint Freeze (kod baslangici icin ilk set)

Faz 1 hedefi:
- login sonrası web shell calissin
- kullanici mode/company secsin
- dashboard shell veri cekebilsin
- temel listeler gorunsun

### 3.1 Auth + Session Bootstrap (P0-F1)

1. `getWebSessionBootstrap`
- user profile
- available modes
- memberships
- default redirect target

2. `selectActiveCompanyContext` (opsiyonel; session preference yazimi)
- multi-company kullanicilarda aktif firma tercihi

### 3.2 Company + Membership (P0-F1)

3. `createCompany`
4. `listMyCompanies`
5. `getCompanyDetail`
6. `listCompanyMembers`
7. `inviteCompanyMember`

Not:
- `changeCompanyMemberRole` Faz 1 sonu / Faz 2 basi olabilir

### 3.3 Dashboard Shell Reads (P0-F1)

8. `getCompanyDashboardSummary`
9. `getIndividualDashboardSummary`

Bu endpointler MVP'de projection/read-model olabilir.

## 4. Faz 2 Endpoint Freeze (core operation)

Faz 2 hedefi:
- arac/rota/durak yonetimi
- firma operasyonunun temel isleri

### 4.1 Vehicles

10. `listVehicles`
11. `createVehicle`
12. `updateVehicle`
13. `archiveVehicle`

### 4.2 Routes

14. `listRoutes`
15. `createRoute`
16. `updateRoute`
17. `archiveRoute`
18. `getRouteDetail`

### 4.3 Stops

19. `upsertRouteStop`
20. `deleteRouteStop`
21. `reorderRouteStops`

## 5. Faz 2.5 Endpoint Freeze (permission + assignment)

Bu set, firma bagli sofor senaryosunu guclendirir.

22. `grantDriverRoutePermissions`
23. `revokeDriverRoutePermissions`
24. `listRouteDriverPermissions`
25. `assignVehicleToRoute` (veya sefer bazli assignment endpointi)

## 6. Faz 3 Endpoint Freeze (live ops + audit)

### 6.1 Live Ops

26. `getLiveOpsActiveTrips`
27. `getLiveOpsFleetSnapshot`
28. `getRouteLiveOpsProjection`

Not:
- RTDB stream ile birlikte hibrit model calisir
- projection endpointler panel performansini stabil tutar

### 6.2 Audit

29. `listAuditEvents`
30. `getAuditEventDetail` (opsiyonel; Faz 3 sonu)

## 7. Kesin Kodlama Sirasi (ilk 8 endpoint)

Kod baslangicinda su sirayi oneriyorum:
1. `getWebSessionBootstrap`
2. `listMyCompanies`
3. `getCompanyDetail`
4. `listCompanyMembers`
5. `getCompanyDashboardSummary`
6. `getIndividualDashboardSummary`
7. `createCompany`
8. `inviteCompanyMember`

Neden:
- shell + authz + context akisini erken dogrular
- UI shell kodu hemen test edilebilir
- daha riskli operasyon endpointlerine gecmeden temel tenant modeli oturur

## 8. Freeze Kurali

Kurallar:
- Bu siralama Faz 1-2'de "gerekmedikce" bozulmaz
- Yeni endpoint eklenirse `20_decision_log_and_open_questions.md` veya ilgili ADR'de gerekce yazilir
- Contract degisikligi `42_*` dokumaninda izlenir

## 9. Referanslar

- `13_api_endpoint_backlog.md`
- `21_live_ops_read_model_adr.md`
- `42_p0_endpoint_contracts_v1_draft.md`

