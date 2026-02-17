# NeredeServis Flutter Upgrade Guard

## 1) Purpose
- Prevent unstable upgrades and breaking changes.
- Keep build reproducible across developers and CI.

## 2) Locked Baseline
- Flutter: `3.24.5`
- Channel: `stable`
- FVM required
- Canonical lock record: `docs/flutter_lock.md`

## 3) Upgrade Policy
- No ad-hoc upgrade during feature implementation.
- Upgrade window: sprint end only.
- Upgrade requires user approval and full gate checks.

## 4) Pre-Upgrade Checklist
- `fvm flutter --version`
- `fvm flutter doctor -v`
- `fvm flutter pub outdated`
- `dart fix --dry-run`
- Risk review for:
  - Drift migrations and codegen
  - Riverpod generator/build_runner
  - Mapbox plugin compatibility
  - iOS/Android permission APIs

## 5) Upgrade Execution
1. Create dedicated upgrade branch.
2. Update Flutter via FVM.
3. Update package pins in controlled batches.
4. Regenerate code (`build_runner`).
5. Fix compile/lint/test failures.
6. Run emulator + device smoke tests.

## 6) Required Test Gates After Upgrade
- Unit tests green.
- Rules/function integration tests green.
- Android + iOS build success.
- Driver live publish flow smoke test.
- Passenger live map and ETA smoke test.
- Permission orchestration tests (driver/passenger/guest).

## 7) Material 3 and Deprecation Guard
- Track Flutter deprecations each sprint.
- Keep Material 3 checklist updated.
- No deprecated API accepted in new code unless documented exception.

## 8) Rollback Plan
- Keep previous Flutter lock in git history.
- If regression appears:
  - revert toolchain lock
  - revert package updates
  - run full validation again

## 9) CI Rules
- CI must run with `fvm flutter` only.
- Direct global `flutter` usage is not accepted.
- Failing lock/version check blocks merge.

## 10) Sign-Off
- Upgrade is complete only after:
  - lock file update (`docs/flutter_lock.md`)
  - test evidence attached
  - entry appended to `docs/proje_uygulama_iz_kaydi.md`
