# ADR-008: Vehicle Collection Security Revision (Company-Scoped for MVP)

Tarih: 2026-02-24
Durum: Accepted
Supersedes: `23_vehicle_collection_shape_decision.md` (ADR-003)

## 1. Problem

Global `vehicles/* + companyId` modeli query esnekligi saglasa da:
- cross-tenant leakage riski
- authz hatalarinda daha buyuk patlama etkisi
- solo-founder MVP'de security yukunun artmasi
sorunlarini buyutur.

## 2. Karar

MVP ve pilot asamalarinda arac koleksiyonu company-scoped tutulacak:
- `companies/{companyId}/vehicles/{vehicleId}`

Bireysel soforler icin (ADR-006 geregi):
- `individual_operator` company tenant altinda ayni model kullanilacak.

## 3. Neden?

1. Tenant izolasyonunu fiziksel hiyerarsi ile guclendirir
2. Firestore rules ve API authz savunmasini sadeleştirir
3. Cross-tenant veri sizintisi blast radius'unu azaltir
4. Solo-founder MVP'de daha savunulabilir guvenlik posture'u verir

## 4. Reporting/Backoffice ihtiyaci nasil cozulecek?

MVP'de global vehicle query ihtiyaclari icin iki yontem:
- hedefli backend admin/reporting endpointleri (internal only)
- opsiyonel projection/index koleksiyonu (read-only)

Kural:
- write source-of-truth company-scoped collection olur
- global projection kullanilsa bile source-of-truth degildir

## 5. Firestore Rules + API Savunma Katmanlari

1. Path-level tenant boundary (company collection nesting)
2. Server-side authz (`companyId` membership/role check)
3. Rules tests (allow + deny)
4. Cross-tenant negative tests (CI)
5. Audit log for critical vehicle mutasyonlari

## 6. Custom Claims Notu (kismi kullanim)

Custom claims kullanilabilir, ancak asagidaki sinirla:
- coarse-grained platform claims (super admin flag vb.)
- company membership source-of-truth claims degil

Neden:
- multi-company membership
- token refresh gecikmesi
- claim boyutu limitleri

## 7. Migrasyon / Gelecek Revizyon Opsiyonu

Gelecekte reporting ihtiyaci buyurse:
- `vehicle_index/*` gibi projection koleksiyonu eklenebilir
- veya Data Connect/BI pipeline kullanilabilir

Bu karar write model'i degistirmez.

## 8. Etkilenen Dokumanlar

- `08_domain_model_company_rbac.md`
- `42_p0_endpoint_contracts_v1_draft.md`
- `13_api_endpoint_backlog.md`
- `63_test_strategy_feature_flags_rollout_backup_retention_notifications_plan.md` (rules/authz tests)

## 9. Review Zamani

Faz 6 pilot sonu:
- query karmasasi
- reporting ihtiyaci
- authz incident sayisi
incelenir.
