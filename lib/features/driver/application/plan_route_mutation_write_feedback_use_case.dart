enum RouteMutationWriteFeedbackKey {
  routeUpdateSavedWithoutStopChanges,
  routeUpdateSavedWithStopChanges,
  routeUpdateFailed,
  stopSaved,
  stopSaveFailed,
  stopDeleted,
  stopDeleteFailed,
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
  }) : _kind = kind;

  const PlanRouteMutationWriteFeedbackCommand.routeUpdateSuccess({
    required int inlineStopUpsertsCount,
  }) : this._(
          kind: _RouteMutationWriteFeedbackCommandKind.routeUpdateSuccess,
          inlineStopUpsertsCount: inlineStopUpsertsCount,
        );

  const PlanRouteMutationWriteFeedbackCommand.routeUpdateFailure()
      : this._(kind: _RouteMutationWriteFeedbackCommandKind.routeUpdateFailure);

  const PlanRouteMutationWriteFeedbackCommand.upsertStopSuccess({
    required String stopId,
  }) : this._(
          kind: _RouteMutationWriteFeedbackCommandKind.upsertStopSuccess,
          stopId: stopId,
        );

  const PlanRouteMutationWriteFeedbackCommand.upsertStopFailure()
      : this._(kind: _RouteMutationWriteFeedbackCommandKind.upsertStopFailure);

  const PlanRouteMutationWriteFeedbackCommand.deleteStopSuccess()
      : this._(kind: _RouteMutationWriteFeedbackCommandKind.deleteStopSuccess);

  const PlanRouteMutationWriteFeedbackCommand.deleteStopFailure()
      : this._(kind: _RouteMutationWriteFeedbackCommandKind.deleteStopFailure);

  final _RouteMutationWriteFeedbackCommandKind _kind;
  final String? stopId;
  final int? inlineStopUpsertsCount;
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
        return const RouteMutationWriteFeedbackPlan(
          key: RouteMutationWriteFeedbackKey.routeUpdateFailed,
        );
      case _RouteMutationWriteFeedbackCommandKind.upsertStopSuccess:
        return RouteMutationWriteFeedbackPlan(
          key: RouteMutationWriteFeedbackKey.stopSaved,
          stopId: command.stopId,
        );
      case _RouteMutationWriteFeedbackCommandKind.upsertStopFailure:
        return const RouteMutationWriteFeedbackPlan(
          key: RouteMutationWriteFeedbackKey.stopSaveFailed,
        );
      case _RouteMutationWriteFeedbackCommandKind.deleteStopSuccess:
        return const RouteMutationWriteFeedbackPlan(
          key: RouteMutationWriteFeedbackKey.stopDeleted,
        );
      case _RouteMutationWriteFeedbackCommandKind.deleteStopFailure:
        return const RouteMutationWriteFeedbackPlan(
          key: RouteMutationWriteFeedbackKey.stopDeleteFailed,
        );
    }
  }
}
