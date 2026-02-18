import 'dart:math' as math;

import 'package:drift/drift.dart';

import '../../../core/errors/error_codes.dart';
import '../../../core/exceptions/app_exception.dart';
import 'cache_invalidation_rule.dart';
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
  static const int defaultMaxRetryAttempts = 3;

  const QueueRetryPolicy({
    this.maxRetryAttempts = defaultMaxRetryAttempts,
    this.baseDelayMs = 2000,
    this.maxDelayMs = 300000,
    this.jitterRatio = 0.2,
  });

  final int maxRetryAttempts;
  final int baseDelayMs;
  final int maxDelayMs;
  final double jitterRatio;

  bool willReachMaxOnFailure({
    required int failedRetryCount,
  }) {
    return failedRetryCount + 1 >= maxRetryAttempts;
  }

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

typedef OwnershipTransferAttemptHook = Future<void> Function(int attempt);

class LocalQueueRepository {
  static const int staleReplayThresholdMs = 60000;
  static const int defaultMaxQueueSize = 500;
  static const String queueLimitExceededMessage =
      'Cevrimdisi kuyruk limiti doldu. Internet baglantisi saglandiginda tekrar deneyin.';

  static const String _ownerCurrentMetaKey = 'ownership.current_owner_uid';
  static const String _ownerPreviousMetaKey = 'ownership.previous_owner_uid';
  static const String _ownerMigratedAtMetaKey = 'ownership.migrated_at_ms';
  static const String _migrationLockMetaKey = 'ownership.migration_lock';
  static const String _migrationVersionMetaKey = 'ownership.migration_version';
  static const String _migrationPendingPreviousOwnerMetaKey =
      'ownership.pending_previous_owner_uid';
  static const String _migrationPendingNewOwnerMetaKey =
      'ownership.pending_new_owner_uid';
  static const String _migrationPendingMigratedAtMetaKey =
      'ownership.pending_migrated_at_ms';

  static const String _tripActionCacheUpdatedAtMetaKey =
      'cache.trip_action.updated_at_ms';
  static const String _locationCacheUpdatedAtMetaKey =
      'cache.location_queue.updated_at_ms';
  static const String _cacheInvalidatedAtMetaKey = 'cache.invalidated_at_ms';
  static const String _cacheInvalidatedReasonMetaKey =
      'cache.invalidated_reason';

  LocalQueueRepository({
    required LocalDriftDatabase database,
    TripActionQueueStateMachine? stateMachine,
    QueueRetryPolicy retryPolicy = const QueueRetryPolicy(),
    math.Random? random,
    int maxQueueSize = defaultMaxQueueSize,
    CacheInvalidationRule cacheRule = const CacheInvalidationRule(),
    OwnershipTransferAttemptHook? ownershipTransferAttemptHook,
    int maxOwnershipTransferRetryAttempts = 3,
  })  : _database = database,
        _stateMachine = stateMachine ??
            TripActionQueueStateMachine(
              database,
              maxAutoReplayAttempts: retryPolicy.maxRetryAttempts,
            ),
        _retryPolicy = retryPolicy,
        _random = random ?? math.Random(),
        _maxQueueSize = maxQueueSize,
        _cacheRule = cacheRule,
        _ownershipTransferAttemptHook = ownershipTransferAttemptHook,
        _maxOwnershipTransferRetryAttempts = maxOwnershipTransferRetryAttempts;

  final LocalDriftDatabase _database;
  final TripActionQueueStateMachine _stateMachine;
  final QueueRetryPolicy _retryPolicy;
  final math.Random _random;
  final int _maxQueueSize;
  final CacheInvalidationRule _cacheRule;
  final OwnershipTransferAttemptHook? _ownershipTransferAttemptHook;
  final int _maxOwnershipTransferRetryAttempts;

  static bool shouldSkipLiveReplay({
    required int sampledAtMs,
    required int nowMs,
    int thresholdMs = staleReplayThresholdMs,
  }) {
    return nowMs - sampledAtMs > thresholdMs;
  }

  Future<List<TripActionQueueTableData>> loadTripActionsOfflineFirst({
    required String ownerUid,
    int limit = 100,
  }) {
    final query = _database.select(_database.tripActionQueueTable)
      ..where((TripActionQueueTable tbl) => tbl.ownerUid.equals(ownerUid))
      ..orderBy(
        <OrderingTerm Function(TripActionQueueTable)>[
          (TripActionQueueTable tbl) => OrderingTerm.desc(tbl.createdAt),
          (TripActionQueueTable tbl) => OrderingTerm.desc(tbl.id),
        ],
      )
      ..limit(limit);
    return query.get();
  }

