import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/location/infrastructure/ios_silent_kill_mitigation_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const channel = MethodChannel('neredeservis/ios_background_watchdog');
  final log = <MethodCall>[];

  setUp(() {
    log.clear();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (methodCall) async {
      log.add(methodCall);
      switch (methodCall.method) {
        case 'registerWatchdog':
          return true;
        case 'unregisterWatchdog':
          return true;
        case 'recordHeartbeat':
          return true;
        case 'readWatchdogSnapshot':
          return <Object?, Object?>{
            'enabled': true,
            'tripId': 'trip_123',
            'lastHeartbeatMs': 1000,
            'lastWakeMs': 1200,
            'lastMovingSignal': true,
          };
        default:
          return null;
      }
    });
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, null);
  });

  test('start/stop watchdog methods are forwarded on iOS', () async {
    final service = IosSilentKillMitigationService(
      channel: channel,
      isIosSupported: () => true,
    );

    final started = await service.startWatchdog(tripId: 'trip_123');
    final stopped = await service.stopWatchdog();

    expect(started, isTrue);
    expect(stopped, isTrue);
    expect(log.map((entry) => entry.method).toList(), <String>[
      'registerWatchdog',
      'unregisterWatchdog',
    ]);
  });

  test('recordHeartbeat passes payload through channel', () async {
    final service = IosSilentKillMitigationService(
      channel: channel,
      isIosSupported: () => true,
    );

    final recorded = await service.recordHeartbeat(
      movingSignal: false,
      heartbeatMs: 2000,
    );

    expect(recorded, isTrue);
    expect(log.single.method, 'recordHeartbeat');
    expect(
      log.single.arguments,
      <String, dynamic>{'heartbeatMs': 2000, 'movingSignal': false},
    );
  });

  test(
      'shouldRecoverAfterResume returns true when wake is newer than heartbeat',
      () async {
    final service = IosSilentKillMitigationService(
      channel: channel,
      isIosSupported: () => true,
      nowUtc: () => DateTime.fromMillisecondsSinceEpoch(2000, isUtc: true),
    );

    final shouldRecover = await service.shouldRecoverAfterResume();

    expect(shouldRecover, isTrue);
  });

  test(
      'shouldRecoverAfterResume returns false when wake is newer but moving signal is false',
      () async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (methodCall) async {
      log.add(methodCall);
      if (methodCall.method == 'readWatchdogSnapshot') {
        return <Object?, Object?>{
          'enabled': true,
          'tripId': 'trip_123',
          'lastHeartbeatMs': 1000,
          'lastWakeMs': 1200,
          'lastMovingSignal': false,
        };
      }
      return true;
    });

    final service = IosSilentKillMitigationService(
      channel: channel,
      isIosSupported: () => true,
      nowUtc: () => DateTime.fromMillisecondsSinceEpoch(2000, isUtc: true),
    );

    final shouldRecover = await service.shouldRecoverAfterResume();

    expect(shouldRecover, isFalse);
  });

  test(
      'shouldRecoverAfterResume returns true when heartbeat is stale and moving',
      () async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (methodCall) async {
      log.add(methodCall);
      if (methodCall.method == 'readWatchdogSnapshot') {
        return <Object?, Object?>{
          'enabled': true,
          'tripId': 'trip_123',
          'lastHeartbeatMs': 1000,
          'lastWakeMs': 900,
          'lastMovingSignal': true,
        };
      }
      return true;
    });

    final service = IosSilentKillMitigationService(
      channel: channel,
      isIosSupported: () => true,
      nowUtc: () => DateTime.fromMillisecondsSinceEpoch(2500, isUtc: true),
    );

    final shouldRecover =
        await service.shouldRecoverAfterResume(staleThresholdSeconds: 1);

    expect(shouldRecover, isTrue);
  });

  test('non-iOS platforms skip native calls', () async {
    final service = IosSilentKillMitigationService(
      channel: channel,
      isIosSupported: () => false,
    );

    final started = await service.startWatchdog(tripId: 'trip_123');
    final snapshot = await service.readSnapshot();
    final shouldRecover = await service.shouldRecoverAfterResume();

    expect(started, isFalse);
    expect(snapshot.enabled, isFalse);
    expect(shouldRecover, isFalse);
    expect(log, isEmpty);
  });
}
