import 'dart:math' as math;

import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
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
}
