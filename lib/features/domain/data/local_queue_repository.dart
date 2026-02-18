import 'dart:math' as math;

import 'package:drift/drift.dart';

import 'local_drift_database.dart';
import 'trip_action_queue_state_machine.dart';

enum TripQueuedActionType {
  startTrip,
  finishTrip,
  announcement,
  supportReport,
}

class TripQueuedActionTypeCodec {
  const TripQueuedActionTypeCodec._();

  static String toRaw(TripQueuedActionType type) {
    switch (type) {
      case TripQueuedActionType.startTrip:
        return 'start_trip';
      case TripQueuedActionType.finishTrip:
        return 'finish_trip';
      case TripQueuedActionType.announcement:
        return 'announcement';
      case TripQueuedActionType.supportReport:
        return 'support_report';
    }
  }
}

class QueueRetryPolicy {
  const QueueRetryPolicy({
    this.baseDelayMs = 2000,
    this.maxDelayMs = 300000,
    this.jitterRatio = 0.2,
  });

  final int baseDelayMs;
  final int maxDelayMs;
  final double jitterRatio;

  int computeDelayMs({
    required int attempt,
    required math.Random random,
  }) {
    final safeAttempt = attempt < 1 ? 1 : attempt;
    final exponent = safeAttempt - 1;
    final raw = (baseDelayMs * math.pow(2, exponent)).round();
    final capped = raw > maxDelayMs ? maxDelayMs : raw;

    if (jitterRatio <= 0) {
      return capped;
    }

    final minFactor = 1 - jitterRatio;
    final maxFactor = 1 + jitterRatio;
    final factor = minFactor + (maxFactor - minFactor) * random.nextDouble();
    final jittered = (capped * factor).round();
    return jittered.clamp(1, maxDelayMs);
  }
}

class LocalQueueRepository {
  LocalQueueRepository({
    required LocalDriftDatabase database,
    TripActionQueueStateMachine? stateMachine,
    QueueRetryPolicy retryPolicy = const QueueRetryPolicy(),
    math.Random? random,
  })  : _database = database,
        _stateMachine = stateMachine ?? TripActionQueueStateMachine(database),
        _retryPolicy = retryPolicy,
        _random = random ?? math.Random();

  final LocalDriftDatabase _database;
  final TripActionQueueStateMachine _stateMachine;
  final QueueRetryPolicy _retryPolicy;
  final math.Random _random;

  static const int staleReplayThresholdMs = 60000;
  static const String _ownerCurrentMetaKey = 'ownership.current_owner_uid';
  static const String _ownerPreviousMetaKey = 'ownership.previous_owner_uid';
  static const String _ownerMigratedAtMetaKey = 'ownership.migrated_at_ms';

  static bool shouldSkipLiveReplay({
    required int sampledAtMs,
    required int nowMs,
    int thresholdMs = staleReplayThresholdMs,
  }) {
    return nowMs - sampledAtMs > thresholdMs;
  }

  Future<int> enqueueTripAction({
    required String ownerUid,
    required TripQueuedActionType actionType,
    required String payloadJson,
    required String idempotencyKey,
    required int createdAtMs,
    String? localMeta,
  }) async {
    final table = _database.tripActionQueueTable;
    final existing = await (_database.select(table)
          ..where(
            (TripActionQueueTable tbl) =>
                tbl.ownerUid.equals(ownerUid) &
                tbl.idempotencyKey.equals(idempotencyKey),
          )
          ..limit(1))
        .getSingleOrNull();
    if (existing != null) {
      return existing.id;
    }

    return _database.into(table).insert(
          TripActionQueueTableCompanion.insert(
            ownerUid: ownerUid,
            actionType: TripQueuedActionTypeCodec.toRaw(actionType),
            status: const Value(TripActionQueueStatusCodec.pending),
            payloadJson: payloadJson,
            idempotencyKey: idempotencyKey,
            createdAt: Value(createdAtMs),
            localMeta:
                localMeta == null ? const Value.absent() : Value(localMeta),
          ),
        );
  }

  Future<void> transferLocalOwnershipAfterAccountLink({
    required String previousOwnerUid,
    required String newOwnerUid,
    required int migratedAtMs,
  }) async {
    final previous = previousOwnerUid.trim();
    final current = newOwnerUid.trim();
    if (previous.isEmpty || current.isEmpty || previous == current) {
      return;
    }

    await _database.transaction(() async {
      await (_database.update(_database.locationQueueTable)
            ..where((LocationQueueTable tbl) => tbl.ownerUid.equals(previous)))
          .write(LocationQueueTableCompanion(ownerUid: Value(current)));

      await (_database.update(_database.tripActionQueueTable)
            ..where(
              (TripActionQueueTable tbl) => tbl.ownerUid.equals(previous),
            ))
          .write(TripActionQueueTableCompanion(ownerUid: Value(current)));

      await _upsertLocalMeta(
        key: _ownerCurrentMetaKey,
        value: current,
      );
      await _upsertLocalMeta(
        key: _ownerPreviousMetaKey,
        value: previous,
      );
      await _upsertLocalMeta(
        key: _ownerMigratedAtMetaKey,
        value: migratedAtMs.toString(),
      );
    });
  }

