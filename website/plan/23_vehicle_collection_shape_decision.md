# ADR-003: Vehicle Collection Shape (Global Collection + companyId)

Tarih: 2026-02-24
Durum: Superseded by ADR-008 (MVP company-scoped vehicle write model)

## 1. Problem

Arac verisini nasil modelliyoruz?

Secenekler:
- tenant altinda nested (`companies/{companyId}/vehicles/*`)
- global koleksiyon (`vehicles/*`) + `companyId`

Bu karar:
- query ergonomisi
- indexing
- backoffice/reporting
- migration kolayligi
uzerinde etkili.

## 2. Karar

Tarihsel not:
- Bu karar ilk Faz 0 taslaginda alinmistir.
- Solo-founder MVP security posture gereksinimi nedeniyle `56_adr_008_vehicle_collection_security_revision.md` ile revize edilmistir.

MVP icin:
- `vehicles/*` global koleksiyon
- her kayitta `companyId` (veya bireysel icin `driverUid`)
- `ownerType` alanı (`company | individual_driver`)

## 3. Neden?

1. Bireysel + firma araci ayni modelde tutulabilir
2. Admin/reporting/backoffice sorgulari kolaylasir
3. Collection-group benzeri karmaşıklik azalir
4. Gelecekte assignment/policy iliskileri daha esnek olur

## 4. Tenant izolasyonu nasıl korunacak?

Kural:
- Global koleksiyon = global erisim degil
- Tum read/write:
  - server-side authorization
  - `companyId` context kontrolu
ile korunur

## 5. Alternatif: Tenant nested collection

Artı:
- tenant ayrimi hissi guclu

Eksi:
- bireysel driver modeliyle cift model gerektirebilir
- cross-company reporting/ops zorlasir
- endpoint/query kompleksligi artar

## 6. MVP Alan Onerisi

- `id`
- `ownerType`
- `companyId` (nullable)
- `driverUid` (nullable)
- `plate`
- `brand`
- `model`
- `year`
- `capacity`
- `status`
- `createdAt`
- `updatedAt`

## 7. Index / Query Notu

MVP query ihtiyaclari icin muhtemel indexler:
- `companyId + status`
- `driverUid + status`
- `plate` (arama stratejisine gore)

## 8. Review Zamanı

Faz 3 sonu:
- query patternleri
- raporlama ihtiyaclari
- tenant policy karmasasi
incelenip gerekirse revise edilir
