enum RouteMutationWriteFeedbackKey {
  routeUpdateSavedWithoutStopChanges,
  routeUpdateSavedWithStopChanges,
  routeUpdateFailed,
  routeUpdateTokenMismatch,
  routeUpdateStructureLocked,
  routeUpdateUpgradeRequired,
  stopSaved,
  stopSaveFailed,
  stopSaveTokenMismatch,
  stopSaveStructureLocked,
  stopSaveStateInvalid,
  stopSaveReorderStateInvalid,
  stopSaveUpgradeRequired,
  stopDeleted,
  stopDeleteFailed,
  stopDeleteTokenMismatch,
  stopDeleteStructureLocked,
  stopDeleteUpgradeRequired,
}

enum _RouteMutationWriteFeedbackCommandKind {
  routeUpdateSuccess,
  routeUpdateFailure,
  upsertStopSuccess,
  upsertStopFailure,
  deleteStopSuccess,
  deleteStopFailure,
}

class PlanRouteMutationWriteFeedbackCommand {
  const PlanRouteMutationWriteFeedbackCommand._({
    required _RouteMutationWriteFeedbackCommandKind kind,
    this.stopId,
    this.inlineStopUpsertsCount,
    this.errorCode,
    this.errorMessage,
    this.errorDetails,
  }) : _kind = kind;

  const PlanRouteMutationWriteFeedbackCommand.routeUpdateSuccess({
    required int inlineStopUpsertsCount,
  }) : this._(
          kind: _RouteMutationWriteFeedbackCommandKind.routeUpdateSuccess,
          inlineStopUpsertsCount: inlineStopUpsertsCount,
        );

  const PlanRouteMutationWriteFeedbackCommand.routeUpdateFailure({
    String? errorCode,
    String? errorMessage,
    Object? errorDetails,
  }) : this._(
          kind: _RouteMutationWriteFeedbackCommandKind.routeUpdateFailure,
          errorCode: errorCode,
          errorMessage: errorMessage,
          errorDetails: errorDetails,
        );

  const PlanRouteMutationWriteFeedbackCommand.upsertStopSuccess({
    required String stopId,
  }) : this._(
          kind: _RouteMutationWriteFeedbackCommandKind.upsertStopSuccess,
          stopId: stopId,
        );

  const PlanRouteMutationWriteFeedbackCommand.upsertStopFailure({
    String? errorCode,
    String? errorMessage,
    Object? errorDetails,
  }) : this._(
          kind: _RouteMutationWriteFeedbackCommandKind.upsertStopFailure,
          errorCode: errorCode,
          errorMessage: errorMessage,
          errorDetails: errorDetails,
        );

  const PlanRouteMutationWriteFeedbackCommand.deleteStopSuccess()
      : this._(kind: _RouteMutationWriteFeedbackCommandKind.deleteStopSuccess);

  const PlanRouteMutationWriteFeedbackCommand.deleteStopFailure({
    String? errorCode,
    String? errorMessage,
    Object? errorDetails,
  }) : this._(
          kind: _RouteMutationWriteFeedbackCommandKind.deleteStopFailure,
          errorCode: errorCode,
          errorMessage: errorMessage,
          errorDetails: errorDetails,
        );

  final _RouteMutationWriteFeedbackCommandKind _kind;
  final String? stopId;
  final int? inlineStopUpsertsCount;
  final String? errorCode;
  final String? errorMessage;
  final Object? errorDetails;
}

class RouteMutationWriteFeedbackPlan {
  const RouteMutationWriteFeedbackPlan({
    required this.key,
    this.stopId,
    this.inlineStopUpsertsCount,
  });

  final RouteMutationWriteFeedbackKey key;
  final String? stopId;
  final int? inlineStopUpsertsCount;
}

class PlanRouteMutationWriteFeedbackUseCase {
  const PlanRouteMutationWriteFeedbackUseCase();

  RouteMutationWriteFeedbackPlan execute(
    PlanRouteMutationWriteFeedbackCommand command,
  ) {
    switch (command._kind) {
      case _RouteMutationWriteFeedbackCommandKind.routeUpdateSuccess:
        final inlineStopUpsertsCount =
            (command.inlineStopUpsertsCount ?? 0).clamp(0, 999999999);
        return RouteMutationWriteFeedbackPlan(
          key: inlineStopUpsertsCount > 0
              ? RouteMutationWriteFeedbackKey.routeUpdateSavedWithStopChanges
              : RouteMutationWriteFeedbackKey
                  .routeUpdateSavedWithoutStopChanges,
          inlineStopUpsertsCount: inlineStopUpsertsCount,
        );
      case _RouteMutationWriteFeedbackCommandKind.routeUpdateFailure:
        return RouteMutationWriteFeedbackPlan(
          key: _resolveRouteUpdateFailureKey(command),
        );
      case _RouteMutationWriteFeedbackCommandKind.upsertStopSuccess:
        return RouteMutationWriteFeedbackPlan(
          key: RouteMutationWriteFeedbackKey.stopSaved,
          stopId: command.stopId,
        );
      case _RouteMutationWriteFeedbackCommandKind.upsertStopFailure:
        return RouteMutationWriteFeedbackPlan(
          key: _resolveStopUpsertFailureKey(command),
        );
      case _RouteMutationWriteFeedbackCommandKind.deleteStopSuccess:
        return const RouteMutationWriteFeedbackPlan(
          key: RouteMutationWriteFeedbackKey.stopDeleted,
        );
      case _RouteMutationWriteFeedbackCommandKind.deleteStopFailure:
        return RouteMutationWriteFeedbackPlan(
          key: _resolveStopDeleteFailureKey(command),
        );
    }
  }

