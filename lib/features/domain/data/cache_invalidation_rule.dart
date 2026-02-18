class CacheInvalidationRule {
  const CacheInvalidationRule({
    this.tripActionTtlMs = 30000,
    this.locationSampleTtlMs = 15000,
  });

  final int tripActionTtlMs;
  final int locationSampleTtlMs;

  bool isFresh({
    required int lastUpdatedAtMs,
    required int nowMs,
    required int ttlMs,
  }) {
    if (lastUpdatedAtMs <= 0) {
      return false;
    }
    return nowMs - lastUpdatedAtMs <= ttlMs;
  }

  bool shouldInvalidate({
    required int lastUpdatedAtMs,
    required int nowMs,
    required int ttlMs,
  }) {
    return !isFresh(
      lastUpdatedAtMs: lastUpdatedAtMs,
      nowMs: nowMs,
      ttlMs: ttlMs,
    );
  }
}
