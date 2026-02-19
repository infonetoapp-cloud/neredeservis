import 'dart:convert';

import 'package:cloud_functions/cloud_functions.dart';

import '../../../config/firebase_regions.dart';
import '../data/local_queue_repository.dart';
import '../data/trip_action_queue_state_machine.dart';

enum TripActionSyncState {
  pendingSync,
  synced,
  failed,
}

class TripActionExecutionResult {
  const TripActionExecutionResult({
    required this.state,
    required this.callableName,
    this.responseData,
    this.queueId,
    this.errorCode,
    this.errorMessage,
  });

  final TripActionSyncState state;
  final String callableName;
  final Map<String, dynamic>? responseData;
  final int? queueId;
  final String? errorCode;
  final String? errorMessage;

  bool get queuedForSync => state == TripActionSyncState.pendingSync;
}

class TripActionReplaySummary {
  const TripActionReplaySummary({
    required this.claimedCount,
    required this.syncedCount,
    required this.pendingRetryCount,
    required this.permanentFailureCount,
  });

  final int claimedCount;
  final int syncedCount;
  final int pendingRetryCount;
  final int permanentFailureCount;
}

typedef TripActionRemoteExecutor = Future<Map<String, dynamic>> Function(
  String callableName,
  Map<String, dynamic> payload,
);

class TripActionSyncService {
  TripActionSyncService({
    required LocalQueueRepository localQueueRepository,
    TripActionRemoteExecutor? remoteExecutor,
    DateTime Function()? nowUtc,
  })  : _localQueueRepository = localQueueRepository,
        _remoteExecutor = remoteExecutor ?? _defaultRemoteExecutor,
        _nowUtc = nowUtc ?? (() => DateTime.now().toUtc());

  static const String optimisticStateLocalDone = 'local_done';
  static const String syncStatePendingSync = 'pending_sync';
  static const String syncStateSynced = 'synced';
  static const String syncStateFailed = 'failed';

  static const Set<String> _retryableErrorCodes = <String>{
    'unavailable',
    'deadline-exceeded',
    'internal',
    'aborted',
    'cancelled',
    'resource-exhausted',
    'unknown',
  };

  final LocalQueueRepository _localQueueRepository;
  final TripActionRemoteExecutor _remoteExecutor;
  final DateTime Function() _nowUtc;

  Future<TripActionExecutionResult> executeOrQueue({
    required String ownerUid,
    required TripQueuedActionType actionType,
    required String callableName,
    required Map<String, dynamic> payload,
    required String idempotencyKey,
  }) async {
    try {
      final responseData = await _remoteExecutor(callableName, payload);
      return TripActionExecutionResult(
        state: TripActionSyncState.synced,
        callableName: callableName,
        responseData: responseData,
      );
    } catch (error) {
      final errorCode = _resolveErrorCode(error);
      final errorMessage = _resolveErrorMessage(error);
      if (!_isRetryableError(errorCode)) {
        return TripActionExecutionResult(
          state: TripActionSyncState.failed,
          callableName: callableName,
          errorCode: errorCode,
          errorMessage: errorMessage,
        );
      }

      final nowMs = _nowUtc().millisecondsSinceEpoch;
      final queueId = await _localQueueRepository.enqueueTripAction(
        ownerUid: ownerUid,
        actionType: actionType,
        payloadJson: jsonEncode(
          <String, dynamic>{
            'callableName': callableName,
            'payload': payload,
          },
        ),
        idempotencyKey: idempotencyKey,
        createdAtMs: nowMs,
        localMeta: jsonEncode(
          <String, dynamic>{
            'optimisticState': optimisticStateLocalDone,
            'syncState': syncStatePendingSync,
            'lastErrorCode': errorCode,
            'lastErrorMessage': errorMessage,
            'queuedAtMs': nowMs,
          },
        ),
      );
      return TripActionExecutionResult(
        state: TripActionSyncState.pendingSync,
        callableName: callableName,
        queueId: queueId,
        errorCode: errorCode,
        errorMessage: errorMessage,
      );
    }
  }

