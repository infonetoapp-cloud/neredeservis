import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/core/telemetry/mobile_telemetry.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

void main() {
  group('MobileTelemetry', () {
    late MobileTelemetry telemetry;
    late List<TelemetryRecord> records;
    late List<Breadcrumb> breadcrumbs;

    setUp(() {
      telemetry = MobileTelemetry.instance;
      records = <TelemetryRecord>[];
      breadcrumbs = <Breadcrumb>[];
      telemetry.resetForTests();
      telemetry.setTestHooks(
        recordSink: records.add,
        breadcrumbSink: (breadcrumb) async {
          breadcrumbs.add(breadcrumb);
        },
        nowUtc: () => DateTime.utc(2026, 2, 19, 20, 0, 0),
      );
    });

    tearDown(() {
      telemetry.resetForTests();
    });

    test('redacts pii in event payload and breadcrumb', () async {
      telemetry.configure(
        analyticsEnabled: true,
        breadcrumbEnabled: true,
        environment: 'dev',
      );

      telemetry.track(
        eventName: 'route_join',
        category: 'join',
        addBreadcrumb: true,
        attributes: const <String, Object?>{
          'email': 'driver@example.com',
          'phone': '+90 555 111 22 33',
          'srvCode': 'ABC234',
          'idempotencyKey': 'trip-route-abc-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]',
          'meta': <String, Object?>{
            'token': 'secret',
          },
        },
      );
      await Future<void>.delayed(Duration.zero);

      expect(records, hasLength(1));
      final record = records.single;
      expect(record.analyticsEnabled, isTrue);
      expect(record.environment, 'dev');
      expect(record.attributes['email'], '[REDACTED]');
      expect(record.attributes['phone'], '[REDACTED]');
      expect(record.attributes['srvCode'], '[SRV_CODE]');

      final meta = record.attributes['meta'] as Map<String, Object?>;
      expect(meta['token'], '[REDACTED]');

      expect(breadcrumbs, hasLength(1));
      final breadcrumb = breadcrumbs.single;
      expect(breadcrumb.message, 'route_join');
      final data = breadcrumb.data!;
      expect(data['email'], '[REDACTED]');
      expect(data['phone'], '[REDACTED]');
      expect(data['srvCode'], '[SRV_CODE]');
    });

    test('skips breadcrumb when disabled', () async {
      telemetry.configure(
        analyticsEnabled: false,
        breadcrumbEnabled: false,
        environment: 'prod',
      );

      telemetry.track(
        eventName: 'permission_denied',
        category: 'permission',
        addBreadcrumb: true,
        attributes: const <String, Object?>{
          'trigger': 'startTrip',
        },
      );
      await Future<void>.delayed(Duration.zero);

      expect(records, hasLength(1));
      expect(records.single.analyticsEnabled, isFalse);
      expect(records.single.environment, 'prod');
      expect(breadcrumbs, isEmpty);
    });

    test('traceDuration captures success and error outcomes', () async {
      telemetry.configure(
        analyticsEnabled: true,
        breadcrumbEnabled: true,
        environment: 'stg',
      );

      final value = await telemetry.traceDuration<int>(
        eventName: 'perf_test_event',
        run: () async => 42,
      );
      expect(value, 42);

      await expectLater(
        () => telemetry.traceDuration<void>(
          eventName: 'perf_test_event',
          run: () async {
            throw StateError('boom');
          },
        ),
        throwsStateError,
      );

      expect(records, hasLength(2));
      expect(records.first.attributes['outcome'], 'success');
      expect(records.first.attributes['durationMs'], isA<int>());
      expect(records.last.attributes['outcome'], 'error');
      expect(records.last.attributes['errorType'], 'StateError');
    });
  });
}
