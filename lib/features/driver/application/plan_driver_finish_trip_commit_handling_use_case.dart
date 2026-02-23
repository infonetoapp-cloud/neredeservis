import 'execute_driver_finish_trip_sync_use_case.dart';

enum DriverFinishTripCommitResultState {
  synced,
  pendingSync,
  failed,
}

enum DriverFinishTripCommitMessageKind {
  queueError,
  synced,
  pendingSync,
  mappedFailure,
}

class DriverFinishTripCommitHandlingPlan {
  const DriverFinishTripCommitHandlingPlan({
    required this.mountedResultState,
    required this.unmountedResultState,
    required this.telemetryResult,
    required this.messageKind,
    required this.shouldStopTrackingServices,
    required this.shouldTrackWhenUnmounted,
    required this.includeTripIdInEventTelemetry,
    this.telemetryCode,
    this.errorCode,
    this.errorMessage,
  });

  final DriverFinishTripCommitResultState mountedResultState;
  final DriverFinishTripCommitResultState unmountedResultState;
  final String telemetryResult;
  final String? telemetryCode;
  final DriverFinishTripCommitMessageKind messageKind;
  final bool shouldStopTrackingServices;
  final bool shouldTrackWhenUnmounted;
  final bool includeTripIdInEventTelemetry;
  final String? errorCode;
  final String? errorMessage;
}

class PlanDriverFinishTripCommitHandlingUseCase {
  const PlanDriverFinishTripCommitHandlingUseCase();

  DriverFinishTripCommitHandlingPlan execute(
    DriverFinishTripSyncOutcome syncOutcome,
  ) {
    switch (syncOutcome.state) {
      case DriverFinishTripSyncOutcomeState.queueError:
        return const DriverFinishTripCommitHandlingPlan(
          mountedResultState: DriverFinishTripCommitResultState.failed,
          unmountedResultState: DriverFinishTripCommitResultState.failed,
          telemetryResult: 'queue_error',
          messageKind: DriverFinishTripCommitMessageKind.queueError,
          shouldStopTrackingServices: false,
          shouldTrackWhenUnmounted: true,
          includeTripIdInEventTelemetry: false,
        );
      case DriverFinishTripSyncOutcomeState.synced:
        return const DriverFinishTripCommitHandlingPlan(
          mountedResultState: DriverFinishTripCommitResultState.synced,
          unmountedResultState: DriverFinishTripCommitResultState.failed,
          telemetryResult: 'success',
          messageKind: DriverFinishTripCommitMessageKind.synced,
          shouldStopTrackingServices: true,
          shouldTrackWhenUnmounted: false,
          includeTripIdInEventTelemetry: true,
        );
      case DriverFinishTripSyncOutcomeState.pendingSync:
        return DriverFinishTripCommitHandlingPlan(
          mountedResultState: DriverFinishTripCommitResultState.pendingSync,
          unmountedResultState: DriverFinishTripCommitResultState.pendingSync,
          telemetryResult: 'pending_sync',
          messageKind: DriverFinishTripCommitMessageKind.pendingSync,
          shouldStopTrackingServices: true,
          shouldTrackWhenUnmounted: false,
          includeTripIdInEventTelemetry: true,
          errorCode: syncOutcome.errorCode,
          errorMessage: syncOutcome.errorMessage,
        );
      case DriverFinishTripSyncOutcomeState.failed:
        return DriverFinishTripCommitHandlingPlan(
          mountedResultState: DriverFinishTripCommitResultState.failed,
          unmountedResultState: DriverFinishTripCommitResultState.failed,
          telemetryResult: 'error',
          telemetryCode: syncOutcome.errorCode,
          messageKind: DriverFinishTripCommitMessageKind.mappedFailure,
          shouldStopTrackingServices: false,
          shouldTrackWhenUnmounted: false,
          includeTripIdInEventTelemetry: false,
          errorCode: syncOutcome.errorCode,
          errorMessage: syncOutcome.errorMessage,
        );
    }
  }
}