  Future<TripActionReplaySummary> flushQueued({
    required String ownerUid,
    int limit = 20,
  }) async {
    final nowMs = _nowUtc().millisecondsSinceEpoch;
    final claimed = await _localQueueRepository.claimReplayableTripActions(
      nowMs: nowMs,
      limit: limit,
    );
    if (claimed.isEmpty) {
      return const TripActionReplaySummary(
        claimedCount: 0,
        syncedCount: 0,
        pendingRetryCount: 0,
        permanentFailureCount: 0,
      );
    }

    var syncedCount = 0;
    var pendingRetryCount = 0;
    var permanentFailureCount = 0;

    for (final row in claimed) {
      if (row.ownerUid != ownerUid) {
        // Owner isolation guard for multi-account/local transfer edge-cases.
        await _localQueueRepository.markTripActionRetryableFailure(
          id: row.id,
          nowMs: nowMs,
          errorCode: 'owner-mismatch',
        );
        pendingRetryCount++;
        continue;
      }

      final queuedPayload = _decodeQueuedPayload(row.payloadJson);
      if (queuedPayload == null) {
        await _localQueueRepository.markTripActionPermanentFailure(
          id: row.id,
          nowMs: nowMs,
          errorCode: 'invalid-payload',
        );
        permanentFailureCount++;
        continue;
      }

      try {
        await _remoteExecutor(
          queuedPayload.callableName,
          queuedPayload.payload,
        );
        await _localQueueRepository.markTripActionSuccess(row.id);
        syncedCount++;
      } catch (error) {
        final errorCode = _resolveErrorCode(error);
        if (_isRetryableError(errorCode)) {
          await _localQueueRepository.markTripActionRetryableFailure(
            id: row.id,
            nowMs: nowMs,
            errorCode: errorCode,
          );
          final latest = await _localQueueRepository.getTripActionById(row.id);
          if (latest == null) {
            syncedCount++;
            continue;
          }
          if (latest.status == TripActionQueueStatusCodec.failedPermanent) {
            permanentFailureCount++;
            continue;
          }
          pendingRetryCount++;
          continue;
        }
        await _localQueueRepository.markTripActionPermanentFailure(
          id: row.id,
          nowMs: nowMs,
          errorCode: errorCode,
        );
        permanentFailureCount++;
      }
    }

    return TripActionReplaySummary(
      claimedCount: claimed.length,
      syncedCount: syncedCount,
      pendingRetryCount: pendingRetryCount,
      permanentFailureCount: permanentFailureCount,
    );
  }

  Future<bool> hasPendingCriticalActions({
    required String ownerUid,
  }) {
    return _localQueueRepository.hasPendingCriticalTripActions(
      ownerUid: ownerUid,
    );
  }

  Future<bool> hasManualInterventionRequirement({
    required String ownerUid,
  }) async {
    final count =
        await _localQueueRepository.countManualInterventionTripActions(
      ownerUid: ownerUid,
    );
    return count > 0;
  }

  static Future<Map<String, dynamic>> _defaultRemoteExecutor(
    String callableName,
    Map<String, dynamic> payload,
  ) async {
    final callable =
        FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
            .httpsCallable(callableName);
    final response = await callable.call(payload);
    return _extractCallableData(response.data);
  }

  static Map<String, dynamic> _extractCallableData(dynamic raw) {
    if (raw is! Map) {
      return <String, dynamic>{};
    }
    final payload = Map<String, dynamic>.from(raw);
    final nested = payload['data'];
    if (nested is Map) {
      return Map<String, dynamic>.from(nested);
    }
    return payload;
  }

  static bool _isRetryableError(String? errorCode) {
    final normalized = errorCode?.trim().toLowerCase();
    if (normalized == null || normalized.isEmpty) {
      return true;
    }
    return _retryableErrorCodes.contains(normalized);
  }

  static String? _resolveErrorCode(Object error) {
    if (error is FirebaseFunctionsException) {
      final code = error.code.trim();
      return code.isEmpty ? null : code;
    }
    return null;
  }

  static String? _resolveErrorMessage(Object error) {
    if (error is FirebaseFunctionsException) {
      final message = error.message?.trim();
      if (message == null || message.isEmpty) {
        return null;
      }
      return message;
    }
    final message = error.toString().trim();
    return message.isEmpty ? null : message;
  }

  _QueuedTripActionPayload? _decodeQueuedPayload(String payloadJson) {
    final raw = jsonDecode(payloadJson);
    if (raw is! Map) {
      return null;
    }
    final payload = Map<String, dynamic>.from(raw);
    final callableNameRaw = payload['callableName'];
    final callableName =
        callableNameRaw is String ? callableNameRaw.trim() : '';
    final callablePayloadRaw = payload['payload'];
    if (callableName.isEmpty || callablePayloadRaw is! Map) {
      return null;
    }
    return _QueuedTripActionPayload(
      callableName: callableName,
      payload: Map<String, dynamic>.from(callablePayloadRaw),
    );
  }
}

class _QueuedTripActionPayload {
  const _QueuedTripActionPayload({
    required this.callableName,
    required this.payload,
  });

  final String callableName;
  final Map<String, dynamic> payload;
}
