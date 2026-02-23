import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/execute_driver_announcement_sync_use_case.dart';
import 'package:neredeservis/features/driver/application/plan_driver_announcement_handling_use_case.dart';

void main() {
  group('PlanDriverAnnouncementHandlingUseCase', () {
    const useCase = PlanDriverAnnouncementHandlingUseCase();

    test('builds share-link plan for synced result with shareUrl', () {
      const outcome = DriverAnnouncementSyncOutcome(
        state: DriverAnnouncementSyncOutcomeState.synced,
        shareUrl: 'https://x.test/share',
      );

      final plan = useCase.execute(outcome);

      expect(plan.mode, DriverAnnouncementHandlingMode.shareLink);
      expect(plan.shareUrl, 'https://x.test/share');
      expect(plan.shouldTriggerQueueFlush, isFalse);
      expect(plan.shouldEvaluatePaywallRedirect, isFalse);
    });

    test('builds share-link mode plan for synced result without shareUrl', () {
      const outcome = DriverAnnouncementSyncOutcome(
        state: DriverAnnouncementSyncOutcomeState.synced,
      );

      final plan = useCase.execute(outcome);

      expect(plan.mode, DriverAnnouncementHandlingMode.shareLink);
      expect(plan.shareUrl, isNull);
    });

    test('builds pending-sync plan with queue flush', () {
      const outcome = DriverAnnouncementSyncOutcome(
        state: DriverAnnouncementSyncOutcomeState.pendingSync,
        errorCode: 'unavailable',
        errorMessage: 'temporary',
      );

      final plan = useCase.execute(outcome);

      expect(plan.mode, DriverAnnouncementHandlingMode.showPendingSyncMessage);
      expect(plan.shouldTriggerQueueFlush, isTrue);
      expect(plan.shouldEvaluatePaywallRedirect, isFalse);
      expect(plan.errorCode, 'unavailable');
      expect(plan.errorMessage, 'temporary');
    });

    test('builds failed plan with paywall evaluation enabled', () {
      const outcome = DriverAnnouncementSyncOutcome(
        state: DriverAnnouncementSyncOutcomeState.failed,
        errorCode: 'permission-denied',
        errorMessage: 'premium entitlement required',
      );

      final plan = useCase.execute(outcome);

      expect(
          plan.mode, DriverAnnouncementHandlingMode.showMappedFailureMessage);
      expect(plan.shouldTriggerQueueFlush, isFalse);
      expect(plan.shouldEvaluatePaywallRedirect, isTrue);
      expect(plan.errorCode, 'permission-denied');
      expect(plan.errorMessage, 'premium entitlement required');
    });

    test('builds queue-error plan', () {
      const outcome = DriverAnnouncementSyncOutcome(
        state: DriverAnnouncementSyncOutcomeState.queueError,
      );

      final plan = useCase.execute(outcome);

      expect(plan.mode, DriverAnnouncementHandlingMode.showQueueErrorMessage);
      expect(plan.shouldTriggerQueueFlush, isFalse);
      expect(plan.shouldEvaluatePaywallRedirect, isFalse);
    });
  });
}
