import 'execute_driver_announcement_sync_use_case.dart';

enum DriverAnnouncementHandlingMode {
  shareLink,
  showPendingSyncMessage,
  showMappedFailureMessage,
  showQueueErrorMessage,
}

class DriverAnnouncementHandlingPlan {
  const DriverAnnouncementHandlingPlan({
    required this.mode,
    required this.shouldTriggerQueueFlush,
    required this.shouldEvaluatePaywallRedirect,
    this.shareUrl,
    this.errorCode,
    this.errorMessage,
  });

  final DriverAnnouncementHandlingMode mode;
  final bool shouldTriggerQueueFlush;
  final bool shouldEvaluatePaywallRedirect;
  final String? shareUrl;
  final String? errorCode;
  final String? errorMessage;
}

class PlanDriverAnnouncementHandlingUseCase {
  const PlanDriverAnnouncementHandlingUseCase();

  DriverAnnouncementHandlingPlan execute(
    DriverAnnouncementSyncOutcome outcome,
  ) {
    switch (outcome.state) {
      case DriverAnnouncementSyncOutcomeState.synced:
        final shareUrl = outcome.shareUrl;
        if (shareUrl != null) {
          return DriverAnnouncementHandlingPlan(
            mode: DriverAnnouncementHandlingMode.shareLink,
            shouldTriggerQueueFlush: false,
            shouldEvaluatePaywallRedirect: false,
            shareUrl: shareUrl,
          );
        }
        return const DriverAnnouncementHandlingPlan(
          mode: DriverAnnouncementHandlingMode.shareLink,
          shouldTriggerQueueFlush: false,
          shouldEvaluatePaywallRedirect: false,
        );
      case DriverAnnouncementSyncOutcomeState.pendingSync:
        return DriverAnnouncementHandlingPlan(
          mode: DriverAnnouncementHandlingMode.showPendingSyncMessage,
          shouldTriggerQueueFlush: true,
          shouldEvaluatePaywallRedirect: false,
          errorCode: outcome.errorCode,
          errorMessage: outcome.errorMessage,
        );
      case DriverAnnouncementSyncOutcomeState.failed:
        return DriverAnnouncementHandlingPlan(
          mode: DriverAnnouncementHandlingMode.showMappedFailureMessage,
          shouldTriggerQueueFlush: false,
          shouldEvaluatePaywallRedirect: true,
          errorCode: outcome.errorCode,
          errorMessage: outcome.errorMessage,
        );
      case DriverAnnouncementSyncOutcomeState.queueError:
        return const DriverAnnouncementHandlingPlan(
          mode: DriverAnnouncementHandlingMode.showQueueErrorMessage,
          shouldTriggerQueueFlush: false,
          shouldEvaluatePaywallRedirect: false,
        );
    }
  }
}
