import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/application/trip_action_sync_service.dart';
import 'package:neredeservis/features/driver/application/execute_driver_announcement_sync_use_case.dart';

void main() {
  group('ExecuteDriverAnnouncementSyncUseCase', () {
    const command = DriverAnnouncementSyncCommand(
      ownerUid: 'driver-1',
      routeId: 'route-1',
      customText: 'Servis 10 dk gecikmeli.',
      idempotencyKey: 'announcement_route-1',
    );

    test('maps synced state and trims shareUrl', () async {
      final useCase = ExecuteDriverAnnouncementSyncUseCase(
        executor: (_) async => const TripActionExecutionResult(
          state: TripActionSyncState.synced,
          callableName: 'sendDriverAnnouncement',
          responseData: <String, dynamic>{'shareUrl': ' https://x.test/a '},
        ),
      );

      final result = await useCase.execute(command);

      expect(result.state, DriverAnnouncementSyncOutcomeState.synced);
      expect(result.shareUrl, 'https://x.test/a');
      expect(result.errorCode, isNull);
    });

    test('maps synced state with empty shareUrl to null', () async {
      final useCase = ExecuteDriverAnnouncementSyncUseCase(
        executor: (_) async => const TripActionExecutionResult(
          state: TripActionSyncState.synced,
          callableName: 'sendDriverAnnouncement',
          responseData: <String, dynamic>{'shareUrl': '   '},
        ),
      );

      final result = await useCase.execute(command);

      expect(result.state, DriverAnnouncementSyncOutcomeState.synced);
      expect(result.shareUrl, isNull);
    });

    test('maps pending sync state', () async {
      final useCase = ExecuteDriverAnnouncementSyncUseCase(
        executor: (_) async => const TripActionExecutionResult(
          state: TripActionSyncState.pendingSync,
          callableName: 'sendDriverAnnouncement',
          errorCode: 'unavailable',
          errorMessage: 'temporary',
        ),
      );

      final result = await useCase.execute(command);

      expect(result.state, DriverAnnouncementSyncOutcomeState.pendingSync);
      expect(result.errorCode, 'unavailable');
      expect(result.errorMessage, 'temporary');
    });

    test('maps failed state', () async {
      final useCase = ExecuteDriverAnnouncementSyncUseCase(
        executor: (_) async => const TripActionExecutionResult(
          state: TripActionSyncState.failed,
          callableName: 'sendDriverAnnouncement',
          errorCode: 'permission-denied',
          errorMessage: 'premium entitlement required',
        ),
      );

      final result = await useCase.execute(command);

      expect(result.state, DriverAnnouncementSyncOutcomeState.failed);
      expect(result.errorCode, 'permission-denied');
      expect(result.errorMessage, 'premium entitlement required');
    });

    test('maps thrown executor errors to queueError', () async {
      final useCase = ExecuteDriverAnnouncementSyncUseCase(
        executor: (_) async => throw StateError('queue failed'),
      );

      final result = await useCase.execute(command);

      expect(result.state, DriverAnnouncementSyncOutcomeState.queueError);
    });
  });
}
