import 'package:drift/drift.dart';

import 'local_drift_database.dart';

enum TripActionQueueStatus {
  pending,
  inFlight,
  failedPermanent,
}

class TripActionQueueStatusCodec {
  const TripActionQueueStatusCodec._();

  static const String pending = 'pending';
  static const String inFlight = 'in_flight';
  static const String failedPermanent = 'failed_permanent';

  static String toRaw(TripActionQueueStatus status) {
    switch (status) {
      case TripActionQueueStatus.pending:
        return pending;
      case TripActionQueueStatus.inFlight:
        return inFlight;
      case TripActionQueueStatus.failedPermanent:
        return failedPermanent;
    }
  }

  static TripActionQueueStatus fromRaw(String? raw) {
    switch (raw) {
      case inFlight:
        return TripActionQueueStatus.inFlight;
      case failedPermanent:
        return TripActionQueueStatus.failedPermanent;
      case pending:
      default:
        return TripActionQueueStatus.pending;
    }
  }
}

class TripActionQueueStateMachine {
  TripActionQueueStateMachine(this._database);

  static const int maxAutoReplayAttempts = 3;

  final LocalDriftDatabase _database;

  Future<void> markInFlight(int id) async {
    await _database.customStatement(
      '''
      UPDATE trip_action_queue
      SET status = ?, retry_count = retry_count + 1
      WHERE id = ?
      ''',
      <Object>[TripActionQueueStatusCodec.inFlight, id],
    );
  }

  Future<void> markRetryFailure({
    required int id,
    required int nowMs,
    required int nextRetryAtMs,
    String? errorCode,
  }) async {
    final row = await _getById(id);
    if (row == null) {
      return;
    }

    final failedCount = row.failedRetryCount + 1;
    final reachedMax = failedCount >= maxAutoReplayAttempts;

    await (_database.update(_database.tripActionQueueTable)
          ..where((TripActionQueueTable tbl) => tbl.id.equals(id)))
        .write(
      TripActionQueueTableCompanion(
        status: Value(
          TripActionQueueStatusCodec.toRaw(
            reachedMax
                ? TripActionQueueStatus.failedPermanent
                : TripActionQueueStatus.pending,
          ),
        ),
        failedRetryCount: Value(failedCount),
        nextRetryAt: reachedMax ? const Value(null) : Value(nextRetryAtMs),
        lastErrorCode: Value(errorCode),
        lastErrorAt: Value(nowMs),
        maxRetryReachedAt:
            reachedMax ? Value(nowMs) : const Value<int?>.absent(),
      ),
    );
  }

  Future<void> markPermanentFailure({
    required int id,
    required int nowMs,
    String? errorCode,
  }) async {
    await (_database.update(_database.tripActionQueueTable)
          ..where((TripActionQueueTable tbl) => tbl.id.equals(id)))
        .write(
      TripActionQueueTableCompanion(
        status: Value(
          TripActionQueueStatusCodec.toRaw(
            TripActionQueueStatus.failedPermanent,
          ),
        ),
        failedRetryCount: const Value(maxAutoReplayAttempts),
        nextRetryAt: const Value(null),
        lastErrorCode: Value(errorCode),
        lastErrorAt: Value(nowMs),
        maxRetryReachedAt: Value(nowMs),
      ),
    );
  }

  Future<void> markSucceeded(int id) async {
    await (_database.delete(_database.tripActionQueueTable)
          ..where((TripActionQueueTable tbl) => tbl.id.equals(id)))
        .go();
  }

  Future<List<TripActionQueueTableData>> loadReplayable({
    required int nowMs,
    int limit = 20,
  }) {
    final table = _database.tripActionQueueTable;
    final query = _database.select(table)
      ..where(
        (TripActionQueueTable tbl) =>
            tbl.status.equals(TripActionQueueStatusCodec.pending) &
            tbl.failedRetryCount.isSmallerThanValue(
                TripActionQueueStateMachine.maxAutoReplayAttempts) &
            (tbl.nextRetryAt.isNull() |
                tbl.nextRetryAt.isSmallerOrEqualValue(nowMs)),
      )
      ..orderBy(
        <OrderingTerm Function(TripActionQueueTable)>[
          (TripActionQueueTable tbl) => OrderingTerm.asc(tbl.createdAt),
          (TripActionQueueTable tbl) => OrderingTerm.asc(tbl.id),
        ],
      )
      ..limit(limit);

    return query.get();
  }

  Future<TripActionQueueTableData?> _getById(int id) {
    final query = _database.select(_database.tripActionQueueTable)
      ..where((TripActionQueueTable tbl) => tbl.id.equals(id))
      ..limit(1);
    return query.getSingleOrNull();
  }
}
