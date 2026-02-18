import 'package:drift/drift.dart' show Value;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/data/local_drift_database.dart';
import 'package:neredeservis/features/domain/data/trip_action_queue_state_machine.dart';

void main() {
  late LocalDriftDatabase database;
  late TripActionQueueStateMachine machine;
  var sequence = 0;

  setUp(() {
    database = LocalDriftDatabase(executor: NativeDatabase.memory());
    machine = TripActionQueueStateMachine(database);
  });

  tearDown(() async {
    await database.close();
  });

  Future<int> insertAction({
    required String status,
    int failedRetryCount = 0,
    int retryCount = 0,
    int? nextRetryAt,
    int createdAt = 1000,
  }) {
    sequence += 1;
    return database.into(database.tripActionQueueTable).insert(
          TripActionQueueTableCompanion.insert(
            ownerUid: 'owner-1',
            actionType: 'start_trip',
            status: Value(status),
            payloadJson: '{"seq":$sequence}',
            idempotencyKey: 'idem-$sequence',
            createdAt: Value(createdAt),
            failedRetryCount: Value(failedRetryCount),
            retryCount: Value(retryCount),
            nextRetryAt:
                nextRetryAt == null ? const Value.absent() : Value(nextRetryAt),
          ),
        );
  }

  test('pending action moves to in_flight and retry_count increments',
      () async {
    final id = await insertAction(
      status: TripActionQueueStatusCodec.pending,
      retryCount: 0,
    );

    await machine.markInFlight(id);

    final row = await (database.select(database.tripActionQueueTable)
          ..where((TripActionQueueTable tbl) => tbl.id.equals(id)))
        .getSingle();
    expect(row.status, TripActionQueueStatusCodec.inFlight);
    expect(row.retryCount, 1);
  });

  test('failure before max attempt returns action to pending', () async {
    final id = await insertAction(
      status: TripActionQueueStatusCodec.inFlight,
      failedRetryCount: 1,
      retryCount: 1,
    );

    await machine.markRetryFailure(
      id: id,
      nowMs: 2000,
      nextRetryAtMs: 5000,
      errorCode: 'network_unavailable',
    );

    final row = await (database.select(database.tripActionQueueTable)
          ..where((TripActionQueueTable tbl) => tbl.id.equals(id)))
        .getSingle();
    expect(row.status, TripActionQueueStatusCodec.pending);
    expect(row.failedRetryCount, 2);
    expect(row.nextRetryAt, 5000);
    expect(row.maxRetryReachedAt, isNull);
  });

  test('third failure moves action to failed_permanent and stops replay',
      () async {
    final id = await insertAction(
      status: TripActionQueueStatusCodec.inFlight,
      failedRetryCount: 2,
      retryCount: 2,
    );

    await machine.markRetryFailure(
      id: id,
      nowMs: 7000,
      nextRetryAtMs: 9000,
      errorCode: 'timeout',
    );

    final row = await (database.select(database.tripActionQueueTable)
          ..where((TripActionQueueTable tbl) => tbl.id.equals(id)))
        .getSingle();
    expect(row.status, TripActionQueueStatusCodec.failedPermanent);
    expect(row.failedRetryCount, 3);
    expect(row.nextRetryAt, isNull);
    expect(row.maxRetryReachedAt, 7000);

    final replayable = await machine.loadReplayable(nowMs: 10000);
    expect(replayable.where((TripActionQueueTableData item) => item.id == id),
        isEmpty);
  });

  test('loadReplayable excludes future and failed_permanent records', () async {
    final duePendingId = await insertAction(
      status: TripActionQueueStatusCodec.pending,
      failedRetryCount: 0,
      nextRetryAt: 1000,
      createdAt: 1000,
    );
    await insertAction(
      status: TripActionQueueStatusCodec.pending,
      failedRetryCount: 0,
      nextRetryAt: 9000,
      createdAt: 1001,
    );
    await insertAction(
      status: TripActionQueueStatusCodec.failedPermanent,
      failedRetryCount: 3,
      nextRetryAt: 1000,
      createdAt: 1002,
    );
    await insertAction(
      status: TripActionQueueStatusCodec.pending,
      failedRetryCount: 3,
      nextRetryAt: 1000,
      createdAt: 1003,
    );

    final replayable = await machine.loadReplayable(nowMs: 5000);
    final replayableIds =
        replayable.map((TripActionQueueTableData row) => row.id).toSet();

    expect(replayableIds, contains(duePendingId));
    expect(replayableIds.length, 1);
  });
}