  RouteMutationWriteFeedbackKey _resolveRouteUpdateFailureKey(
    PlanRouteMutationWriteFeedbackCommand command,
  ) {
    final normalizedCode = _normalizeCode(command.errorCode);
    final reason =
        _resolveReasonCode(command.errorDetails, command.errorMessage);
    if (reason == 'UPGRADE_REQUIRED' || reason == 'FORCE_UPDATE_REQUIRED') {
      return RouteMutationWriteFeedbackKey.routeUpdateUpgradeRequired;
    }
    if (reason == 'UPDATE_TOKEN_MISMATCH') {
      return RouteMutationWriteFeedbackKey.routeUpdateTokenMismatch;
    }
    if (reason == 'ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED') {
      return RouteMutationWriteFeedbackKey.routeUpdateStructureLocked;
    }
    if (normalizedCode == 'failed-precondition' &&
        command.errorMessage != null &&
        command.errorMessage!.toUpperCase().contains('UPDATE_TOKEN_MISMATCH')) {
      return RouteMutationWriteFeedbackKey.routeUpdateTokenMismatch;
    }
    return RouteMutationWriteFeedbackKey.routeUpdateFailed;
  }

  RouteMutationWriteFeedbackKey _resolveStopUpsertFailureKey(
    PlanRouteMutationWriteFeedbackCommand command,
  ) {
    final reason =
        _resolveReasonCode(command.errorDetails, command.errorMessage);
    if (reason == 'UPGRADE_REQUIRED' || reason == 'FORCE_UPDATE_REQUIRED') {
      return RouteMutationWriteFeedbackKey.stopSaveUpgradeRequired;
    }
    if (reason == 'UPDATE_TOKEN_MISMATCH') {
      return RouteMutationWriteFeedbackKey.stopSaveTokenMismatch;
    }
    if (reason == 'ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED') {
      return RouteMutationWriteFeedbackKey.stopSaveStructureLocked;
    }
    if (reason == 'ROUTE_STOP_INVALID_STATE') {
      return RouteMutationWriteFeedbackKey.stopSaveStateInvalid;
    }
    if (reason == 'ROUTE_STOP_REORDER_STATE_INVALID') {
      return RouteMutationWriteFeedbackKey.stopSaveReorderStateInvalid;
    }
    return RouteMutationWriteFeedbackKey.stopSaveFailed;
  }

  RouteMutationWriteFeedbackKey _resolveStopDeleteFailureKey(
    PlanRouteMutationWriteFeedbackCommand command,
  ) {
    final reason =
        _resolveReasonCode(command.errorDetails, command.errorMessage);
    if (reason == 'UPGRADE_REQUIRED' || reason == 'FORCE_UPDATE_REQUIRED') {
      return RouteMutationWriteFeedbackKey.stopDeleteUpgradeRequired;
    }
    if (reason == 'UPDATE_TOKEN_MISMATCH') {
      return RouteMutationWriteFeedbackKey.stopDeleteTokenMismatch;
    }
    if (reason == 'ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED') {
      return RouteMutationWriteFeedbackKey.stopDeleteStructureLocked;
    }
    return RouteMutationWriteFeedbackKey.stopDeleteFailed;
  }

  String _normalizeCode(String? code) {
    final normalized = (code ?? '').trim().toLowerCase();
    return normalized.isEmpty ? 'unknown' : normalized;
  }

  String? _resolveReasonCode(Object? details, String? message) {
    if (details is Map<Object?, Object?>) {
      final detailsMap = Map<String, dynamic>.from(details);
      final direct = detailsMap['reasonCode'];
      if (direct is String && direct.trim().isNotEmpty) {
        return direct.trim().toUpperCase();
      }
      final nested = detailsMap['reason'];
      if (nested is String && nested.trim().isNotEmpty) {
        return nested.trim().toUpperCase();
      }
    }
    final normalizedMessage = (message ?? '').trim().toUpperCase();
    if (normalizedMessage.isEmpty) {
      return null;
    }
    const known = <String>[
      'UPDATE_TOKEN_MISMATCH',
      'ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED',
      'ROUTE_STOP_INVALID_STATE',
      'ROUTE_STOP_REORDER_STATE_INVALID',
      'UPGRADE_REQUIRED',
      'FORCE_UPDATE_REQUIRED',
    ];
    for (final reason in known) {
      if (normalizedMessage.contains(reason)) {
        return reason;
      }
    }
    return null;
  }
}
