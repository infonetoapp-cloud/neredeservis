import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/data/local_queue_repository.dart';

void main() {
  group('QueueRetryPolicy', () {
    test('uses max 3 attempts by default', () {
      const policy = QueueRetryPolicy();

      expect(policy.maxRetryAttempts, 3);
      expect(policy.willReachMaxOnFailure(failedRetryCount: 0), isFalse);
      expect(policy.willReachMaxOnFailure(failedRetryCount: 1), isFalse);
      expect(policy.willReachMaxOnFailure(failedRetryCount: 2), isTrue);
    });

    test('computeDelayMs applies exponential backoff without jitter', () {
      const policy = QueueRetryPolicy(
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        jitterRatio: 0,
      );
      final random = math.Random(7);

      expect(policy.computeDelayMs(attempt: 1, random: random), 1000);
      expect(policy.computeDelayMs(attempt: 2, random: random), 2000);
      expect(policy.computeDelayMs(attempt: 3, random: random), 4000);
      expect(policy.computeDelayMs(attempt: 10, random: random), 10000);
    });

    test('computeDelayMs keeps jittered value within min/max bounds', () {
      const policy = QueueRetryPolicy(
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        jitterRatio: 0.2,
      );
      final random = math.Random(3);

      final delay = policy.computeDelayMs(attempt: 2, random: random);
      expect(delay, inInclusiveRange(1600, 2400));
    });
  });
}
