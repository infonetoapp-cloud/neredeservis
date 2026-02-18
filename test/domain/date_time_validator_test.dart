import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/data/date_time_validator.dart';

void main() {
  group('DateTimeValidator.isValidTime', () {
    test('accepts HH:mm format', () {
      expect(DateTimeValidator.isValidTime('00:00'), isTrue);
      expect(DateTimeValidator.isValidTime('06:30'), isTrue);
      expect(DateTimeValidator.isValidTime('23:59'), isTrue);
    });

    test('rejects invalid time values', () {
      expect(DateTimeValidator.isValidTime('24:00'), isFalse);
      expect(DateTimeValidator.isValidTime('12:60'), isFalse);
      expect(DateTimeValidator.isValidTime('6:30'), isFalse);
      expect(DateTimeValidator.isValidTime('aa:bb'), isFalse);
    });
  });

  group('DateTimeValidator.isValidDate', () {
    test('accepts YYYY-MM-DD format with calendar validity', () {
      expect(DateTimeValidator.isValidDate('2026-02-18'), isTrue);
      expect(DateTimeValidator.isValidDate('2024-02-29'), isTrue);
    });

    test('rejects invalid date values', () {
      expect(DateTimeValidator.isValidDate('2026-02-29'), isFalse);
      expect(DateTimeValidator.isValidDate('2026-13-01'), isFalse);
      expect(DateTimeValidator.isValidDate('2026-00-10'), isFalse);
      expect(DateTimeValidator.isValidDate('26-02-18'), isFalse);
    });
  });

  group('Istanbul timezone contract', () {
    test('parseIstanbulDateTimeToUtc converts scheduled local time to UTC', () {
      final utc = DateTimeValidator.parseIstanbulDateTimeToUtc(
        date: '2026-02-18',
        time: '06:30',
      );

      expect(utc, isNotNull);
      expect(utc, DateTime.utc(2026, 2, 18, 3, 30));
    });

    test('parseIstanbulDateTimeToUtc returns null for invalid input', () {
      final utc = DateTimeValidator.parseIstanbulDateTimeToUtc(
        date: '2026-02-31',
        time: '99:99',
      );
      expect(utc, isNull);
    });
  });

  group('UTC timestamp helpers', () {
    test('normalizeToUtc always returns UTC', () {
      final normalized = DateTimeValidator.normalizeToUtc(
          DateTime.parse('2026-02-18T06:30:00+03:00'));
      expect(normalized.isUtc, isTrue);
      expect(normalized, DateTime.utc(2026, 2, 18, 3, 30));
    });

    test('parseUtcTimestamp parses valid ISO string and rejects invalid', () {
      final parsed =
          DateTimeValidator.parseUtcTimestamp('2026-02-18T03:30:00Z');
      final invalid = DateTimeValidator.parseUtcTimestamp('not-a-date');

      expect(parsed, DateTime.utc(2026, 2, 18, 3, 30));
      expect(invalid, isNull);
    });
  });
}