  Future<List<TripActionQueueTableData>> claimReplayableTripActions({
    required int nowMs,
    int limit = 20,
  }) async {
    final replayable = await _stateMachine.loadReplayable(
      nowMs: nowMs,
      limit: limit,
    );
    if (replayable.isEmpty) {
      return const <TripActionQueueTableData>[];
    }

    for (final item in replayable) {
      await _stateMachine.markInFlight(item.id);
    }

    final claimedIds =
        replayable.map((TripActionQueueTableData item) => item.id).toList();
    final query = _database.select(_database.tripActionQueueTable)
      ..where((TripActionQueueTable tbl) => tbl.id.isIn(claimedIds))
      ..orderBy(
        <OrderingTerm Function(TripActionQueueTable)>[
          (TripActionQueueTable tbl) => OrderingTerm.asc(tbl.createdAt),
          (TripActionQueueTable tbl) => OrderingTerm.asc(tbl.id),
        ],
      );
    return query.get();
  }

  Future<void> markTripActionSuccess(int id) {
    return _stateMachine.markSucceeded(id);
  }

  Future<void> markTripActionRetryableFailure({
    required int id,
    required int nowMs,
    String? errorCode,
  }) async {
    final row = await _getTripActionById(id);
    if (row == null) {
      return;
    }

    final nextAttempt = row.failedRetryCount + 1;
    final delay = _retryPolicy.computeDelayMs(
      attempt: nextAttempt,
      random: _random,
    );
    final nextRetryAt = nowMs + delay;

    await _stateMachine.markRetryFailure(
      id: id,
      nowMs: nowMs,
      nextRetryAtMs: nextRetryAt,
      errorCode: errorCode,
    );
  }

  Future<void> markTripActionPermanentFailure({
    required int id,
    required int nowMs,
    String? errorCode,
  }) {
    return _stateMachine.markPermanentFailure(
      id: id,
      nowMs: nowMs,
      errorCode: errorCode,
    );
  }

  Future<List<TripActionQueueTableData>> getDeadLetterTripActions({
    int limit = 50,
  }) {
    final query = _database.select(_database.tripActionQueueTable)
      ..where(
        (TripActionQueueTable tbl) =>
            tbl.status.equals(TripActionQueueStatusCodec.failedPermanent),
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

  Future<int> enqueueLocationSample({
    required String ownerUid,
    required String routeId,
    required double lat,
    required double lng,
    required double accuracy,
    required int sampledAtMs,
    required int createdAtMs,
    String? tripId,
    double? speed,
    double? heading,
  }) {
    return _database.into(_database.locationQueueTable).insert(
          LocationQueueTableCompanion.insert(
            ownerUid: ownerUid,
            routeId: routeId,
            tripId: tripId == null ? const Value.absent() : Value(tripId),
            lat: lat,
            lng: lng,
            speed: speed == null ? const Value.absent() : Value(speed),
            heading: heading == null ? const Value.absent() : Value(heading),
            accuracy: accuracy,
            sampledAt: sampledAtMs,
            createdAt: Value(createdAtMs),
          ),
        );
  }

  Future<List<LocationQueueTableData>> loadReplayableLocationSamples({
    required int nowMs,
    int limit = 20,
  }) {
    final table = _database.locationQueueTable;
    final query = _database.select(table)
      ..where(
        (LocationQueueTable tbl) =>
            tbl.nextRetryAt.isNull() |
            tbl.nextRetryAt.isSmallerOrEqualValue(nowMs),
      )
      ..orderBy(
        <OrderingTerm Function(LocationQueueTable)>[
          (LocationQueueTable tbl) => OrderingTerm.asc(tbl.sampledAt),
          (LocationQueueTable tbl) => OrderingTerm.asc(tbl.id),
        ],
      )
      ..limit(limit);
    return query.get();
  }

  Future<void> markLocationSampleSent(int id) async {
    await (_database.delete(_database.locationQueueTable)
          ..where((LocationQueueTable tbl) => tbl.id.equals(id)))
        .go();
  }

  Future<void> markLocationSampleFailure({
    required int id,
    required int nowMs,
  }) async {
    final row = await _getLocationById(id);
    if (row == null) {
      return;
    }

    final nextAttempt = row.retryCount + 1;
    final delay = _retryPolicy.computeDelayMs(
      attempt: nextAttempt,
      random: _random,
    );
    final nextRetryAt = nowMs + delay;

    await (_database.update(_database.locationQueueTable)
          ..where((LocationQueueTable tbl) => tbl.id.equals(id)))
        .write(
      LocationQueueTableCompanion(
        retryCount: Value(nextAttempt),
        nextRetryAt: Value(nextRetryAt),
      ),
    );
  }

  Future<TripActionQueueTableData?> _getTripActionById(int id) {
    final query = _database.select(_database.tripActionQueueTable)
      ..where((TripActionQueueTable tbl) => tbl.id.equals(id))
      ..limit(1);
    return query.getSingleOrNull();
  }

  Future<LocationQueueTableData?> _getLocationById(int id) {
    final query = _database.select(_database.locationQueueTable)
      ..where((LocationQueueTable tbl) => tbl.id.equals(id))
      ..limit(1);
    return query.getSingleOrNull();
  }

  Future<void> _upsertLocalMeta({
    required String key,
    required String value,
  }) {
    return _database.into(_database.localMetaTable).insertOnConflictUpdate(
          LocalMetaTableCompanion.insert(
            key: key,
            value: Value(value),
          ),
        );
  }
}
