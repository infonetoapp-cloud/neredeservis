import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/location/application/delay_inference.dart';

void main() {
  group('resolveScheduledDepartureUtcForToday', () {
    test('returns UTC DateTime for valid Istanbul HH:mm', () {
      final nowUtc = DateTime.utc(2026, 2, 19, 4, 0);
      final scheduledUtc = resolveScheduledDepartureUtcForToday(
        nowUtc: nowUtc,
        scheduledTime: '07:30',
      );

      expect(scheduledUtc, DateTime.utc(2026, 2, 19, 4, 30));
    });

    test('returns null for invalid HH:mm', () {
      final nowUtc = DateTime.utc(2026, 2, 19, 4, 0);
      final scheduledUtc = resolveScheduledDepartureUtcForToday(
        nowUtc: nowUtc,
        scheduledTime: '24:10',
      );

      expect(scheduledUtc, isNull);
    });
  });

  group('shouldShowLateDepartureBanner', () {
    test('returns false when there is an active trip', () {
      final nowUtc = DateTime.utc(2026, 2, 19, 4, 20);
      final isLate = shouldShowLateDepartureBanner(
        nowUtc: nowUtc,
        scheduledTime: '07:00',
        hasActiveTrip: true,
      );

      expect(isLate, isFalse);
    });

    test('returns false exactly at +10 minutes threshold', () {
      final nowUtc = DateTime.utc(2026, 2, 19, 4, 10);
      final isLate = shouldShowLateDepartureBanner(
        nowUtc: nowUtc,
        scheduledTime: '07:00',
        hasActiveTrip: false,
      );

      expect(isLate, isFalse);
    });

    test('returns true strictly after +10 minutes threshold', () {
      final nowUtc = DateTime.utc(2026, 2, 19, 4, 11);
      final isLate = shouldShowLateDepartureBanner(
        nowUtc: nowUtc,
        scheduledTime: '07:00',
        hasActiveTrip: false,
      );

      expect(isLate, isTrue);
    });

    test('returns false when scheduledTime is missing or invalid', () {
      final nowUtc = DateTime.utc(2026, 2, 19, 4, 30);

      expect(
        shouldShowLateDepartureBanner(
          nowUtc: nowUtc,
          scheduledTime: null,
          hasActiveTrip: false,
        ),
        isFalse,
      );
      expect(
        shouldShowLateDepartureBanner(
          nowUtc: nowUtc,
          scheduledTime: 'invalid',
          hasActiveTrip: false,
        ),
        isFalse,
      );
    });
  });
}
