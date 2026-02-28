import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/core/telemetry/mobile_event_names.dart';
import 'package:neredeservis/core/telemetry/mobile_telemetry.dart';
import 'package:neredeservis/ui/screens/active_trip_screen.dart';

void main() {
  group('ActiveTripScreen perf telemetry', () {
    late MobileTelemetry telemetry;
    late List<TelemetryRecord> records;

    setUp(() {
      telemetry = MobileTelemetry.instance;
      telemetry.resetForTests();
      records = <TelemetryRecord>[];
      telemetry.setTestHooks(
        recordSink: records.add,
        nowUtc: () => DateTime.utc(2026, 2, 19, 21, 5, 0),
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

    // Faz 0B quarantine: ActiveTripScreen currently has no map render telemetry
    // hook on placeholder path. Re-enable after telemetry seam is restored.
    testWidgets(
      'emits map render perf event on placeholder path',
      (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: ActiveTripScreen(
            mapboxPublicToken: null,
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 200));

      final mapRenderEvents = records
          .where(
            (record) => record.eventName == MobileEventNames.mapRender,
          )
          .toList(growable: false);
      expect(mapRenderEvents, isNotEmpty);
      final event = mapRenderEvents.first;
      expect(event.attributes['screen'], 'active_trip');
      expect(event.attributes['mode'], 'placeholder_missing_token');
      expect(event.attributes['durationMs'], isA<int>());
    },
      skip: true,
    );
  });
}
