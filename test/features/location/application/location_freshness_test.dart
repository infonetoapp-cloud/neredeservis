import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/location/application/location_freshness.dart';

void main() {
  final nowUtc = DateTime.utc(2026, 2, 19, 12, 0, 0);
  final nowMs = nowUtc.millisecondsSinceEpoch;

  group('resolveLiveSignalFreshness', () {
    test('returns live for missing timestamp when configured', () {
      final freshness = resolveLiveSignalFreshness(
        nowUtc: nowUtc,
        timestampMs: null,
        treatMissingAsLive: true,
      );

      expect(freshness, LiveSignalFreshness.live);
    });

    test('returns lost for missing timestamp when configured', () {
      final freshness = resolveLiveSignalFreshness(
        nowUtc: nowUtc,
        timestampMs: null,
        treatMissingAsLive: false,
      );

      expect(freshness, LiveSignalFreshness.lost);
    });

    test('maps age boundaries to expected bands', () {
      expect(
        resolveLiveSignalFreshness(
          nowUtc: nowUtc,
          timestampMs: nowMs - 30000,
        ),
        LiveSignalFreshness.live,
      );
      expect(
        resolveLiveSignalFreshness(
          nowUtc: nowUtc,
          timestampMs: nowMs - 31000,
        ),
        LiveSignalFreshness.mild,
      );
      expect(
        resolveLiveSignalFreshness(
          nowUtc: nowUtc,
          timestampMs: nowMs - 120000,
        ),
        LiveSignalFreshness.mild,
      );
      expect(
        resolveLiveSignalFreshness(
          nowUtc: nowUtc,
          timestampMs: nowMs - 121000,
        ),
        LiveSignalFreshness.stale,
      );
      expect(
        resolveLiveSignalFreshness(
          nowUtc: nowUtc,
          timestampMs: nowMs - 300000,
        ),
        LiveSignalFreshness.stale,
      );
      expect(
        resolveLiveSignalFreshness(
          nowUtc: nowUtc,
          timestampMs: nowMs - 301000,
        ),
        LiveSignalFreshness.lost,
      );
    });
  });

  group('formatLastSeenAgo', () {
    test('returns null for missing timestamp', () {
      final label = formatLastSeenAgo(
        nowUtc: nowUtc,
        timestampMs: null,
      );

      expect(label, isNull);
    });

    test('formats short durations in seconds', () {
      final label = formatLastSeenAgo(
        nowUtc: nowUtc,
        timestampMs: nowMs - 20000,
      );

      expect(label, '20 sn once');
    });

    test('formats medium durations in minutes', () {
      final label = formatLastSeenAgo(
        nowUtc: nowUtc,
        timestampMs: nowMs - 180000,
      );

      expect(label, '3 dk once');
    });

    test('formats long durations in hours', () {
      final label = formatLastSeenAgo(
        nowUtc: nowUtc,
        timestampMs: nowMs - 7200000,
      );

      expect(label, '2 sa once');
    });
  });

  group('parseLiveLocationTimestampMs', () {
    test('parses numeric timestamp', () {
      final result = parseLiveLocationTimestampMs(nowMs);
      expect(result, nowMs);
    });

    test('parses integer string timestamp', () {
      final result = parseLiveLocationTimestampMs('$nowMs');
      expect(result, nowMs);
    });

    test('parses iso string timestamp', () {
      final iso = nowUtc.toIso8601String();
      final result = parseLiveLocationTimestampMs(iso);
      expect(result, nowMs);
    });

    test('returns null for unsupported type', () {
      final result = parseLiveLocationTimestampMs(<String, Object>{});
      expect(result, isNull);
    });
  });
}
