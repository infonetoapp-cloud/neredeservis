# Faz 9 App Implementation Pack

Tarih: 2026-02-27 22:11:44
Durum: PASS

## Amac
- App ekibinin APP-SPRINT-1..4 bloklarini tek paketle, dogrudan uygulanabilir promptlarla kapatmasi.

## Giris Referanslari
- website/app-impact/12_phase9_app_sprint_packages_latest.json
- website/app-impact/07_app_parser_mapping_checklist_2026_02_27.md
- website/app-impact/03_app_integration_cutover_checklist.md
- website/app-impact/19_app_runtime_behavior_alignment_contract_2026_02_27.md

## Genel Kurallar
1. Contract-first ilerle: server shape degistirme, parser/mapping kapat.
2. 426 ve lock reason code mesajlarini eyleme donuk map et.
3. Live ops semantigi online/stale/offline + rtdb/trip_doc fallback ile ayni kalacak.
4. Her sprint sonunda checklist update + smoke kaniti ver.

## Sprint Promptlari

### APP-SPRINT-1 - Company Context + Vehicle + Route Base Parser
- Oncelik: P0
- Acik: 9/9
- W2A: W2A-004, W2A-006, W2A-007, W2A-008, W2A-009, W2A-010, W2A-011, W2A-012

Kopyala-yapistir prompt:
```text
KOD DEGISTIR. SADECE app tarafinda bu sprinti kapat.
Hedef sprint: APP-SPRINT-1 (Company Context + Vehicle + Route Base Parser)
Kurallar:
- Server kontratini degistirme.
- Reason-code mapping eyleme donuk ve deterministik olsun.
- Her degisikligin sonunda test ve kanit ekle.
- Dosya sisirmeden, moduler ilerle.
Yapilacaklar:
- `createCompany` response parser (`companyId`, `ownerMember`, `createdAt`)
- `listMyCompanies` parser (`companyId`, `name`, `role`, `memberStatus`)
- `listCompanyMembers` parser (`uid`, `role`, `memberStatus`, `displayName/email/phone`)
- Active company resolver (login -> mode -> company fallback)
- `listCompanyVehicles` parser
- `createVehicle` parser
- `updateVehicle` parser
- `createCompanyRoute` parser (`routeId`, `srvCode`)
- `updateCompanyRoute` parser + `lastKnownUpdateToken` parity
Kabul kriterleri:
- Company secimi login sonrasi deterministic fallback ile aciliyor.
- Vehicle/Route create-update parser katmaninda crash olmadan isleniyor.
- Token mismatch mesaji UI'da anlasilir gosteriliyor.
Cikti:
- Degisen dosyalar listesi
- Calisan test komutlari
- Hala acik kalan maddeler
```

### APP-SPRINT-2 - Route Stops + Live Ops + Critical Error Mapping
- Oncelik: P0
- Acik: 13/13
- W2A: W2A-001, W2A-002, W2A-003, W2A-013, W2A-014, W2A-015, W2A-016, W2A-017

Kopyala-yapistir prompt:
```text
KOD DEGISTIR. SADECE app tarafinda bu sprinti kapat.
Hedef sprint: APP-SPRINT-2 (Route Stops + Live Ops + Critical Error Mapping)
Kurallar:
- Server kontratini degistirme.
- Reason-code mapping eyleme donuk ve deterministik olsun.
- Her degisikligin sonunda test ve kanit ekle.
- Dosya sisirmeden, moduler ilerle.
Yapilacaklar:
- `listCompanyRouteStops` parser
- `upsertCompanyRouteStop` parser
- `deleteCompanyRouteStop` parser
- `reorderCompanyRouteStops` parser (`changed`, `updatedAt`)
- `listActiveTripsByCompany` parser
- `liveState` (`online|stale`) UI mapping
- `live.source` (`rtdb|trip_doc`) fallback mapping
- RTDB stream state mapping (`live`, `mismatch`, `error`, `access_denied`)
- `426 Upgrade Required`
- `UPDATE_TOKEN_MISMATCH`
- `ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED`
- `ROUTE_STOP_INVALID_STATE`
- `ROUTE_STOP_REORDER_STATE_INVALID`
Kabul kriterleri:
- Durak ekle/sil/sirala akislarinda soft-lock senaryolari dogru reason-code ile geri donuyor.
- RTDB stream kopma/yeniden baglanma sonrasi fallback semantigi korunuyor.
- 426 ve conflict kodlari kullaniciya eyleme donuk mesajla gosteriliyor.
Cikti:
- Degisen dosyalar listesi
- Calisan test komutlari
- Hala acik kalan maddeler
```

