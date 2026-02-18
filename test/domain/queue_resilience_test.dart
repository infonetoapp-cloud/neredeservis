import 'dart:io';
import 'dart:math' as math;

import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/data/local_drift_database.dart';
import 'package:neredeservis/features/domain/data/local_queue_repository.dart';
import 'package:neredeservis/features/domain/data/trip_action_queue_state_machine.dart';

void main() {
  group('Queue resilience', () {
    test('network failure keeps action retryable with backoff', () async {
      final db = LocalDriftDatabase(executor: NativeDatabase.memory());
      final repo = LocalQueueRepository(
        database: db,
        retryPolicy: const QueueRetryPolicy(
          baseDelayMs: 1000,
          maxDelayMs: 10000,
          jitterRatio: 0,
        ),
        random: math.Random(1),
      );
      addTearDown(db.close);

      final id = await repo.enqueueTripAction(
        ownerUid: 'owner-1',
        actionType: TripQueuedActionType.startTrip,
        payloadJson: '{"routeId":"r1"}',
        idempotencyKey: 'idem-net-1',
        createdAtMs: 1000,
      );

      await repo.claimReplayableTripActions(nowMs: 2000);
      await repo.markTripActionRetryableFailure(
        id: id,
        nowMs: 3000,
        errorCode: 'network_down',
      );

      final row = await (db.select(db.tripActionQueueTable)
            ..where((TripActionQueueTable tbl) => tbl.id.equals(id)))
          .getSingle();

      expect(row.status, TripActionQueueStatusCodec.pending);
      expect(row.failedRetryCount, 1);
      expect(row.nextRetryAt, 4000);
    });

    test('app kill simulation keeps queue records after reopen', () async {
      final tempDir = await Directory.systemTemp.createTemp('ns_queue_resume');
      final dbFile =
          File('${tempDir.path}${Platform.pathSeparator}queue_resume.db');

      try {
        final db1 = LocalDriftDatabase(executor: NativeDatabase(dbFile));
        final repo1 = LocalQueueRepository(
          database: db1,
          random: math.Random(1),
        );

        await repo1.enqueueTripAction(
          ownerUid: 'owner-1',
          actionType: TripQueuedActionType.finishTrip,
          payloadJson: '{"tripId":"t1"}',
          idempotencyKey: 'idem-resume-1',
          createdAtMs: 1000,
        );
        await db1.close();

        final db2 = LocalDriftDatabase(executor: NativeDatabase(dbFile));
        final repo2 = LocalQueueRepository(
          database: db2,
          random: math.Random(2),
        );

        final claimed = await repo2.claimReplayableTripActions(nowMs: 5000);
        expect(claimed, hasLength(1));
        expect(claimed.first.idempotencyKey, 'idem-resume-1');
        await db2.close();
      } finally {
        if (await dbFile.exists()) {
          await dbFile.delete();
        }
        await tempDir.delete(recursive: true);
      }
    });

    test('duplicate enqueue keeps single idempotency key record', () async {
      final db = LocalDriftDatabase(executor: NativeDatabase.memory());
      final repo = LocalQueueRepository(database: db, random: math.Random(1));
      addTearDown(db.close);

      final first = await repo.enqueueTripAction(
        ownerUid: 'owner-1',
        actionType: TripQueuedActionType.startTrip,
        payloadJson: '{"routeId":"r1"}',
        idempotencyKey: 'idem-dup-1',
        createdAtMs: 1000,
      );
      final second = await repo.enqueueTripAction(
        ownerUid: 'owner-1',
        actionType: TripQueuedActionType.startTrip,
        payloadJson: '{"routeId":"r1"}',
        idempotencyKey: 'idem-dup-1',
        createdAtMs: 2000,
      );

      expect(second, first);
      final allRows = await db.select(db.tripActionQueueTable).get();
      expect(
          allRows.where((TripActionQueueTableData row) =>
              row.idempotencyKey == 'idem-dup-1'),
          hasLength(1));
    });

    test('stale replay check skips live path for old samples', () {
      expect(
        LocalQueueRepository.shouldSkipLiveReplay(
          sampledAtMs: 1000,
          nowMs: 62001,
        ),
        isTrue,
      );

      expect(
        LocalQueueRepository.shouldSkipLiveReplay(
          sampledAtMs: 1000,
          nowMs: 61000,
        ),
        isFalse,
      );
    });
  });
}
