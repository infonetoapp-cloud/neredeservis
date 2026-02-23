import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/execute_driver_finish_trip_sync_use_case.dart';
import 'package:neredeservis/features/driver/application/plan_driver_finish_trip_commit_handling_use_case.dart';

void main() {
  group('PlanDriverFinishTripCommitHandlingUseCase', () {
    const useCase = PlanDriverFinishTripCommitHandlingUseCase();

    test('builds queue error handling plan', () {
      const syncOutcome = DriverFinishTripSyncOutcome(
        state: DriverFinishTripSyncOutcomeState.queueError,
      );

      final plan = useCase.execute(syncOutcome);

      expect(plan.mountedResultState, DriverFinishTripCommitResultState.failed);
      expect(
          plan.unmountedResultState, DriverFinishTripCommitResultState.failed);
      expect(plan.telemetryResult, 'queue_error');
      expect(plan.messageKind, DriverFinishTripCommitMessageKind.queueError);
      expect(plan.shouldStopTrackingServices, isFalse);
      expect(plan.shouldTrackWhenUnmounted, isTrue);
      expect(plan.includeTripIdInEventTelemetry, isFalse);
    });

    test('builds synced handling plan', () {
      const syncOutcome = DriverFinishTripSyncOutcome(
        state: DriverFinishTripSyncOutcomeState.synced,
      );

      final plan = useCase.execute(syncOutcome);

      expect(plan.mountedResultState, DriverFinishTripCommitResultState.synced);
      expect(
          plan.unmountedResultState, DriverFinishTripCommitResultState.failed);
      expect(plan.telemetryResult, 'success');
      expect(plan.messageKind, DriverFinishTripCommitMessageKind.synced);
      expect(plan.shouldStopTrackingServices, isTrue);
      expect(plan.shouldTrackWhenUnmounted, isFalse);
      expect(plan.includeTripIdInEventTelemetry, isTrue);
    });

    test('builds pending sync handling plan', () {
      const syncOutcome = DriverFinishTripSyncOutcome(
        state: DriverFinishTripSyncOutcomeState.pendingSync,
        errorCode: 'unavailable',
        errorMessage: 'temporary',
      );

      final plan = useCase.execute(syncOutcome);

      expect(
        plan.mountedResultState,
        DriverFinishTripCommitResultState.pendingSync,
      );
      expect(
        plan.unmountedResultState,
        DriverFinishTripCommitResultState.pendingSync,
      );
      expect(plan.telemetryResult, 'pending_sync');
      expect(plan.messageKind, DriverFinishTripCommitMessageKind.pendingSync);
      expect(plan.shouldStopTrackingServices, isTrue);
      expect(plan.shouldTrackWhenUnmounted, isFalse);
      expect(plan.includeTripIdInEventTelemetry, isTrue);
      expect(plan.telemetryCode, isNull);
      expect(plan.errorCode, 'unavailable');
    });

    test('builds failed handling plan with mapped error payload', () {
      const syncOutcome = DriverFinishTripSyncOutcome(
        state: DriverFinishTripSyncOutcomeState.failed,
        errorCode: 'failed-precondition',
        errorMessage: 'TRANSITION_VERSION_MISMATCH',
      );

      final plan = useCase.execute(syncOutcome);

      expect(plan.mountedResultState, DriverFinishTripCommitResultState.failed);
      expect(
          plan.unmountedResultState, DriverFinishTripCommitResultState.failed);
      expect(plan.telemetryResult, 'error');
      expect(plan.telemetryCode, 'failed-precondition');
      expect(plan.messageKind, DriverFinishTripCommitMessageKind.mappedFailure);
      expect(plan.shouldStopTrackingServices, isFalse);
      expect(plan.shouldTrackWhenUnmounted, isFalse);
      expect(plan.includeTripIdInEventTelemetry, isFalse);
      expect(plan.errorCode, 'failed-precondition');
      expect(plan.errorMessage, 'TRANSITION_VERSION_MISMATCH');
    });
  });
}
