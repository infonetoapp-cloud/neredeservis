import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/plan_driver_finish_trip_commit_handling_use_case.dart';
import 'package:neredeservis/features/driver/application/resolve_driver_finish_trip_commit_feedback_message_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('ResolveDriverFinishTripCommitFeedbackMessageUseCase', () {
    const useCase = ResolveDriverFinishTripCommitFeedbackMessageUseCase();

    test('returns queue error token for queueError message kind', () {
      final message = useCase.execute(
        const DriverFinishTripCommitHandlingPlan(
          mountedResultState: DriverFinishTripCommitResultState.failed,
          unmountedResultState: DriverFinishTripCommitResultState.failed,
          telemetryResult: 'queue_error',
          messageKind: DriverFinishTripCommitMessageKind.queueError,
          shouldStopTrackingServices: false,
          shouldTrackWhenUnmounted: true,
          includeTripIdInEventTelemetry: false,
        ),
      );

      expect(message, CoreErrorFeedbackTokens.tripFinishQueueFailed);
    });

    test('returns synced message for synced message kind', () {
      final message = useCase.execute(
        const DriverFinishTripCommitHandlingPlan(
          mountedResultState: DriverFinishTripCommitResultState.synced,
          unmountedResultState: DriverFinishTripCommitResultState.failed,
          telemetryResult: 'success',
          messageKind: DriverFinishTripCommitMessageKind.synced,
          shouldStopTrackingServices: true,
          shouldTrackWhenUnmounted: false,
          includeTripIdInEventTelemetry: true,
        ),
      );

      expect(message, 'Sefer sonlandirildi.');
    });

    test('returns pending sync message for pendingSync message kind', () {
      final message = useCase.execute(
        const DriverFinishTripCommitHandlingPlan(
          mountedResultState: DriverFinishTripCommitResultState.pendingSync,
          unmountedResultState: DriverFinishTripCommitResultState.pendingSync,
          telemetryResult: 'pending_sync',
          messageKind: DriverFinishTripCommitMessageKind.pendingSync,
          shouldStopTrackingServices: true,
          shouldTrackWhenUnmounted: false,
          includeTripIdInEventTelemetry: true,
        ),
      );

      expect(message, 'Sefer lokalde sonlandirildi. Buluta yaziliyor...');
    });

    test('returns null for mapped failure to allow error resolver fallback',
        () {
      final message = useCase.execute(
        const DriverFinishTripCommitHandlingPlan(
          mountedResultState: DriverFinishTripCommitResultState.failed,
          unmountedResultState: DriverFinishTripCommitResultState.failed,
          telemetryResult: 'error',
          messageKind: DriverFinishTripCommitMessageKind.mappedFailure,
          shouldStopTrackingServices: false,
          shouldTrackWhenUnmounted: false,
          includeTripIdInEventTelemetry: false,
          errorCode: 'failed-precondition',
          errorMessage: 'TRANSITION_VERSION_MISMATCH',
        ),
      );

      expect(message, isNull);
    });
  });
}
