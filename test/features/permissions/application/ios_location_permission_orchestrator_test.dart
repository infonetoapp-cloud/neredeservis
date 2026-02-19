import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/permissions/application/ios_location_permission_orchestrator.dart';
import 'package:permission_handler/permission_handler.dart';

void main() {
  test('while-in-use returns notApplicable outside iOS', () async {
    final requested = <Permission>[];
    final orchestrator = IosLocationPermissionOrchestrator(
      isIosSupported: () => false,
      readStatus: (_) async => PermissionStatus.denied,
      requestStatus: (permission) async {
        requested.add(permission);
        return PermissionStatus.granted;
      },
    );

    final result = await orchestrator.ensureWhileInUseAtValueMoment();

    expect(result, IosWhileInUsePermissionResult.notApplicable);
    expect(requested, isEmpty);
  });

  test('while-in-use uses existing granted status', () async {
    final requested = <Permission>[];
    final orchestrator = IosLocationPermissionOrchestrator(
      isIosSupported: () => true,
      readStatus: (_) async => PermissionStatus.granted,
      requestStatus: (permission) async {
        requested.add(permission);
        return PermissionStatus.granted;
      },
    );

    final result = await orchestrator.ensureWhileInUseAtValueMoment();

    expect(result, IosWhileInUsePermissionResult.granted);
    expect(requested, isEmpty);
  });

  test('while-in-use requests permission when needed', () async {
    final requested = <Permission>[];
    final orchestrator = IosLocationPermissionOrchestrator(
      isIosSupported: () => true,
      readStatus: (_) async => PermissionStatus.denied,
      requestStatus: (permission) async {
        requested.add(permission);
        return PermissionStatus.granted;
      },
    );

    final result = await orchestrator.ensureWhileInUseAtValueMoment();

    expect(result, IosWhileInUsePermissionResult.granted);
    expect(requested.single, Permission.locationWhenInUse);
  });

  test('while-in-use denied result blocks flow', () async {
    final orchestrator = IosLocationPermissionOrchestrator(
      isIosSupported: () => true,
      readStatus: (_) async => PermissionStatus.denied,
      requestStatus: (_) async => PermissionStatus.denied,
    );

    final result = await orchestrator.ensureWhileInUseAtValueMoment();

    expect(result, IosWhileInUsePermissionResult.denied);
  });

  test('always permission returns notApplicable outside iOS', () async {
    final orchestrator = IosLocationPermissionOrchestrator(
      isIosSupported: () => false,
      readStatus: (_) async => PermissionStatus.denied,
      requestStatus: (_) async => PermissionStatus.denied,
    );

    final result = await orchestrator.ensureAlwaysAtActiveTripCommit();

    expect(result, IosBackgroundLocationPermissionResult.notApplicable);
  });

  test('always permission stays foreground-only when while-in-use is missing',
      () async {
    final requested = <Permission>[];
    final orchestrator = IosLocationPermissionOrchestrator(
      isIosSupported: () => true,
      readStatus: (permission) async {
        if (permission == Permission.locationWhenInUse) {
          return PermissionStatus.denied;
        }
        return PermissionStatus.denied;
      },
      requestStatus: (permission) async {
        requested.add(permission);
        return PermissionStatus.denied;
      },
    );

    final result = await orchestrator.ensureAlwaysAtActiveTripCommit();

    expect(result, IosBackgroundLocationPermissionResult.foregroundOnly);
    expect(requested, isEmpty);
  });

  test('always permission uses existing granted status', () async {
    final requested = <Permission>[];
    final orchestrator = IosLocationPermissionOrchestrator(
      isIosSupported: () => true,
      readStatus: (permission) async {
        if (permission == Permission.locationWhenInUse ||
            permission == Permission.locationAlways) {
          return PermissionStatus.granted;
        }
        return PermissionStatus.denied;
      },
      requestStatus: (permission) async {
        requested.add(permission);
        return PermissionStatus.granted;
      },
    );

    final result = await orchestrator.ensureAlwaysAtActiveTripCommit();

    expect(result, IosBackgroundLocationPermissionResult.granted);
    expect(requested, isEmpty);
  });

  test('always permission requests and can fallback to foreground-only',
      () async {
    final requested = <Permission>[];
    final orchestrator = IosLocationPermissionOrchestrator(
      isIosSupported: () => true,
      readStatus: (permission) async {
        if (permission == Permission.locationWhenInUse) {
          return PermissionStatus.granted;
        }
        if (permission == Permission.locationAlways) {
          return PermissionStatus.denied;
        }
        return PermissionStatus.denied;
      },
      requestStatus: (permission) async {
        requested.add(permission);
        return PermissionStatus.denied;
      },
    );

    final result = await orchestrator.ensureAlwaysAtActiveTripCommit();

    expect(result, IosBackgroundLocationPermissionResult.foregroundOnly);
    expect(requested.single, Permission.locationAlways);
  });
}
