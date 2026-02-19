import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/permissions/application/android_battery_optimization_orchestrator.dart';
import 'package:permission_handler/permission_handler.dart';

void main() {
  test('returns notApplicable outside Android', () async {
    final orchestrator = AndroidBatteryOptimizationOrchestrator(
      isAndroidSupported: () => false,
      readStatus: () async => PermissionStatus.denied,
      requestPermission: () async => PermissionStatus.granted,
    );

    final enabled = await orchestrator.isBypassEnabled();
    final outcome = await orchestrator.requestBypassAtNeedMoment();

    expect(enabled, isFalse);
    expect(outcome, AndroidBatteryOptimizationOutcome.notApplicable);
  });

  test('returns granted when bypass already enabled', () async {
    var requestCalled = false;
    final orchestrator = AndroidBatteryOptimizationOrchestrator(
      isAndroidSupported: () => true,
      readStatus: () async => PermissionStatus.granted,
      requestPermission: () async {
        requestCalled = true;
        return PermissionStatus.granted;
      },
    );

    final enabled = await orchestrator.isBypassEnabled();
    final outcome = await orchestrator.requestBypassAtNeedMoment();

    expect(enabled, isTrue);
    expect(outcome, AndroidBatteryOptimizationOutcome.granted);
    expect(requestCalled, isFalse);
  });

  test('requests bypass and returns denied when user rejects', () async {
    var statusReadCount = 0;
    final orchestrator = AndroidBatteryOptimizationOrchestrator(
      isAndroidSupported: () => true,
      readStatus: () async {
        statusReadCount++;
        return PermissionStatus.denied;
      },
      requestPermission: () async => PermissionStatus.denied,
    );

    final outcome = await orchestrator.requestBypassAtNeedMoment();

    expect(outcome, AndroidBatteryOptimizationOutcome.denied);
    expect(statusReadCount, 1);
  });

  test('returns error on unexpected exception', () async {
    final orchestrator = AndroidBatteryOptimizationOrchestrator(
      isAndroidSupported: () => true,
      readStatus: () async => throw StateError('boom'),
      requestPermission: () async => PermissionStatus.denied,
    );

    final outcome = await orchestrator.requestBypassAtNeedMoment();

    expect(outcome, AndroidBatteryOptimizationOutcome.error);
  });
}
