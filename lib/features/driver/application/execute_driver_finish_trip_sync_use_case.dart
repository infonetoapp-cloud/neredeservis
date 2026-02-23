import '../../domain/application/trip_action_sync_service.dart';
import '../../domain/data/local_queue_repository.dart';

enum DriverFinishTripSyncOutcomeState {
  synced,
  pendingSync,
  failed,
  queueError,
}

class DriverFinishTripSyncCommand {
  const DriverFinishTripSyncCommand({
    required this.ownerUid,
    required this.tripId,
    required this.expectedTransitionVersion,
    required this.deviceId,
    required this.idempotencyKey,
  });

  final String ownerUid;
  final String tripId;
  final int expectedTransitionVersion;
  final String deviceId;
  final String idempotencyKey;
}

class DriverFinishTripSyncOutcome {
  const DriverFinishTripSyncOutcome({
    required this.state,
    this.errorCode,
    this.errorMessage,
  });

  final DriverFinishTripSyncOutcomeState state;
  final String? errorCode;
  final String? errorMessage;
}

typedef DriverFinishTripSyncExecutor = Future<TripActionExecutionResult>
    Function(
  DriverFinishTripSyncCommand command,
);

class ExecuteDriverFinishTripSyncUseCase {
  ExecuteDriverFinishTripSyncUseCase({
    TripActionSyncService? tripActionSyncService,
    DriverFinishTripSyncExecutor? executor,
  })  : _tripActionSyncService = tripActionSyncService,
        _executor = executor;

  final TripActionSyncService? _tripActionSyncService;
  final DriverFinishTripSyncExecutor? _executor;

  Future<DriverFinishTripSyncOutcome> execute(
    DriverFinishTripSyncCommand command,
  ) async {
    try {
      final execution = await _executeRemote(command);
      return switch (execution.state) {
        TripActionSyncState.synced => const DriverFinishTripSyncOutcome(
            state: DriverFinishTripSyncOutcomeState.synced,
          ),
        TripActionSyncState.pendingSync => DriverFinishTripSyncOutcome(
            state: DriverFinishTripSyncOutcomeState.pendingSync,
            errorCode: execution.errorCode,
            errorMessage: execution.errorMessage,
          ),
        TripActionSyncState.failed => DriverFinishTripSyncOutcome(
            state: DriverFinishTripSyncOutcomeState.failed,
            errorCode: execution.errorCode,
            errorMessage: execution.errorMessage,
          ),
      };
    } catch (_) {
      return const DriverFinishTripSyncOutcome(
        state: DriverFinishTripSyncOutcomeState.queueError,
      );
    }
  }

  Future<TripActionExecutionResult> _executeRemote(
    DriverFinishTripSyncCommand command,
  ) {
    if (_executor != null) {
      return _executor(command);
    }
    final service = _tripActionSyncService;
    if (service == null) {
      throw StateError('TripActionSyncService or executor must be provided.');
    }
    return service.executeOrQueue(
      ownerUid: command.ownerUid,
      actionType: TripQueuedActionType.finishTrip,
      callableName: 'finishTrip',
      payload: <String, dynamic>{
        'tripId': command.tripId,
        'deviceId': command.deviceId,
        'idempotencyKey': command.idempotencyKey,
        'expectedTransitionVersion': command.expectedTransitionVersion,
      },
      idempotencyKey: command.idempotencyKey,
    );
  }
}