### APP-SPRINT-3 - Membership/Permission Parser + Guard Error Mapping
- Oncelik: P1
- Acik: 14/14
- W2A: W2A-100, W2A-101, W2A-102, W2A-103, W2A-104, W2A-105, W2A-106

Kopyala-yapistir prompt:
```text
KOD DEGISTIR. SADECE app tarafinda bu sprinti kapat.
Hedef sprint: APP-SPRINT-3 (Membership/Permission Parser + Guard Error Mapping)
Kurallar:
- Server kontratini degistirme.
- Reason-code mapping eyleme donuk ve deterministik olsun.
- Her degisikligin sonunda test ve kanit ekle.
- Dosya sisirmeden, moduler ilerle.
Yapilacaklar:
- `updateCompanyMember` parser + guard copy mapping
- `inviteCompanyMember` parser + pending state mapping
- `acceptCompanyInvite` parser + invited->active transition
- `declineCompanyInvite` parser + invited->suspended transition
- `removeCompanyMember` parser + owner/self deny mapping
- `grantDriverRoutePermissions` parser
- `revokeDriverRoutePermissions` parser
- `listRouteDriverPermissions` parser
- `OWNER_MEMBER_IMMUTABLE`
- `SELF_MEMBER_REMOVE_FORBIDDEN`
- `INVITE_EMAIL_NOT_FOUND`
- `INVITE_NOT_ACCEPTABLE`
- `INVITE_NOT_DECLINABLE`
- `ROUTE_PRIMARY_DRIVER_IMMUTABLE`
Kabul kriterleri:
- Invite accept/decline ve member update/remove akislari parser seviyesinde deterministik.
- Owner/self guard reason-code'lari dogru UI mesajina mapleniyor.
- Route permission grant/revoke/list sonuclari role-state tutarli.
Cikti:
- Degisen dosyalar listesi
- Calisan test komutlari
- Hala acik kalan maddeler
```

### APP-SPRINT-4 - Acceptance Smoke + Cutover Checklist Closure
- Oncelik: P0
- Acik: 5/12
- W2A: W2A-001, W2A-002, W2A-003, W2A-004

Kopyala-yapistir prompt:
```text
KOD DEGISTIR. SADECE app tarafinda bu sprinti kapat.
Hedef sprint: APP-SPRINT-4 (Acceptance Smoke + Cutover Checklist Closure)
Kurallar:
- Server kontratini degistirme.
- Reason-code mapping eyleme donuk ve deterministik olsun.
- Her degisikligin sonunda test ve kanit ekle.
- Dosya sisirmeden, moduler ilerle.
Yapilacaklar:
- Parser crash-free smoke (all listed callables)
- Error message mapping smoke (all listed codes)
- Company context recoverability (logout/login + mode switch)
- Route/stop conflict recovery (token mismatch -> reload -> retry)
- Live ops fallback correctness (RTDB yoksa trip_doc, stale semantigi korunur)
Kabul kriterleri:
- Parser crash-free smoke tum listedeki callable setinde PASS.
- Error mapping smoke listedeki tum zorunlu reason-code'larda PASS.
- 03 app integration cutover checklist maddeleri eksiksiz kapali.
Cikti:
- Degisen dosyalar listesi
- Calisan test komutlari
- Hala acik kalan maddeler
```

## Gun Sonu Rapor Formati
```text
Sprint: APP-SPRINT-X
Tamamlanan madde sayisi: A/B
Degisen dosyalar: ...
Calisan testler: ...
Acilan riskler: ...
Bir sonraki net 4 adim: ...
```

## Not
- Bu paket app implementasyonunu hizlandirmak icindir; web kontrati degistirmez.
