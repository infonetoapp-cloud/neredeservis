import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/core/logging/app_logger.dart';

void main() {
  group('DebugAppLogger PII redaction', () {
    test('redacts PII in message, context and error payload', () {
      final emitted = <String>[];
      final logger = DebugAppLogger(
        sink: emitted.add,
      );

      logger.error(
        'contact test@example.com +90 555 123 4567 srv ABC234 '
        'idem u-1_route-1-ab12-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}',
        error: 'token=secret-token ownerUid=user-123',
        context: <String, Object?>{
          'email': 'test@example.com',
          'driverPhone': '+90 555 123 4567',
          'srvCode': 'ABC234',
          'idempotencyKey': 'u_1-key-abc-ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
          'uid': 'user-123',
          'routeId': 'route-1',
        },
      );

      expect(emitted, hasLength(1));
      final output = emitted.single;

      expect(output, contains('[ERROR]'));
      expect(output, contains('[EMAIL]'));
      expect(output, contains('[PHONE]'));
      expect(output, contains('[SRV_CODE]'));
      expect(output, contains('[REDACTED]'));

      expect(output, isNot(contains('test@example.com')));
      expect(output, isNot(contains('+90 555 123 4567')));
      expect(output, isNot(contains('secret-token')));
      expect(output, isNot(contains('user-123')));
    });

    test('keeps non-sensitive content unchanged', () {
      final emitted = <String>[];
      final logger = DebugAppLogger(
        sink: emitted.add,
      );

      logger.info(
        'queue replay completed',
        context: const <String, Object?>{
          'queueSize': 2,
          'source': 'offline',
        },
      );

      final output = emitted.single;
      expect(output, contains('queue replay completed'));
      expect(output, contains('queueSize: 2'));
      expect(output, contains('source: offline'));
    });
  });
}
