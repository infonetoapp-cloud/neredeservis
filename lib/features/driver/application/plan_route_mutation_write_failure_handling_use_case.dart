import 'plan_route_mutation_write_feedback_use_case.dart';
import 'resolve_route_mutation_write_feedback_message_use_case.dart';

enum RouteMutationWriteFailureHandlingAction {
  showInfoOnly,
}

enum _RouteMutationWriteFailureHandlingKind {
  routeUpdateFailure,
  upsertStopFailure,
  deleteStopFailure,
}

class PlanRouteMutationWriteFailureHandlingCommand {
  const PlanRouteMutationWriteFailureHandlingCommand._({
    required _RouteMutationWriteFailureHandlingKind kind,
  }) : _kind = kind;

  const PlanRouteMutationWriteFailureHandlingCommand.routeUpdateFailure()
      : this._(kind: _RouteMutationWriteFailureHandlingKind.routeUpdateFailure);

  const PlanRouteMutationWriteFailureHandlingCommand.upsertStopFailure()
      : this._(kind: _RouteMutationWriteFailureHandlingKind.upsertStopFailure);

  const PlanRouteMutationWriteFailureHandlingCommand.deleteStopFailure()
      : this._(kind: _RouteMutationWriteFailureHandlingKind.deleteStopFailure);

  final _RouteMutationWriteFailureHandlingKind _kind;
}

class RouteMutationWriteFailureHandlingPlan {
  const RouteMutationWriteFailureHandlingPlan({
    required this.action,
    required this.feedbackMessage,
  });

  final RouteMutationWriteFailureHandlingAction action;
  final String feedbackMessage;
}

class PlanRouteMutationWriteFailureHandlingUseCase {
  const PlanRouteMutationWriteFailureHandlingUseCase({
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

  RouteMutationWriteFailureHandlingPlan execute(
    PlanRouteMutationWriteFailureHandlingCommand command,
  ) {
    final feedbackPlan = _planRouteMutationWriteFeedbackUseCase.execute(
      switch (command._kind) {
        _RouteMutationWriteFailureHandlingKind.routeUpdateFailure =>
          const PlanRouteMutationWriteFeedbackCommand.routeUpdateFailure(),
        _RouteMutationWriteFailureHandlingKind.upsertStopFailure =>
          const PlanRouteMutationWriteFeedbackCommand.upsertStopFailure(),
        _RouteMutationWriteFailureHandlingKind.deleteStopFailure =>
          const PlanRouteMutationWriteFeedbackCommand.deleteStopFailure(),
      },
    );

    return RouteMutationWriteFailureHandlingPlan(
      action: RouteMutationWriteFailureHandlingAction.showInfoOnly,
      feedbackMessage: _resolveRouteMutationWriteFeedbackMessageUseCase
          .execute(feedbackPlan),
    );
  }
}
