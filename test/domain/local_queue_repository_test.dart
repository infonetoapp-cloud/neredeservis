import 'dart:math' as math;

import 'package:drift/drift.dart' show OrderingTerm, Value;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/core/errors/error_codes.dart';
import 'package:neredeservis/core/exceptions/app_exception.dart';
import 'package:neredeservis/features/domain/data/local_drift_database.dart';
import 'package:neredeservis/features/domain/data/local_queue_repository.dart';
import 'package:neredeservis/features/domain/data/trip_action_queue_state_machine.dart';

void main() {
  late LocalDriftDatabase database;
  late LocalQueueRepository repository;

  setUp(() {
    database = LocalDriftDatabase(executor: NativeDatabase.memory());
    repository = LocalQueueRepository(
      database: database,
      retryPolicy: const QueueRetryPolicy(
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        jitterRatio: 0,
      ),
      random: math.Random(7),
    );
  });

  tearDown(() async {
    await database.close();
  });

  test('enqueueTripAction deduplicates by ownerUid + idempotencyKey', () async {
    final firstId = await repository.enqueueTripAction(
      ownerUid: 'owner-1',
      actionType: TripQueuedActionType.startTrip,
      payloadJson: '{"routeId":"r1"}',
      idempotencyKey: 'idem-1',
      createdAtMs: 1000,
    );
    final secondId = await repository.enqueueTripAction(
      ownerUid: 'owner-1',
      actionType: TripQueuedActionType.startTrip,
      payloadJson: '{"routeId":"r1"}',
      idempotencyKey: 'idem-1',
      createdAtMs: 1001,
    );

    expect(secondId, firstId);

    final allRows = await database.select(database.tripActionQueueTable).get();
    expect(allRows, hasLength(1));
  });

  test('claimReplayableTripActions marks records in_flight', () async {
    final id = await repository.enqueueTripAction(
      ownerUid: 'owner-1',
      actionType: TripQueuedActionType.startTrip,
      payloadJson: '{"routeId":"r1"}',
      idempotencyKey: 'idem-2',
      createdAtMs: 1000,
    );

    final claimed = await repository.claimReplayableTripActions(
      nowMs: 2000,
      limit: 10,
    );

    expect(claimed, hasLength(1));
    expect(claimed.first.id, id);
    expect(claimed.first.status, TripActionQueueStatusCodec.inFlight);
    expect(claimed.first.retryCount, 1);
  });

  test('retryable failure applies exponential backoff and returns pending',
      () async {
    final id = await repository.enqueueTripAction(
      ownerUid: 'owner-1',
      actionType: TripQueuedActionType.finishTrip,
      payloadJson: '{"tripId":"t1"}',
      idempotencyKey: 'idem-3',
      createdAtMs: 1000,
    );
    await repository.claimReplayableTripActions(nowMs: 2000);

    await repository.markTripActionRetryableFailure(
      id: id,
      nowMs: 5000,
      errorCode: 'network_unavailable',
    );

    final row = await (database.select(database.tripActionQueueTable)
          ..where((TripActionQueueTable tbl) => tbl.id.equals(id)))
        .getSingle();
    expect(row.status, TripActionQueueStatusCodec.pending);
    expect(row.failedRetryCount, 1);
    expect(row.nextRetryAt, 6000);
    expect(row.maxRetryReachedAt, isNull);
  });

  test('third retry failure moves action to dead-letter', () async {
    final id = await repository.enqueueTripAction(
      ownerUid: 'owner-1',
      actionType: TripQueuedActionType.startTrip,
      payloadJson: '{"routeId":"r2"}',
      idempotencyKey: 'idem-4',
      createdAtMs: 1000,
    );

    for (var i = 0; i < 3; i++) {
      await repository.claimReplayableTripActions(nowMs: 100000 + i);
      await repository.markTripActionRetryableFailure(
        id: id,
        nowMs: 200000 + i,
        errorCode: 'timeout',
      );
    }

    final row = await (database.select(database.tripActionQueueTable)
          ..where((TripActionQueueTable tbl) => tbl.id.equals(id)))
        .getSingle();
    expect(row.status, TripActionQueueStatusCodec.failedPermanent);
    expect(row.failedRetryCount, 3);
    expect(row.maxRetryReachedAt, isNotNull);

    final deadLetter = await repository.getDeadLetterTripActions();
    expect(deadLetter.map((TripActionQueueTableData item) => item.id),
        contains(id));

    final replayable =
        await repository.claimReplayableTripActions(nowMs: 300000);
    expect(replayable.where((TripActionQueueTableData item) => item.id == id),
        isEmpty);
  });

  test('location queue failure increases retry_count and postpones replay',
      () async {
    final id = await repository.enqueueLocationSample(
      ownerUid: 'owner-1',
      routeId: 'route-9',
      lat: 40.91,
      lng: 29.31,
      accuracy: 5.2,
      sampledAtMs: 1000,
      createdAtMs: 1000,
      tripId: 'trip-9',
      speed: 10.0,
      heading: 90.0,
    );

    await repository.markLocationSampleFailure(
      id: id,
      nowMs: 10000,
    );

    final row = await (database.select(database.locationQueueTable)
          ..where((LocationQueueTable tbl) => tbl.id.equals(id)))
        .getSingle();
    expect(row.retryCount, 1);
    expect(row.nextRetryAt, 11000);

    final nowReplayable =
        await repository.loadReplayableLocationSamples(nowMs: 10000);
    expect(nowReplayable.where((LocationQueueTableData item) => item.id == id),
        isEmpty);

    final laterReplayable =
        await repository.loadReplayableLocationSamples(nowMs: 12000);
    expect(
      laterReplayable.where((LocationQueueTableData item) => item.id == id),
      isNotEmpty,
    );

    await repository.markLocationSampleSent(id);
    final afterDelete = await (database.select(database.locationQueueTable)
          ..where((LocationQueueTable tbl) => tbl.id.equals(id)))
        .getSingleOrNull();
    expect(afterDelete, isNull);
  });

  test('location queue replay stops after max retry attempts', () async {
    final id = await repository.enqueueLocationSample(
      ownerUid: 'owner-1',
      routeId: 'route-max',
      lat: 40.91,
      lng: 29.31,
      accuracy: 5.0,
      sampledAtMs: 1000,
      createdAtMs: 1000,
    );

    await repository.markLocationSampleFailure(id: id, nowMs: 10000);
    await repository.markLocationSampleFailure(id: id, nowMs: 12000);
    await repository.markLocationSampleFailure(id: id, nowMs: 15000);

    final row = await (database.select(database.locationQueueTable)
          ..where((LocationQueueTable tbl) => tbl.id.equals(id)))
        .getSingle();
    expect(row.retryCount, 3);

    final replayable =
        await repository.loadReplayableLocationSamples(nowMs: 999999);
    expect(replayable.where((LocationQueueTableData item) => item.id == id),
        isEmpty);
  });

  test('queue size limit blocks new trip action and returns clear message',
      () async {
    final limitedRepository = LocalQueueRepository(
      database: database,
      maxQueueSize: 1,
      retryPolicy: const QueueRetryPolicy(
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        jitterRatio: 0,
      ),
      random: math.Random(7),
    );

    await limitedRepository.enqueueTripAction(
      ownerUid: 'owner-1',
      actionType: TripQueuedActionType.startTrip,
      payloadJson: '{"routeId":"r1"}',
      idempotencyKey: 'idem-limit-1',
      createdAtMs: 1000,
    );

    await expectLater(
      () => limitedRepository.enqueueTripAction(
        ownerUid: 'owner-1',
        actionType: TripQueuedActionType.finishTrip,
        payloadJson: '{"tripId":"t2"}',
        idempotencyKey: 'idem-limit-2',
        createdAtMs: 1001,
      ),
      throwsA(
        isA<AppException>()
            .having((e) => e.code, 'code', ErrorCodes.resourceExhausted)
            .having(
              (e) => e.message,
              'message',
              LocalQueueRepository.queueLimitExceededMessage,
            ),
      ),
    );
  });

  test('queue size limit blocks new location sample', () async {
    final limitedRepository = LocalQueueRepository(
      database: database,
      maxQueueSize: 1,
      retryPolicy: const QueueRetryPolicy(
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        jitterRatio: 0,
      ),
      random: math.Random(7),
    );

    await limitedRepository.enqueueLocationSample(
      ownerUid: 'owner-1',
      routeId: 'route-limit',
      lat: 40.9,
      lng: 29.3,
      accuracy: 5.0,
      sampledAtMs: 1000,
      createdAtMs: 1000,
    );

    await expectLater(
      () => limitedRepository.enqueueLocationSample(
        ownerUid: 'owner-1',
        routeId: 'route-limit',
        lat: 40.91,
        lng: 29.31,
        accuracy: 5.1,
        sampledAtMs: 1001,
        createdAtMs: 1001,
      ),
      throwsA(
        isA<AppException>().having(
          (e) => e.code,
          'code',
          ErrorCodes.resourceExhausted,
        ),
      ),
    );
  });

  test('offline-first loaders return local queue snapshots for owner',
      () async {
    await repository.enqueueTripAction(
      ownerUid: 'owner-1',
      actionType: TripQueuedActionType.startTrip,
      payloadJson: '{"routeId":"r1"}',
      idempotencyKey: 'idem-offline-1',
      createdAtMs: 1000,
    );
    await repository.enqueueTripAction(
      ownerUid: 'owner-1',
      actionType: TripQueuedActionType.finishTrip,
      payloadJson: '{"tripId":"t1"}',
      idempotencyKey: 'idem-offline-2',
      createdAtMs: 2000,
    );
    await repository.enqueueTripAction(
      ownerUid: 'owner-2',
      actionType: TripQueuedActionType.announcement,
      payloadJson: '{"message":"x"}',
      idempotencyKey: 'idem-offline-3',
      createdAtMs: 3000,
    );

    await repository.enqueueLocationSample(
      ownerUid: 'owner-1',
      routeId: 'route-a',
      lat: 40.9,
      lng: 29.3,
      accuracy: 5.0,
      sampledAtMs: 1000,
      createdAtMs: 1000,
    );
    await repository.enqueueLocationSample(
      ownerUid: 'owner-2',
      routeId: 'route-b',
      lat: 40.91,
      lng: 29.31,
      accuracy: 5.1,
      sampledAtMs: 2000,
      createdAtMs: 2000,
    );

    final owner1Actions =
        await repository.loadTripActionsOfflineFirst(ownerUid: 'owner-1');
    final owner1Locations =
        await repository.loadLocationSamplesOfflineFirst(ownerUid: 'owner-1');

    expect(owner1Actions, hasLength(2));
    expect(owner1Actions.first.createdAt, 2000);
    expect(owner1Actions.last.createdAt, 1000);

    expect(owner1Locations, hasLength(1));
    expect(owner1Locations.first.routeId, 'route-a');

    final hasPending =
        await repository.hasPendingOfflineData(ownerUid: 'owner-1');
    final hasPendingOwner3 =
        await repository.hasPendingOfflineData(ownerUid: 'owner-3');
    expect(hasPending, isTrue);
    expect(hasPendingOwner3, isFalse);
  });

  test(
      'anonymous linkWithCredential ownership transfer moves queue rows without data loss',
      () async {
    const previousOwnerUid = 'anon-owner';
    const newOwnerUid = 'registered-owner';
    const migratedAtMs = 1739999999000;

    await repository.enqueueLocationSample(
      ownerUid: previousOwnerUid,
      routeId: 'route-a',
      lat: 40.9101,
      lng: 29.3101,
      accuracy: 4.5,
      sampledAtMs: 1000,
      createdAtMs: 1000,
      tripId: 'trip-a',
      speed: 11.0,
      heading: 85.0,
    );
    await repository.enqueueLocationSample(
      ownerUid: previousOwnerUid,
      routeId: 'route-b',
      lat: 40.9102,
      lng: 29.3102,
      accuracy: 4.8,
      sampledAtMs: 1001,
      createdAtMs: 1001,
    );
    await repository.enqueueLocationSample(
      ownerUid: newOwnerUid,
      routeId: 'route-c',
      lat: 40.9103,
      lng: 29.3103,
      accuracy: 5.1,
      sampledAtMs: 1002,
      createdAtMs: 1002,
    );

    await repository.enqueueTripAction(
      ownerUid: previousOwnerUid,
      actionType: TripQueuedActionType.startTrip,
      payloadJson: '{"routeId":"route-a"}',
      idempotencyKey: 'idem-transfer-1',
      createdAtMs: 2000,
      localMeta: 'meta-old-a',
    );
    await repository.enqueueTripAction(
      ownerUid: previousOwnerUid,
      actionType: TripQueuedActionType.finishTrip,
      payloadJson: '{"tripId":"trip-a"}',
      idempotencyKey: 'idem-transfer-2',
      createdAtMs: 2001,
      localMeta: 'meta-old-b',
    );
    await repository.enqueueTripAction(
      ownerUid: newOwnerUid,
      actionType: TripQueuedActionType.announcement,
      payloadJson: '{"message":"hello"}',
      idempotencyKey: 'idem-transfer-3',
      createdAtMs: 2002,
      localMeta: 'meta-new',
    );

    final beforeLocations = await (database.select(database.locationQueueTable)
          ..orderBy([
            (LocationQueueTable tbl) => OrderingTerm.asc(tbl.id),
          ]))
        .get();
    final beforeTripActions =
        await (database.select(database.tripActionQueueTable)
              ..orderBy([
                (TripActionQueueTable tbl) => OrderingTerm.asc(tbl.id),
              ]))
            .get();

    await repository.transferLocalOwnershipAfterAccountLink(
      previousOwnerUid: previousOwnerUid,
      newOwnerUid: newOwnerUid,
      migratedAtMs: migratedAtMs,
    );

    final afterLocations = await (database.select(database.locationQueueTable)
          ..orderBy([
            (LocationQueueTable tbl) => OrderingTerm.asc(tbl.id),
          ]))
        .get();
    final afterTripActions =
        await (database.select(database.tripActionQueueTable)
              ..orderBy([
                (TripActionQueueTable tbl) => OrderingTerm.asc(tbl.id),
              ]))
            .get();

    expect(afterLocations, hasLength(beforeLocations.length));
    for (final before in beforeLocations) {
      final after = afterLocations.singleWhere((row) => row.id == before.id);
      final expectedOwner =
          before.ownerUid == previousOwnerUid ? newOwnerUid : before.ownerUid;
      expect(after.ownerUid, expectedOwner);
      expect(after.routeId, before.routeId);
      expect(after.tripId, before.tripId);
      expect(after.lat, before.lat);
      expect(after.lng, before.lng);
      expect(after.speed, before.speed);
      expect(after.heading, before.heading);
      expect(after.accuracy, before.accuracy);
      expect(after.sampledAt, before.sampledAt);
      expect(after.createdAt, before.createdAt);
      expect(after.retryCount, before.retryCount);
      expect(after.nextRetryAt, before.nextRetryAt);
    }

    expect(afterTripActions, hasLength(beforeTripActions.length));
    for (final before in beforeTripActions) {
      final after = afterTripActions.singleWhere((row) => row.id == before.id);
      final expectedOwner =
          before.ownerUid == previousOwnerUid ? newOwnerUid : before.ownerUid;
      expect(after.ownerUid, expectedOwner);
      expect(after.actionType, before.actionType);
      expect(after.status, before.status);
      expect(after.payloadJson, before.payloadJson);
      expect(after.idempotencyKey, before.idempotencyKey);
      expect(after.createdAt, before.createdAt);
      expect(after.failedRetryCount, before.failedRetryCount);
      expect(after.retryCount, before.retryCount);
      expect(after.nextRetryAt, before.nextRetryAt);
      expect(after.lastErrorCode, before.lastErrorCode);
      expect(after.lastErrorAt, before.lastErrorAt);
      expect(after.maxRetryReachedAt, before.maxRetryReachedAt);
      expect(after.localMeta, before.localMeta);
    }

    expect(
      afterLocations.where((row) => row.ownerUid == previousOwnerUid),
      isEmpty,
    );
    expect(
      afterTripActions.where((row) => row.ownerUid == previousOwnerUid),
      isEmpty,
    );

    final localMetaRows = await (database.select(database.localMetaTable)
          ..where(
            (LocalMetaTable tbl) => tbl.key.isIn(
              const [
                'ownership.current_owner_uid',
                'ownership.previous_owner_uid',
                'ownership.migrated_at_ms',
                'ownership.migration_lock',
                'ownership.migration_version',
              ],
            ),
          ))
        .get();
    final metaMap = <String, String?>{
      for (final row in localMetaRows) row.key: row.value,
    };
    expect(metaMap['ownership.current_owner_uid'], newOwnerUid);
    expect(metaMap['ownership.previous_owner_uid'], previousOwnerUid);
    expect(metaMap['ownership.migrated_at_ms'], '$migratedAtMs');
    expect(metaMap['ownership.migration_lock'], '0');
    expect(metaMap['ownership.migration_version'], '1');
  });

  test('ownership transfer no-ops when previous and new owner are equal',
      () async {
    await repository.enqueueTripAction(
      ownerUid: 'owner-1',
      actionType: TripQueuedActionType.startTrip,
      payloadJson: '{"routeId":"r1"}',
      idempotencyKey: 'idem-noop',
      createdAtMs: 5000,
    );

    await repository.transferLocalOwnershipAfterAccountLink(
      previousOwnerUid: 'owner-1',
      newOwnerUid: 'owner-1',
      migratedAtMs: 6000,
    );

    final rows = await database.select(database.tripActionQueueTable).get();
    expect(rows, hasLength(1));
    expect(rows.first.ownerUid, 'owner-1');

    final metaRows = await database.select(database.localMetaTable).get();
    final ownershipKeys =
        metaRows.where((row) => row.key.startsWith('ownership.')).toList();
    expect(ownershipKeys, isEmpty);
  });

  test('ownership transfer retries on transient error and then succeeds',
      () async {
    var attemptCallCount = 0;
    final retryingRepository = LocalQueueRepository(
      database: database,
      retryPolicy: const QueueRetryPolicy(
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        jitterRatio: 0,
      ),
      random: math.Random(7),
      ownershipTransferAttemptHook: (attempt) async {
        attemptCallCount += 1;
        if (attempt == 1) {
          throw StateError('transient lock');
        }
      },
    );

    await retryingRepository.enqueueLocationSample(
      ownerUid: 'anon-1',
      routeId: 'route-1',
      lat: 40.9,
      lng: 29.3,
      accuracy: 5.0,
      sampledAtMs: 1000,
      createdAtMs: 1000,
    );
    await retryingRepository.enqueueTripAction(
      ownerUid: 'anon-1',
      actionType: TripQueuedActionType.startTrip,
      payloadJson: '{"routeId":"route-1"}',
      idempotencyKey: 'idem-retry',
      createdAtMs: 1000,
    );

    await retryingRepository.transferLocalOwnershipAfterAccountLink(
      previousOwnerUid: 'anon-1',
      newOwnerUid: 'user-1',
      migratedAtMs: 3000,
    );

    expect(attemptCallCount, 2);

    final movedLocation = await (database.select(database.locationQueueTable)
          ..where((LocationQueueTable tbl) => tbl.ownerUid.equals('user-1')))
        .get();
    final movedActions = await (database.select(database.tripActionQueueTable)
          ..where((TripActionQueueTable tbl) => tbl.ownerUid.equals('user-1')))
        .get();
    expect(movedLocation, hasLength(1));
    expect(movedActions, hasLength(1));
  });

  test('ownership transfer keeps ownerUid unchanged when retry limit exhausted',
      () async {
    final failingRepository = LocalQueueRepository(
      database: database,
      retryPolicy: const QueueRetryPolicy(
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        jitterRatio: 0,
      ),
      random: math.Random(7),
      ownershipTransferAttemptHook: (_) async {
        throw StateError('simulated crash');
      },
      maxOwnershipTransferRetryAttempts: 2,
    );

    await failingRepository.enqueueLocationSample(
      ownerUid: 'anon-2',
      routeId: 'route-2',
      lat: 40.9,
      lng: 29.3,
      accuracy: 5.0,
      sampledAtMs: 1000,
      createdAtMs: 1000,
    );
    await failingRepository.enqueueTripAction(
      ownerUid: 'anon-2',
      actionType: TripQueuedActionType.startTrip,
      payloadJson: '{"routeId":"route-2"}',
      idempotencyKey: 'idem-rollback',
      createdAtMs: 1000,
    );

    await expectLater(
      () => failingRepository.transferLocalOwnershipAfterAccountLink(
        previousOwnerUid: 'anon-2',
        newOwnerUid: 'user-2',
        migratedAtMs: 4000,
      ),
      throwsA(
        isA<AppException>().having(
          (e) => e.code,
          'code',
          ErrorCodes.failedPrecondition,
        ),
      ),
    );

    final oldOwnerLocations = await (database
            .select(database.locationQueueTable)
          ..where((LocationQueueTable tbl) => tbl.ownerUid.equals('anon-2')))
        .get();
    final oldOwnerActions = await (database
            .select(database.tripActionQueueTable)
          ..where((TripActionQueueTable tbl) => tbl.ownerUid.equals('anon-2')))
        .get();
    expect(oldOwnerLocations, hasLength(1));
    expect(oldOwnerActions, hasLength(1));

    final lockRow = await (database.select(database.localMetaTable)
          ..where(
            (LocalMetaTable tbl) => tbl.key.equals('ownership.migration_lock'),
          ))
        .getSingleOrNull();
    expect(lockRow?.value, '1');
  });

  test('resumePendingOwnershipMigrationIfNeeded completes half migration',
      () async {
    await repository.enqueueLocationSample(
      ownerUid: 'anon-pending',
      routeId: 'route-p',
      lat: 40.9,
      lng: 29.3,
      accuracy: 5.0,
      sampledAtMs: 1000,
      createdAtMs: 1000,
    );
    await repository.enqueueTripAction(
      ownerUid: 'anon-pending',
      actionType: TripQueuedActionType.startTrip,
      payloadJson: '{"routeId":"route-p"}',
      idempotencyKey: 'idem-pending',
      createdAtMs: 1000,
    );

    await database.into(database.localMetaTable).insertOnConflictUpdate(
          LocalMetaTableCompanion.insert(
            key: 'ownership.migration_lock',
            value: const Value('1'),
          ),
        );
    await database.into(database.localMetaTable).insertOnConflictUpdate(
          LocalMetaTableCompanion.insert(
            key: 'ownership.pending_previous_owner_uid',
            value: const Value('anon-pending'),
          ),
        );
    await database.into(database.localMetaTable).insertOnConflictUpdate(
          LocalMetaTableCompanion.insert(
            key: 'ownership.pending_new_owner_uid',
            value: const Value('user-pending'),
          ),
        );
    await database.into(database.localMetaTable).insertOnConflictUpdate(
          LocalMetaTableCompanion.insert(
            key: 'ownership.pending_migrated_at_ms',
            value: const Value('5000'),
          ),
        );

    final resumed = await repository.resumePendingOwnershipMigrationIfNeeded();
    expect(resumed, isTrue);

    final newOwnerActions =
        await (database.select(database.tripActionQueueTable)
              ..where(
                (TripActionQueueTable tbl) =>
                    tbl.ownerUid.equals('user-pending'),
              ))
            .get();
    final lockRow = await (database.select(database.localMetaTable)
          ..where(
            (LocalMetaTable tbl) => tbl.key.equals('ownership.migration_lock'),
          ))
        .getSingleOrNull();
    expect(newOwnerActions, hasLength(1));
    expect(lockRow?.value, '0');
  });

  test('cache invalidation rule marks caches stale when invalidated', () async {
    await repository.enqueueTripAction(
      ownerUid: 'owner-cache',
      actionType: TripQueuedActionType.startTrip,
      payloadJson: '{"routeId":"cache"}',
      idempotencyKey: 'idem-cache-1',
      createdAtMs: 1000,
    );
    await repository.enqueueLocationSample(
      ownerUid: 'owner-cache',
      routeId: 'route-cache',
      lat: 40.9,
      lng: 29.3,
      accuracy: 5.0,
      sampledAtMs: 1000,
      createdAtMs: 1000,
    );

    expect(await repository.isTripActionCacheFresh(nowMs: 1200), isTrue);
    expect(await repository.isLocationQueueCacheFresh(nowMs: 1200), isTrue);

    await repository.invalidateQueueCache(
      reason: 'manual_reset',
      nowMs: 5000,
    );

    expect(await repository.isTripActionCacheFresh(nowMs: 5100), isFalse);
    expect(await repository.isLocationQueueCacheFresh(nowMs: 5100), isFalse);

    final reasonRow = await (database.select(database.localMetaTable)
          ..where((LocalMetaTable tbl) =>
              tbl.key.equals('cache.invalidated_reason')))
        .getSingleOrNull();
    expect(reasonRow?.value, 'manual_reset');
  });
}
