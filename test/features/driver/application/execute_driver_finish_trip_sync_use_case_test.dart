import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/application/trip_action_sync_service.dart';
import 'package:neredeservis/features/driver/application/execute_driver_finish_trip_sync_use_case.dart';

void main() {
  group('ExecuteDriverFinishTripSyncUseCase', () {
    const command = DriverFinishTripSyncCommand(
      ownerUid: 'driver-1',
      tripId: 'trip-1',
      expectedTransitionVersion: 3,
      deviceId: 'android_abc',
      idempotencyKey: 'finish_trip_trip-1',
    );

    test('maps synced state', () async {
      final useCase = ExecuteDriverFinishTripSyncUseCase(
        executor: (_) async => const TripActionExecutionResult(
          state: TripActionSyncState.synced,
          callableName: 'finishTrip',
        ),
      );

      final result = await useCase.execute(command);

      expect(result.state, DriverFinishTripSyncOutcomeState.synced);
      expect(result.errorCode, isNull);
    });

    test('maps pending sync state', () async {
      final useCase = ExecuteDriverFinishTripSyncUseCase(
        executor: (_) async => const TripActionExecutionResult(
          state: TripActionSyncState.pendingSync,
          callableName: 'finishTrip',
          errorCode: 'unavailable',
          errorMessage: 'temporary',
        ),
      );

      final result = await useCase.execute(command);

      expect(result.state, DriverFinishTripSyncOutcomeState.pendingSync);
      expect(result.errorCode, 'unavailable');
    });

    test('maps failed state with error details', () async {
      final useCase = ExecuteDriverFinishTripSyncUseCase(
        executor: (_) async => const TripActionExecutionResult(
          state: TripActionSyncState.failed,
          callableName: 'finishTrip',
          errorCode: 'failed-precondition',
          errorMessage: 'TRANSITION_VERSION_MISMATCH',
        ),
      );

      final result = await useCase.execute(command);

      expect(result.state, DriverFinishTripSyncOutcomeState.failed);
      expect(result.errorCode, 'failed-precondition');
      expect(result.errorMessage, 'TRANSITION_VERSION_MISMATCH');
    });

    test('maps thrown executor errors to queueError', () async {
      final useCase = ExecuteDriverFinishTripSyncUseCase(
        executor: (_) async => throw StateError('queue failed'),
      );

      final result = await useCase.execute(command);

      expect(result.state, DriverFinishTripSyncOutcomeState.queueError);
    });
  });
}
