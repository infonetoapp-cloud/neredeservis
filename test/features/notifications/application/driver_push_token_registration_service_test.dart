import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/notifications/application/driver_push_token_registration_service.dart';

void main() {
  group('DriverPushTokenRegistrationService', () {
    test('registers initial token with computed device id', () async {
      final calls = <Map<String, dynamic>>[];
      final controller = StreamController<String>.broadcast();
      addTearDown(controller.close);

      final service = DriverPushTokenRegistrationService(
        registerInvoker: ({
          required String deviceId,
          required String activeDeviceToken,
          required DateTime lastSeenAtUtc,
        }) async {
          calls.add(<String, dynamic>{
            'deviceId': deviceId,
            'token': activeDeviceToken,
            'lastSeenAt': lastSeenAtUtc.toIso8601String(),
          });
        },
        tokenFetcher: () async => 'token-1',
        tokenRefreshStreamProvider: () => controller.stream,
        devicePlatformKey: 'android',
        nowProvider: () => DateTime.utc(2026, 2, 19, 8, 0, 0),
      );
      addTearDown(service.dispose);

      await service.registerForUid('1234567890abcdef');

      expect(calls, hasLength(1));
      expect(calls.first['deviceId'], 'android_12345678');
      expect(calls.first['token'], 'token-1');
      expect(calls.first['lastSeenAt'], '2026-02-19T08:00:00.000Z');
    });

    test('uses pending fallback when token cannot be fetched', () async {
      final calls = <String>[];
      final controller = StreamController<String>.broadcast();
      addTearDown(controller.close);

      final service = DriverPushTokenRegistrationService(
        registerInvoker: ({
          required String deviceId,
          required String activeDeviceToken,
          required DateTime lastSeenAtUtc,
        }) async {
          calls.add(activeDeviceToken);
        },
        tokenFetcher: () async => null,
        tokenRefreshStreamProvider: () => controller.stream,
        devicePlatformKey: 'ios',
      );
      addTearDown(service.dispose);

      await service.registerForUid('uid-short');

      expect(calls,
          <String>[DriverPushTokenRegistrationService.pendingTokenFallback]);
    });

    test('refresh stream triggers register on new token and dedupes same token',
        () async {
      final calls = <String>[];
      final controller = StreamController<String>.broadcast();
      addTearDown(controller.close);

      final service = DriverPushTokenRegistrationService(
        registerInvoker: ({
          required String deviceId,
          required String activeDeviceToken,
          required DateTime lastSeenAtUtc,
        }) async {
          calls.add(activeDeviceToken);
        },
        tokenFetcher: () async => 'token-initial',
        tokenRefreshStreamProvider: () => controller.stream,
        devicePlatformKey: 'android',
      );
      addTearDown(service.dispose);

      await service.registerForUid('uid-1');
      controller.add('token-initial');
      controller.add('token-next');
      controller.add('token-next');
      await Future<void>.delayed(const Duration(milliseconds: 20));

      expect(
        calls,
        <String>[
          'token-initial',
          'token-next',
        ],
      );
    });

    test('dispose stops refresh handling', () async {
      final calls = <String>[];
      final controller = StreamController<String>.broadcast();
      addTearDown(controller.close);

      final service = DriverPushTokenRegistrationService(
        registerInvoker: ({
          required String deviceId,
          required String activeDeviceToken,
          required DateTime lastSeenAtUtc,
        }) async {
          calls.add(activeDeviceToken);
        },
        tokenFetcher: () async => 'token-1',
        tokenRefreshStreamProvider: () => controller.stream,
        devicePlatformKey: 'android',
      );

      await service.registerForUid('uid-1');
      await service.dispose();
      controller.add('token-2');
      await Future<void>.delayed(const Duration(milliseconds: 20));

      expect(calls, <String>['token-1']);
    });
  });

  test('buildDeviceId trims uid to first 8 chars', () {
    final deviceId = buildDeviceId(uid: 'abcdef123456', platformKey: 'android');
    expect(deviceId, 'android_abcdef12');
  });
}
