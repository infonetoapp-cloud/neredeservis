import 'plan_route_mutation_write_feedback_use_case.dart';
import 'resolve_route_mutation_write_feedback_message_use_case.dart';

enum RouteMutationWriteSuccessHandlingAction {
  showInfoOnly,
}

enum _RouteMutationWriteSuccessHandlingKind {
  routeUpdateSuccess,
  upsertStopSuccess,
  deleteStopSuccess,
}

class PlanRouteMutationWriteSuccessHandlingCommand {
  const PlanRouteMutationWriteSuccessHandlingCommand._({
    required _RouteMutationWriteSuccessHandlingKind kind,
    this.inlineStopUpsertsCount,
    this.stopId,
  }) : _kind = kind;

  const PlanRouteMutationWriteSuccessHandlingCommand.routeUpdateSuccess({
    required int inlineStopUpsertsCount,
  }) : this._(
          kind: _RouteMutationWriteSuccessHandlingKind.routeUpdateSuccess,
          inlineStopUpsertsCount: inlineStopUpsertsCount,
        );

  const PlanRouteMutationWriteSuccessHandlingCommand.upsertStopSuccess({
    required String stopId,
  }) : this._(
          kind: _RouteMutationWriteSuccessHandlingKind.upsertStopSuccess,
          stopId: stopId,
        );

  const PlanRouteMutationWriteSuccessHandlingCommand.deleteStopSuccess()
      : this._(kind: _RouteMutationWriteSuccessHandlingKind.deleteStopSuccess);

  final _RouteMutationWriteSuccessHandlingKind _kind;
  final int? inlineStopUpsertsCount;
  final String? stopId;
}

class RouteMutationWriteSuccessHandlingPlan {
  const RouteMutationWriteSuccessHandlingPlan({
    required this.action,
    required this.feedbackMessage,
  });

  final RouteMutationWriteSuccessHandlingAction action;
  final String feedbackMessage;
}

class PlanRouteMutationWriteSuccessHandlingUseCase {
  const PlanRouteMutationWriteSuccessHandlingUseCase({
    required PlanRouteMutationWriteFeedbackUseCase
        planRouteMutationWriteFeedbackUseCase,
    required ResolveRouteMutationWriteFeedbackMessageUseCase
        resolveRouteMutationWriteFeedbackMessageUseCase,
  })  : _planRouteMutationWriteFeedbackUseCase =
            planRouteMutationWriteFeedbackUseCase,
        _resolveRouteMutationWriteFeedbackMessageUseCase =
            resolveRouteMutationWriteFeedbackMessageUseCase;

  final PlanRouteMutationWriteFeedbackUseCase
      _planRouteMutationWriteFeedbackUseCase;
  final ResolveRouteMutationWriteFeedbackMessageUseCase
      _resolveRouteMutationWriteFeedbackMessageUseCase;

  RouteMutationWriteSuccessHandlingPlan execute(
    PlanRouteMutationWriteSuccessHandlingCommand command,
  ) {
    final feedbackPlan = _planRouteMutationWriteFeedbackUseCase.execute(
      switch (command._kind) {
        _RouteMutationWriteSuccessHandlingKind.routeUpdateSuccess =>
          PlanRouteMutationWriteFeedbackCommand.routeUpdateSuccess(
            inlineStopUpsertsCount: command.inlineStopUpsertsCount ?? 0,
          ),
        _RouteMutationWriteSuccessHandlingKind.upsertStopSuccess =>
          PlanRouteMutationWriteFeedbackCommand.upsertStopSuccess(
            stopId: command.stopId ?? '',
          ),
        _RouteMutationWriteSuccessHandlingKind.deleteStopSuccess =>
          const PlanRouteMutationWriteFeedbackCommand.deleteStopSuccess(),
      },
    );

    return RouteMutationWriteSuccessHandlingPlan(
      action: RouteMutationWriteSuccessHandlingAction.showInfoOnly,
      feedbackMessage: _resolveRouteMutationWriteFeedbackMessageUseCase
          .execute(feedbackPlan),
    );
  }
}
