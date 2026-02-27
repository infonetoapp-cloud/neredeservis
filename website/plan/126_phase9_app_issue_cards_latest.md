# Faz 9 App Issue Cards

Tarih: 2026-02-27 22:11:44
Durum: PASS

## Ozet
- Toplam acik item: 41
- Toplam batch: 11
- Kart sayisi: 6

## APP-ISSUE-01 - [Phase9][APP-SPRINT-1] BATCH-1 parser/mapping closure
- Oncelik: P0
- Kaynak batch: BATCH-1
- Kapsam: 4 item

### Amac
- Bu karttaki parser/mapping itemlarini app tarafinda kapatmak.

### Yapilacaklar
- [ ] `createCompany` response parser (`companyId`, `ownerMember`, `createdAt`)
- [ ] `createCompanyRoute` parser (`routeId`, `srvCode`)
- [ ] `createVehicle` parser
- [ ] `listCompanyMembers` parser (`uid`, `role`, `memberStatus`, `displayName/email/phone`)

### Done Kriterleri
1. Ilgili parser/mapping kodu app tarafinda uygulanmis olmali.
2. website/app-impact/07_app_parser_mapping_checklist_2026_02_27.md icinde bu maddeler [x] olmali.
3. Smoke sonucu raporlanmali (PASS/FAIL + kanit).

### Rapor Formati
- Degisen dosyalar: ...
- Test komutlari: ...
- Kalan aciklar: ...
- Risk notu: ...

## APP-ISSUE-02 - [Phase9][APP-SPRINT-1] BATCH-2 parser/mapping closure
- Oncelik: P0
- Kaynak batch: BATCH-2
- Kapsam: 4 item

### Amac
- Bu karttaki parser/mapping itemlarini app tarafinda kapatmak.

### Yapilacaklar
- [ ] `listCompanyVehicles` parser
- [ ] `listMyCompanies` parser (`companyId`, `name`, `role`, `memberStatus`)
- [ ] `updateCompanyRoute` parser + `lastKnownUpdateToken` parity
- [ ] `updateVehicle` parser

### Done Kriterleri
1. Ilgili parser/mapping kodu app tarafinda uygulanmis olmali.
2. website/app-impact/07_app_parser_mapping_checklist_2026_02_27.md icinde bu maddeler [x] olmali.
3. Smoke sonucu raporlanmali (PASS/FAIL + kanit).

### Rapor Formati
- Degisen dosyalar: ...
- Test komutlari: ...
- Kalan aciklar: ...
- Risk notu: ...

## APP-ISSUE-03 - [Phase9][APP-SPRINT-1] BATCH-3 parser/mapping closure
- Oncelik: P0
- Kaynak batch: BATCH-3
- Kapsam: 4 item

### Amac
- Bu karttaki parser/mapping itemlarini app tarafinda kapatmak.

### Yapilacaklar
- [ ] Active company resolver (login -> mode -> company fallback)
- [ ] `426 Upgrade Required`
- [ ] `ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`
- [ ] `deleteCompanyRouteStop` parser

### Done Kriterleri
1. Ilgili parser/mapping kodu app tarafinda uygulanmis olmali.
2. website/app-impact/07_app_parser_mapping_checklist_2026_02_27.md icinde bu maddeler [x] olmali.
3. Smoke sonucu raporlanmali (PASS/FAIL + kanit).

### Rapor Formati
- Degisen dosyalar: ...
- Test komutlari: ...
- Kalan aciklar: ...
- Risk notu: ...

## APP-ISSUE-04 - [Phase9][APP-SPRINT-2] BATCH-4 parser/mapping closure
- Oncelik: P0
- Kaynak batch: BATCH-4
- Kapsam: 4 item

### Amac
- Bu karttaki parser/mapping itemlarini app tarafinda kapatmak.

### Yapilacaklar
- [ ] `listActiveTripsByCompany` parser
- [ ] `listCompanyRouteStops` parser
- [ ] `live.source` (`rtdb|trip_doc`) fallback mapping
- [ ] `liveState` (`online|stale`) UI mapping

### Done Kriterleri
1. Ilgili parser/mapping kodu app tarafinda uygulanmis olmali.
2. website/app-impact/07_app_parser_mapping_checklist_2026_02_27.md icinde bu maddeler [x] olmali.
3. Smoke sonucu raporlanmali (PASS/FAIL + kanit).

### Rapor Formati
- Degisen dosyalar: ...
- Test komutlari: ...
- Kalan aciklar: ...
- Risk notu: ...

## APP-ISSUE-05 - [Phase9][APP-SPRINT-2] BATCH-5 parser/mapping closure
- Oncelik: P0
- Kaynak batch: BATCH-5
- Kapsam: 4 item

### Amac
- Bu karttaki parser/mapping itemlarini app tarafinda kapatmak.

### Yapilacaklar
- [ ] `reorderCompanyRouteStops` parser (`changed`, `updatedAt`)
- [ ] `ROUTE_STOP_INVALID_STATE`
- [ ] `ROUTE_STOP_REORDER_STATE_INVALID`
- [ ] `UPDATE_TOKEN_MISMATCH`

### Done Kriterleri
1. Ilgili parser/mapping kodu app tarafinda uygulanmis olmali.
2. website/app-impact/07_app_parser_mapping_checklist_2026_02_27.md icinde bu maddeler [x] olmali.
3. Smoke sonucu raporlanmali (PASS/FAIL + kanit).

### Rapor Formati
- Degisen dosyalar: ...
- Test komutlari: ...
- Kalan aciklar: ...
- Risk notu: ...

## APP-ISSUE-06 - [Phase9][APP-SPRINT-2] BATCH-6 parser/mapping closure
- Oncelik: P0
- Kaynak batch: BATCH-6
- Kapsam: 4 item

### Amac
- Bu karttaki parser/mapping itemlarini app tarafinda kapatmak.

### Yapilacaklar
- [ ] `upsertCompanyRouteStop` parser
- [ ] RTDB stream state mapping (`live`, `mismatch`, `error`, `access_denied`)
- [ ] Company context recoverability (logout/login + mode switch)
- [ ] Error message mapping smoke (all listed codes)

### Done Kriterleri
1. Ilgili parser/mapping kodu app tarafinda uygulanmis olmali.
2. website/app-impact/07_app_parser_mapping_checklist_2026_02_27.md icinde bu maddeler [x] olmali.
3. Smoke sonucu raporlanmali (PASS/FAIL + kanit).

### Rapor Formati
- Degisen dosyalar: ...
- Test komutlari: ...
- Kalan aciklar: ...
- Risk notu: ...
