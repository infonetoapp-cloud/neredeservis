import 'dart:io';

import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/application/trip_action_sync_service.dart';
import 'package:neredeservis/features/domain/data/local_drift_database.dart';
import 'package:neredeservis/features/domain/data/local_queue_repository.dart';

void main() {
  group('TripActionSyncService', () {
    LocalDriftDatabase? database;
    LocalQueueRepository? repository;

    tearDown(() async {
      if (database != null) {
        await database!.close();
      }
      database = null;
      repository = null;
    });

    test('executeOrQueue stores pending_sync row when remote call fails',
        () async {
      database = LocalDriftDatabase(executor: NativeDatabase.memory());
      repository = LocalQueueRepository(database: database!);
      final service = TripActionSyncService(
        localQueueRepository: repository!,
        remoteExecutor: (_, __) => Future<Map<String, dynamic>>.error(
          Exception('network-down'),
        ),
      );

      final result = await service.executeOrQueue(
        ownerUid: 'driver-1',
        actionType: TripQueuedActionType.finishTrip,
        callableName: 'finishTrip',
        payload: const <String, dynamic>{
          'tripId': 'trip-1',
          'deviceId': 'android_driver',
          'idempotencyKey': 'idem-finish-1',
          'expectedTransitionVersion': 1,
        },
        idempotencyKey: 'idem-finish-1',
      );

      expect(result.state, TripActionSyncState.pendingSync);
      expect(result.queueId, isNotNull);

      final pending =
          await repository!.loadPendingTripActions(ownerUid: 'driver-1');
      expect(pending, hasLength(1));
      expect(pending.first.actionType, 'finish_trip');
    });

    test('replay clears queued finishTrip after app reopen (325C)', () async {
      final tempDir = await Directory.systemTemp.createTemp(
        'ns_trip_action_replay',
      );
      final dbFile =
          File('${tempDir.path}${Platform.pathSeparator}trip_action_queue.db');
      try {
        final firstDb = LocalDriftDatabase(executor: NativeDatabase(dbFile));
        final firstRepo = LocalQueueRepository(database: firstDb);
        final firstService = TripActionSyncService(
          localQueueRepository: firstRepo,
          remoteExecutor: (_, __) => Future<Map<String, dynamic>>.error(
            Exception('offline'),
          ),
        );

        final enqueueResult = await firstService.executeOrQueue(
          ownerUid: 'driver-2',
          actionType: TripQueuedActionType.finishTrip,
          callableName: 'finishTrip',
          payload: const <String, dynamic>{
            'tripId': 'trip-2',
            'deviceId': 'android_driver',
            'idempotencyKey': 'idem-finish-2',
            'expectedTransitionVersion': 2,
          },
          idempotencyKey: 'idem-finish-2',
        );
        expect(enqueueResult.state, TripActionSyncState.pendingSync);
        await firstDb.close();

        database = LocalDriftDatabase(executor: NativeDatabase(dbFile));
        repository = LocalQueueRepository(database: database!);
        final secondService = TripActionSyncService(
          localQueueRepository: repository!,
          remoteExecutor: (_, __) async => const <String, dynamic>{
            'status': 'completed',
          },
        );

        final summary = await secondService.flushQueued(ownerUid: 'driver-2');
        expect(summary.syncedCount, 1);
        expect(summary.pendingRetryCount, 0);
        expect(summary.permanentFailureCount, 0);

        final hasPending = await repository!.hasPendingOfflineData(
          ownerUid: 'driver-2',
        );
        expect(hasPending, isFalse);
      } finally {
        if (database != null) {
          await database!.close();
          database = null;
          repository = null;
        }
        if (tempDir.existsSync()) {
          tempDir.deleteSync(recursive: true);
        }
      }
    });

    test('flushQueued flags permanent failure after max retry attempts (326A)',
        () async {
      database = LocalDriftDatabase(executor: NativeDatabase.memory());
      repository = LocalQueueRepository(database: database!);
      var nowUtc = DateTime.utc(2026, 2, 19, 12, 0, 0);
      final service = TripActionSyncService(
        localQueueRepository: repository!,
        remoteExecutor: (_, __) => Future<Map<String, dynamic>>.error(
          Exception('still-offline'),
        ),
        nowUtc: () => nowUtc,
      );

      await service.executeOrQueue(
        ownerUid: 'driver-3',
        actionType: TripQueuedActionType.finishTrip,
        callableName: 'finishTrip',
        payload: const <String, dynamic>{
          'tripId': 'trip-3',
          'deviceId': 'android_driver',
          'idempotencyKey': 'idem-finish-3',
          'expectedTransitionVersion': 3,
        },
        idempotencyKey: 'idem-finish-3',
      );

      nowUtc = nowUtc.add(const Duration(minutes: 1));
      await service.flushQueued(ownerUid: 'driver-3');
      nowUtc = nowUtc.add(const Duration(minutes: 1));
      await service.flushQueued(ownerUid: 'driver-3');
      nowUtc = nowUtc.add(const Duration(minutes: 1));
      final thirdSummary = await service.flushQueued(ownerUid: 'driver-3');

      expect(thirdSummary.permanentFailureCount, 1);
      final hasManualIntervention =
          await service.hasManualInterventionRequirement(ownerUid: 'driver-3');
      expect(hasManualIntervention, isTrue);
    });
  });
}