  Future<List<LocationQueueTableData>> loadLocationSamplesOfflineFirst({
    required String ownerUid,
    int limit = 100,
  }) {
    final query = _database.select(_database.locationQueueTable)
      ..where((LocationQueueTable tbl) => tbl.ownerUid.equals(ownerUid))
      ..orderBy(
        <OrderingTerm Function(LocationQueueTable)>[
          (LocationQueueTable tbl) => OrderingTerm.desc(tbl.sampledAt),
          (LocationQueueTable tbl) => OrderingTerm.desc(tbl.id),
        ],
      )
      ..limit(limit);
    return query.get();
  }

  Future<bool> hasPendingOfflineData({
    required String ownerUid,
  }) async {
    final tripCount = await _countTripActionsForOwner(ownerUid);
    if (tripCount > 0) {
      return true;
    }
    final locationCount = await _countLocationSamplesForOwner(ownerUid);
    return locationCount > 0;
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

    await _ensureTripActionCapacity(ownerUid);
    final insertedId = await _database.into(table).insert(
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
    await _touchTripActionCache(createdAtMs);
    return insertedId;
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

    await _setOwnershipMigrationPending(
      previousOwnerUid: previous,
      newOwnerUid: current,
      migratedAtMs: migratedAtMs,
    );

    for (var attempt = 1;
        attempt <= _maxOwnershipTransferRetryAttempts;
        attempt++) {
      try {
        await _database.transaction(() async {
          await _applyOwnershipTransferInSingleTransaction(
            previousOwnerUid: previous,
            newOwnerUid: current,
            migratedAtMs: migratedAtMs,
            attempt: attempt,
          );
        });
        await _markOwnershipMigrationCompleted();
        await invalidateQueueCache(
          reason: 'ownership_transfer',
          nowMs: migratedAtMs,
        );
        return;
      } catch (error) {
        if (attempt >= _maxOwnershipTransferRetryAttempts) {
          throw AppException(
            code: ErrorCodes.failedPrecondition,
            message: 'Local ownership transfer failed after retry limit.',
            cause: error,
          );
        }
      }
    }
  }

  Future<bool> resumePendingOwnershipMigrationIfNeeded() async {
    final isLocked = await isOwnershipMigrationLocked();
    if (!isLocked) {
      return false;
    }

    final previousOwnerUid =
        (await _readLocalMetaValue(_migrationPendingPreviousOwnerMetaKey))
            ?.trim();
    final newOwnerUid =
        (await _readLocalMetaValue(_migrationPendingNewOwnerMetaKey))?.trim();
    final migratedAtMsRaw =
        await _readLocalMetaValue(_migrationPendingMigratedAtMetaKey);
    final migratedAtMs = int.tryParse(migratedAtMsRaw ?? '');

    if (previousOwnerUid == null ||
        previousOwnerUid.isEmpty ||
        newOwnerUid == null ||
        newOwnerUid.isEmpty) {
      await _markOwnershipMigrationCompleted();
      return false;
    }

    try {
      await transferLocalOwnershipAfterAccountLink(
        previousOwnerUid: previousOwnerUid,
        newOwnerUid: newOwnerUid,
        migratedAtMs: migratedAtMs ?? _nowUtcMs(),
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<int> getOwnershipMigrationVersion() async {
    final raw = await _readLocalMetaValue(_migrationVersionMetaKey);
    return int.tryParse(raw ?? '') ?? 0;
  }

  Future<bool> isOwnershipMigrationLocked() async {
    final lockValue = await _readLocalMetaValue(_migrationLockMetaKey);
    return lockValue == '1';
  }

  Future<void> invalidateQueueCache({
    required String reason,
    required int nowMs,
  }) async {
    await _upsertLocalMeta(
      key: _tripActionCacheUpdatedAtMetaKey,
      value: '0',
    );
    await _upsertLocalMeta(
      key: _locationCacheUpdatedAtMetaKey,
      value: '0',
    );
    await _upsertLocalMeta(
      key: _cacheInvalidatedAtMetaKey,
      value: nowMs.toString(),
    );
    await _upsertLocalMeta(
      key: _cacheInvalidatedReasonMetaKey,
      value: reason,
    );
  }

  Future<bool> isTripActionCacheFresh({
    required int nowMs,
  }) async {
    final raw = await _readLocalMetaValue(_tripActionCacheUpdatedAtMetaKey);
    final lastUpdatedAtMs = int.tryParse(raw ?? '') ?? 0;
    return _cacheRule.isFresh(
      lastUpdatedAtMs: lastUpdatedAtMs,
      nowMs: nowMs,
      ttlMs: _cacheRule.tripActionTtlMs,
    );
  }

  Future<bool> isLocationQueueCacheFresh({
    required int nowMs,
  }) async {
    final raw = await _readLocalMetaValue(_locationCacheUpdatedAtMetaKey);
    final lastUpdatedAtMs = int.tryParse(raw ?? '') ?? 0;
    return _cacheRule.isFresh(
      lastUpdatedAtMs: lastUpdatedAtMs,
      nowMs: nowMs,
      ttlMs: _cacheRule.locationSampleTtlMs,
    );
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
    return _stateMachine.markSucceeded(id).then((_) {
      return _touchTripActionCache(_nowUtcMs());
    });
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
    final reachedMax = _retryPolicy.willReachMaxOnFailure(
        failedRetryCount: row.failedRetryCount);
    final nextRetryAt = reachedMax
        ? nowMs
        : nowMs +
            _retryPolicy.computeDelayMs(
              attempt: nextAttempt,
              random: _random,
            );

    await _stateMachine.markRetryFailure(
      id: id,
      nowMs: nowMs,
      nextRetryAtMs: nextRetryAt,
      errorCode: errorCode,
    );
    await _touchTripActionCache(nowMs);
  }

  Future<void> markTripActionPermanentFailure({
    required int id,
    required int nowMs,
    String? errorCode,
  }) {
    return _stateMachine
        .markPermanentFailure(
      id: id,
      nowMs: nowMs,
      errorCode: errorCode,
    )
        .then((_) {
      return _touchTripActionCache(nowMs);
    });
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
    return _ensureLocationQueueCapacity(ownerUid).then((_) async {
      final insertedId = await _database
          .into(_database.locationQueueTable)
          .insert(
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
      await _touchLocationCache(createdAtMs);
      return insertedId;
    });
  }

  Future<List<LocationQueueTableData>> loadReplayableLocationSamples({
    required int nowMs,
    int limit = 20,
  }) {
    final table = _database.locationQueueTable;
    final query = _database.select(table)
      ..where(
        (LocationQueueTable tbl) =>
            tbl.retryCount.isSmallerThanValue(_retryPolicy.maxRetryAttempts) &
            (tbl.nextRetryAt.isNull() |
                tbl.nextRetryAt.isSmallerOrEqualValue(nowMs)),
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
    await _touchLocationCache(_nowUtcMs());
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
    final reachedMax = nextAttempt >= _retryPolicy.maxRetryAttempts;
    final nextRetryAt = reachedMax
        ? null
        : nowMs +
            _retryPolicy.computeDelayMs(
              attempt: nextAttempt,
              random: _random,
            );

    await (_database.update(_database.locationQueueTable)
          ..where((LocationQueueTable tbl) => tbl.id.equals(id)))
        .write(
      LocationQueueTableCompanion(
        retryCount: Value(
          reachedMax ? _retryPolicy.maxRetryAttempts : nextAttempt,
        ),
        nextRetryAt: Value(nextRetryAt),
      ),
    );
    await _touchLocationCache(nowMs);
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
    String? value,
  }) {
    return _database.into(_database.localMetaTable).insertOnConflictUpdate(
          LocalMetaTableCompanion.insert(
            key: key,
            value: Value(value),
          ),
        );
  }

  Future<void> _touchTripActionCache(int nowMs) {
    return _upsertLocalMeta(
      key: _tripActionCacheUpdatedAtMetaKey,
      value: nowMs.toString(),
    );
  }

  Future<void> _touchLocationCache(int nowMs) {
    return _upsertLocalMeta(
      key: _locationCacheUpdatedAtMetaKey,
      value: nowMs.toString(),
    );
  }

  Future<void> _ensureTripActionCapacity(String ownerUid) async {
    final count = await _countTripActionsForOwner(ownerUid);
    if (count >= _maxQueueSize) {
      throw const AppException(
        code: ErrorCodes.resourceExhausted,
        message: queueLimitExceededMessage,
      );
    }
  }

  Future<void> _ensureLocationQueueCapacity(String ownerUid) async {
    final count = await _countLocationSamplesForOwner(ownerUid);
    if (count >= _maxQueueSize) {
      throw const AppException(
        code: ErrorCodes.resourceExhausted,
        message: queueLimitExceededMessage,
      );
    }
  }

  Future<int> _countTripActionsForOwner(String ownerUid) async {
    final table = _database.tripActionQueueTable;
    final countExp = table.id.count();
    final query = _database.selectOnly(table)
      ..addColumns(<Expression<Object>>[countExp])
      ..where(table.ownerUid.equals(ownerUid));
    final row = await query.getSingle();
    return row.read(countExp) ?? 0;
  }

  Future<int> _countLocationSamplesForOwner(String ownerUid) async {
    final table = _database.locationQueueTable;
    final countExp = table.id.count();
    final query = _database.selectOnly(table)
      ..addColumns(<Expression<Object>>[countExp])
      ..where(table.ownerUid.equals(ownerUid));
    final row = await query.getSingle();
    return row.read(countExp) ?? 0;
  }

  Future<void> _applyOwnershipTransferInSingleTransaction({
    required String previousOwnerUid,
    required String newOwnerUid,
    required int migratedAtMs,
    required int attempt,
  }) async {
    await (_database.update(_database.locationQueueTable)
          ..where(
            (LocationQueueTable tbl) => tbl.ownerUid.equals(previousOwnerUid),
          ))
        .write(LocationQueueTableCompanion(ownerUid: Value(newOwnerUid)));

    final attemptHook = _ownershipTransferAttemptHook;
    if (attemptHook != null) {
      await attemptHook(attempt);
    }

    await (_database.update(_database.tripActionQueueTable)
          ..where(
            (TripActionQueueTable tbl) => tbl.ownerUid.equals(previousOwnerUid),
          ))
        .write(TripActionQueueTableCompanion(ownerUid: Value(newOwnerUid)));

    await _upsertLocalMeta(
      key: _ownerCurrentMetaKey,
      value: newOwnerUid,
    );
    await _upsertLocalMeta(
      key: _ownerPreviousMetaKey,
      value: previousOwnerUid,
    );
    await _upsertLocalMeta(
      key: _ownerMigratedAtMetaKey,
      value: migratedAtMs.toString(),
    );
    await _touchTripActionCache(migratedAtMs);
    await _touchLocationCache(migratedAtMs);
  }

  Future<void> _setOwnershipMigrationPending({
    required String previousOwnerUid,
    required String newOwnerUid,
    required int migratedAtMs,
  }) async {
    await _upsertLocalMeta(
      key: _migrationLockMetaKey,
      value: '1',
    );
    await _upsertLocalMeta(
      key: _migrationPendingPreviousOwnerMetaKey,
      value: previousOwnerUid,
    );
    await _upsertLocalMeta(
      key: _migrationPendingNewOwnerMetaKey,
      value: newOwnerUid,
    );
    await _upsertLocalMeta(
      key: _migrationPendingMigratedAtMetaKey,
      value: migratedAtMs.toString(),
    );
  }

  Future<void> _markOwnershipMigrationCompleted() async {
    final currentVersion = await getOwnershipMigrationVersion();
    await _upsertLocalMeta(
      key: _migrationVersionMetaKey,
      value: (currentVersion + 1).toString(),
    );
    await _upsertLocalMeta(
      key: _migrationLockMetaKey,
      value: '0',
    );
    await _upsertLocalMeta(
      key: _migrationPendingPreviousOwnerMetaKey,
      value: null,
    );
    await _upsertLocalMeta(
      key: _migrationPendingNewOwnerMetaKey,
      value: null,
    );
    await _upsertLocalMeta(
      key: _migrationPendingMigratedAtMetaKey,
      value: null,
    );
  }

  Future<String?> _readLocalMetaValue(String key) async {
    final row = await (_database.select(_database.localMetaTable)
          ..where((LocalMetaTable tbl) => tbl.key.equals(key))
          ..limit(1))
        .getSingleOrNull();
    return row?.value;
  }

  int _nowUtcMs() => DateTime.now().toUtc().millisecondsSinceEpoch;
}
