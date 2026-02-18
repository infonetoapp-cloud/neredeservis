import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/data/cache_invalidation_rule.dart';

void main() {
  group('CacheInvalidationRule', () {
    test('isFresh returns true within ttl window', () {
      const rule = CacheInvalidationRule(tripActionTtlMs: 30000);

      final fresh = rule.isFresh(
        lastUpdatedAtMs: 1000,
        nowMs: 25000,
        ttlMs: rule.tripActionTtlMs,
      );

      expect(fresh, isTrue);
    });

    test('isFresh returns false when timestamp is missing or stale', () {
      const rule = CacheInvalidationRule(locationSampleTtlMs: 15000);

      expect(
        rule.isFresh(
          lastUpdatedAtMs: 0,
          nowMs: 1000,
          ttlMs: rule.locationSampleTtlMs,
        ),
        isFalse,
      );
      expect(
        rule.isFresh(
          lastUpdatedAtMs: 1000,
          nowMs: 20000,
          ttlMs: rule.locationSampleTtlMs,
        ),
        isFalse,
      );
    });

    test('shouldInvalidate mirrors freshness result', () {
      const rule = CacheInvalidationRule();

      expect(
        rule.shouldInvalidate(
          lastUpdatedAtMs: 1000,
          nowMs: 5000,
          ttlMs: 10000,
        ),
        isFalse,
      );
      expect(
        rule.shouldInvalidate(
          lastUpdatedAtMs: 1000,
          nowMs: 20000,
          ttlMs: 10000,
        ),
        isTrue,
      );
    });
  });
}
