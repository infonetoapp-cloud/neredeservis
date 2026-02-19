import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/location/infrastructure/android_location_background_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const channel = MethodChannel('neredeservis/background_location_service');
  final log = <MethodCall>[];

  setUp(() {
    log.clear();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (methodCall) async {
      log.add(methodCall);
      switch (methodCall.method) {
        case 'startDriverLocationService':
          return true;
        case 'stopDriverLocationService':
          return true;
        case 'isDriverLocationServiceRunning':
          return true;
        default:
          return false;
      }
    });
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, null);
  });

  test('invokes start method on Android', () async {
    final service = AndroidLocationBackgroundService(
      channel: channel,
      isAndroidOverride: () => true,
    );

    final started = await service.startDriverLocationService();
    expect(started, isTrue);
    expect(log.single.method, 'startDriverLocationService');
  });

  test('invokes stop method on Android', () async {
    final service = AndroidLocationBackgroundService(
      channel: channel,
      isAndroidOverride: () => true,
    );

    final stopped = await service.stopDriverLocationService();
    expect(stopped, isTrue);
    expect(log.single.method, 'stopDriverLocationService');
  });

  test('returns false and skips channel outside Android', () async {
    final service = AndroidLocationBackgroundService(
      channel: channel,
      isAndroidOverride: () => false,
    );

    final started = await service.startDriverLocationService();
    final running = await service.isDriverLocationServiceRunning();

    expect(started, isFalse);
    expect(running, isFalse);
    expect(log, isEmpty);
  });
}
