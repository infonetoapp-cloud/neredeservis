import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/core/telemetry/mobile_event_names.dart';
import 'package:neredeservis/core/telemetry/mobile_telemetry.dart';
import 'package:neredeservis/ui/screens/passenger_tracking_screen.dart';

void main() {
  group('PassengerTrackingScreen perf telemetry', () {
    late MobileTelemetry telemetry;
    late List<TelemetryRecord> records;

    setUp(() {
      telemetry = MobileTelemetry.instance;
      telemetry.resetForTests();
      records = <TelemetryRecord>[];
      telemetry.setTestHooks(
        recordSink: records.add,
        nowUtc: () => DateTime.utc(2026, 2, 19, 21, 0, 0),
      );
      telemetry.configure(
        analyticsEnabled: true,
        breadcrumbEnabled: false,
        environment: 'dev',
      );
    });

    tearDown(() {
      telemetry.resetForTests();
    });

    testWidgets('emits map render perf event on placeholder path',
        (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: PassengerTrackingScreen(
            mapboxPublicToken: null,
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 100));

      final mapRenderEvents = records
          .where(
            (record) => record.eventName == MobileEventNames.mapRender,
          )
          .toList(growable: false);
      expect(mapRenderEvents, isNotEmpty);
      final event = mapRenderEvents.first;
      expect(event.attributes['screen'], 'passenger_tracking');
      expect(event.attributes['mode'], 'placeholder_missing_token');
      expect(event.attributes['durationMs'], isA<int>());
    });
  });
}
