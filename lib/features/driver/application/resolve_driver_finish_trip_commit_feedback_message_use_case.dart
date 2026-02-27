import '../../../ui/tokens/error_feedback_tokens.dart';
import 'plan_driver_finish_trip_commit_handling_use_case.dart';

class ResolveDriverFinishTripCommitFeedbackMessageUseCase {
  const ResolveDriverFinishTripCommitFeedbackMessageUseCase();

  String? execute(DriverFinishTripCommitHandlingPlan handlingPlan) {
    switch (handlingPlan.messageKind) {
      case DriverFinishTripCommitMessageKind.queueError:
        return CoreErrorFeedbackTokens.tripFinishQueueFailed;
      case DriverFinishTripCommitMessageKind.synced:
        return 'Sefer sonlandirildi.';
      case DriverFinishTripCommitMessageKind.pendingSync:
        return 'Sefer lokalde sonlandirildi. Buluta yaziliyor...';
      case DriverFinishTripCommitMessageKind.mappedFailure:
        return null;
    }
  }
}
