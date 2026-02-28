import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/support/application/shake_to_report_detector.dart';

void main() {
  group('ShakeToReportDetector', () {
    test('requires repeated spikes before triggering', () {
      var triggerCount = 0;
      final timeline = _TimelineClock();
      final detector = ShakeToReportDetector(
        onShakeDetected: () {
          triggerCount++;
        },
        now: timeline.now,
        thresholdG: 2.4,
        requiredHits: 2,
        hitWindow: const Duration(milliseconds: 900),
      );

      detector.addSample(x: 0, y: 0, z: 9.80665);
      timeline.advance(const Duration(milliseconds: 150));
      detector.addSample(x: 24, y: 0, z: 0);
      expect(triggerCount, equals(0));

      timeline.advance(const Duration(milliseconds: 150));
      detector.addSample(x: 25, y: 0, z: 0);
      expect(triggerCount, equals(1));
    });

    test('applies debounce window after a trigger', () {
      var triggerCount = 0;
      final timeline = _TimelineClock();
      final detector = ShakeToReportDetector(
        onShakeDetected: () {
          triggerCount++;
        },
        now: timeline.now,
        thresholdG: 2.0,
        requiredHits: 2,
        hitWindow: const Duration(seconds: 1),
        debounce: const Duration(seconds: 8),
      );

      detector.addSample(x: 22, y: 0, z: 0);
      timeline.advance(const Duration(milliseconds: 200));
      detector.addSample(x: 22, y: 0, z: 0);
      expect(triggerCount, equals(1));

      timeline.advance(const Duration(seconds: 1));
      detector.addSample(x: 22, y: 0, z: 0);
      timeline.advance(const Duration(milliseconds: 200));
      detector.addSample(x: 22, y: 0, z: 0);
      expect(triggerCount, equals(1));

      timeline.advance(const Duration(seconds: 8));
      detector.addSample(x: 22, y: 0, z: 0);
      timeline.advance(const Duration(milliseconds: 200));
      detector.addSample(x: 22, y: 0, z: 0);
      expect(triggerCount, equals(2));
    });

    test('drops old hit candidates outside window', () {
      var triggerCount = 0;
      final timeline = _TimelineClock();
      final detector = ShakeToReportDetector(
        onShakeDetected: () {
          triggerCount++;
        },
        now: timeline.now,
        thresholdG: 2.0,
        requiredHits: 2,
        hitWindow: const Duration(milliseconds: 500),
      );

      detector.addSample(x: 22, y: 0, z: 0);
      timeline.advance(const Duration(milliseconds: 800));
      detector.addSample(x: 22, y: 0, z: 0);
      expect(triggerCount, equals(0));

      timeline.advance(const Duration(milliseconds: 200));
      detector.addSample(x: 22, y: 0, z: 0);
      expect(triggerCount, equals(1));
    });
  });
}

class _TimelineClock {
  DateTime _now = DateTime.utc(2026, 2, 19, 0, 0, 0);

  DateTime now() => _now;

  void advance(Duration delta) {
    _now = _now.add(delta);
  }
}
