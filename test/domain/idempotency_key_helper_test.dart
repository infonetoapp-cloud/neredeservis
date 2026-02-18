import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/data/idempotency_key_helper.dart';

void main() {
  test('generate creates valid idempotency key format', () {
    final helper = IdempotencyKeyHelper(random: math.Random(7));

    final key = helper.generate(
      action: 'start_trip',
      subject: 'route-abc',
      nowUtc: DateTime.utc(2026, 2, 18, 12, 0, 0),
    );

    expect(
      key,
      matches(
        RegExp(
          r'^start_trip-route_abc-[a-z0-9]+-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$',
        ),
      ),
    );
    expect(helper.isValid(key), isTrue);
  });

  test('generate produces unique values for repeated calls', () {
    final helper = IdempotencyKeyHelper(random: math.Random(42));
    final now = DateTime.utc(2026, 2, 18, 12, 0, 0);

    final first = helper.generate(
      action: 'finish_trip',
      subject: 'trip-1',
      nowUtc: now,
    );
    final second = helper.generate(
      action: 'finish_trip',
      subject: 'trip-1',
      nowUtc: now,
    );

    expect(first, isNot(second));
    expect(helper.isValid(first), isTrue);
    expect(helper.isValid(second), isTrue);
  });

  test('buildTripRequestDocId follows {uid}_{idempotencyKey} contract', () {
    final helper = IdempotencyKeyHelper(random: math.Random(1));
    const key = 'start_trip-route_1-lz4x5k-ABCDEFGHJK';

    final docId = helper.buildTripRequestDocId(
      uid: 'UID-123/ABC',
      idempotencyKey: key,
    );

    expect(docId, 'uid_123_abc_$key');
  });

  test('isValid rejects malformed key', () {
    final helper = IdempotencyKeyHelper(random: math.Random(1));
    expect(helper.isValid('bad-key'), isFalse);
    expect(helper.isValid('start-trip-route-random'), isFalse);
  });
}
