# Phase 9 APP-SPRINT-1 Execution Runbook

Generated At: 2026-02-27 22:11:44
Source: website/app-impact/12_phase9_app_sprint_packages_latest.json
Package: APP-SPRINT-1

## Scope
- W2A: W2A-004, W2A-006, W2A-007, W2A-008, W2A-009, W2A-010, W2A-011, W2A-012
- Open Items: 9/9
- Goal: Company context + vehicle/route base parser closure.

## Step-by-Step
1. `createCompany` ve `listMyCompanies` parser alanlarini type-safe parse et.
2. Login sonrasi active company resolver fallback davranisini sabitle.
3. `listCompanyMembers` parser alanlarini role/status/display alanlariyla dogrula.
4. `listCompanyVehicles`, `createVehicle`, `updateVehicle` parser setini kapat.
5. `createCompanyRoute` + `updateCompanyRoute` parser ve token parity akisini dogrula.
6. Her alt adimdan sonra ilgili checklist satirini `07_*` icinde `[x]` yap.

## Tasks
- [ ] `createCompany` response parser (`companyId`, `ownerMember`, `createdAt`)
- [ ] `listMyCompanies` parser (`companyId`, `name`, `role`, `memberStatus`)
- [ ] `listCompanyMembers` parser (`uid`, `role`, `memberStatus`, `displayName/email/phone`)
- [ ] Active company resolver (login -> mode -> company fallback)
- [ ] `listCompanyVehicles` parser
- [ ] `createVehicle` parser
- [ ] `updateVehicle` parser
- [ ] `createCompanyRoute` parser (`routeId`, `srvCode`)
- [ ] `updateCompanyRoute` parser + `lastKnownUpdateToken` parity

## Acceptance
- Company secimi login sonrasi deterministic fallback ile aciliyor.
- Vehicle/Route create-update parser katmaninda crash olmadan isleniyor.
- Token mismatch mesaji UI'da anlasilir gosteriliyor.

## Smoke Evidence Protocol
- Evidence file: `website/app-impact/14_phase9_app_sprint1_smoke_template_latest.json`
- Her test satirinda `pass|fail|blocked` ve kisa not zorunlu.
- Block durumunda endpoint + code + sample payload eklenmeli.
