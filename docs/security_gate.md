# NeredeServis Security Gate (V1.0)

## 1) Purpose
- This document defines release-blocking security and policy gates for V1.0.
- Any failed P0 gate blocks deploy to production.
- Scope covers Android + iOS in parallel.

## 2) Source of Truth
- Technical contracts: `docs/NeredeServis_Teknik_Plan.md`
- Execution flow: `docs/NeredeServis_Cursor_Amber_Runbook.md`
- API I/O contracts: `docs/api_contracts.md`
- Permission timing: `docs/permission_orchestration.md`
- Paywall copy canonical: `docs/NeredeServis_Paywall_Copy_TR.md`

## 3) Critical Gates (P0)

### 3.1 Identity and Authorization
- Role authority is server-side from `users/{uid}.role`.
- Client direct write to protected collections is denied.
- Anonymous access is allowed only for guest session flow.
- Driver-only operations enforce driver role + driver profile existence.

### 3.2 Firestore Rules
- `driver_directory` direct read is closed (`allow read: if false`).
- `users`, `drivers`, `trips`, `routes`, `consents` direct writes are closed.
- Route/trip reads require membership checks.
- `skip_requests` read is limited to passenger and authorized driver scope.

### 3.3 RTDB Rules
- Route write requires active writer grant (`routeWriters/{routeId}/{uid}=true`).
- Live timestamp window enforced: `now-30000 .. now+5000`.
- Guest read requires active session + not-expired TTL.
- Offline replay points are not allowed to corrupt live path semantics.

### 3.4 Function Safety
- Idempotency required for `startTrip`, `finishTrip`, `submitSkipToday`, `sendDriverAnnouncement`.
- Transition optimistic lock required (`expectedTransitionVersion`).
- `finishTrip.deviceId` must match `startedByDeviceId` unless server-admin override with audit log.
- Premium enforcement is server-side; client UI cannot unlock premium behavior.

### 3.5 App Check and Environment
- App Check enforced in production for Firestore/RTDB/Functions.
- Debug tokens are disabled in production.
- `dev/staging/prod` environment boundaries are enforced.

### 3.6 Permission and Tracking Policy
- Location permission prompts are driver-only.
- Passenger/guest must never see location prompt.
- Notification and battery optimization prompts follow contextual timing rules.
- If denied, fallback behavior must be explicit in UI (hard-block or degrade mode).

### 3.7 Privacy, KVKK, Data Lifecycle
- Consent is versioned and mandatory for location tracking.
- `showPhoneToDriver=false` must hide number in storage and UI.
- Support reports must be PII-redacted.
- Account deletion flow must include active-subscription interceptor.

### 3.8 Store and Billing Compliance
- V1.0: production billing closed, mock/read-only subscription state.
- V1.1: production RevenueCat billing opens.
- Platform labels are mandatory:
  - iOS: `Restore Purchases`
  - Android: `Satin Alimlari Geri Yukle`
  - Both: `Manage Subscription`
- Paywall/store copy must match `docs/NeredeServis_Paywall_Copy_TR.md`.

### 3.9 Operational Security
- Sentry/logging must avoid PII leakage.
- Secrets (Mapbox secret, keys) must never be present in client build.
- Incident response and rollback procedures must exist before production rollout.

## 4) Gate Checklist (Release Blocking)
- `SG-01` Firestore rules emulator tests green.
- `SG-02` RTDB rules emulator tests green.
- `SG-03` App Check production enforce verified.
- `SG-04` Driver-only location prompt verified.
- `SG-05` Passenger/guest no-location-prompt verified.
- `SG-06` Idempotency replay tests green.
- `SG-07` Transition race tests green.
- `SG-08` Device ownership (`finishTrip`) tests green.
- `SG-09` KVKK consent and deletion flow tests green.
- `SG-10` Data Safety and background location declarations aligned with runtime behavior.
- `SG-11` Billing labels/copy match paywall source doc.
- `SG-12` Secret leakage scan green (no secret token in app artifacts).

## 5) Decision Rule
- Any failed `SG-*` item blocks release.
- Release can continue only after fix + re-test + log entry in `docs/proje_uygulama_iz_kaydi.md`.
