# Phase 9 APP-SPRINT-3 Execution Runbook

Generated At: 2026-02-27 22:11:45
Source: website/app-impact/12_phase9_app_sprint_packages_latest.json
Package: APP-SPRINT-3

## Scope
- W2A: W2A-100, W2A-101, W2A-102, W2A-103, W2A-104, W2A-105, W2A-106
- Open Items: 14/14
- Goal: Membership/permission parser + guard error mapping closure.

## Step-by-Step
1. Membership parser setini kapat (`update/invite/accept/decline/remove`).
2. Route permission parser setini kapat (`grant/revoke/list`).
3. Guard error mapping setini kapat (`OWNER_MEMBER_IMMUTABLE`, `SELF_MEMBER_REMOVE_FORBIDDEN`, invite codes).
4. Her alt adimdan sonra `07_*` checklist satirini `[x]` olarak isaretle.
5. Smoke template sonucunu `pass|fail|blocked` olarak doldur.

## Tasks
- [ ] `updateCompanyMember` parser + guard copy mapping
- [ ] `inviteCompanyMember` parser + pending state mapping
- [ ] `acceptCompanyInvite` parser + invited->active transition
- [ ] `declineCompanyInvite` parser + invited->suspended transition
- [ ] `removeCompanyMember` parser + owner/self deny mapping
- [ ] `grantDriverRoutePermissions` parser
- [ ] `revokeDriverRoutePermissions` parser
- [ ] `listRouteDriverPermissions` parser
- [ ] `OWNER_MEMBER_IMMUTABLE`
- [ ] `SELF_MEMBER_REMOVE_FORBIDDEN`
- [ ] `INVITE_EMAIL_NOT_FOUND`
- [ ] `INVITE_NOT_ACCEPTABLE`
- [ ] `INVITE_NOT_DECLINABLE`
- [ ] `ROUTE_PRIMARY_DRIVER_IMMUTABLE`

## Acceptance
- Invite accept/decline ve member update/remove akislari parser seviyesinde deterministik.
- Owner/self guard reason-code'lari dogru UI mesajina mapleniyor.
- Route permission grant/revoke/list sonuclari role-state tutarli.

## Smoke Evidence Protocol
- Evidence file: `website/app-impact/16_phase9_app_sprint3_smoke_template_latest.json`
- Her test satirinda `pass|fail|blocked` ve kisa not zorunlu.
- Block durumunda endpoint + code + sample payload eklenmeli.
