import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/subscription/domain/driver_subscription_snapshot.dart';
import 'package:neredeservis/features/subscription/presentation/paywall_copy_tr.dart';

void main() {
  group('parseDriverSubscriptionSnapshotFromDriverData', () {
    final fixedNow = DateTime.utc(2026, 2, 23, 12);

    test('returns mock defaults for null data', () {
      final result = parseDriverSubscriptionSnapshotFromDriverData(
        null,
        readNowUtc: () => fixedNow,
      );

      expect(result.status, SubscriptionUiStatus.mock);
      expect(result.trialDaysLeft, 0);
    });

    test('maps active status directly', () {
      final result = parseDriverSubscriptionSnapshotFromDriverData(
        <String, dynamic>{'subscriptionStatus': 'active'},
        readNowUtc: () => fixedNow,
      );

      expect(result.status, SubscriptionUiStatus.active);
      expect(result.trialDaysLeft, 0);
    });

    test('maps valid future trial to trialActive and computes ceil days', () {
      final result = parseDriverSubscriptionSnapshotFromDriverData(
        <String, dynamic>{
          'subscriptionStatus': 'trial',
          'trialEndsAt': DateTime.utc(2026, 2, 24, 13).toIso8601String(),
        },
        readNowUtc: () => fixedNow,
      );

      expect(result.status, SubscriptionUiStatus.trialActive);
      expect(result.trialDaysLeft, 2);
    });

    test('maps past trial to trialExpired', () {
      final result = parseDriverSubscriptionSnapshotFromDriverData(
        <String, dynamic>{
          'subscriptionStatus': 'trial',
          'trialEndsAt': DateTime.utc(2026, 2, 22, 11).toIso8601String(),
        },
        readNowUtc: () => fixedNow,
      );

      expect(result.status, SubscriptionUiStatus.trialExpired);
      expect(result.trialDaysLeft, 0);
    });

    test('invalid status falls back to mock', () {
      final result = parseDriverSubscriptionSnapshotFromDriverData(
        <String, dynamic>{'subscriptionStatus': 'weird'},
        readNowUtc: () => fixedNow,
      );

      expect(result.status, SubscriptionUiStatus.mock);
      expect(result.trialDaysLeft, 0);
    });
  });
}
