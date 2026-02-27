import 'plan_route_mutation_create_failure_feedback_use_case.dart';
import 'resolve_route_mutation_create_failure_feedback_message_use_case.dart';

enum CreateDriverRouteFailureHandlingAction {
  showInfoOnly,
  showInfoAndRedirectDriverProfileSetup,
}

class PlanCreateDriverRouteFailureHandlingCommand {
  const PlanCreateDriverRouteFailureHandlingCommand({
    required this.code,
    required this.message,
  });

  final String code;
  final String? message;
}

class CreateDriverRouteFailureHandlingPlan {
  const CreateDriverRouteFailureHandlingPlan({
    required this.action,
    required this.feedbackMessage,
  });

  final CreateDriverRouteFailureHandlingAction action;
  final String feedbackMessage;
}

class PlanCreateDriverRouteFailureHandlingUseCase {
  const PlanCreateDriverRouteFailureHandlingUseCase({
    required PlanRouteMutationCreateFailureFeedbackUseCase
        planRouteMutationCreateFailureFeedbackUseCase,
    required ResolveRouteMutationCreateFailureFeedbackMessageUseCase
        resolveRouteMutationCreateFailureFeedbackMessageUseCase,
  })  : _planRouteMutationCreateFailureFeedbackUseCase =
            planRouteMutationCreateFailureFeedbackUseCase,
        _resolveRouteMutationCreateFailureFeedbackMessageUseCase =
            resolveRouteMutationCreateFailureFeedbackMessageUseCase;

  final PlanRouteMutationCreateFailureFeedbackUseCase
      _planRouteMutationCreateFailureFeedbackUseCase;
  final ResolveRouteMutationCreateFailureFeedbackMessageUseCase
      _resolveRouteMutationCreateFailureFeedbackMessageUseCase;

  CreateDriverRouteFailureHandlingPlan execute(
    PlanCreateDriverRouteFailureHandlingCommand command,
  ) {
    final feedbackPlan = _planRouteMutationCreateFailureFeedbackUseCase.execute(
      PlanRouteMutationCreateFailureFeedbackCommand(
        code: command.code,
        message: command.message,
      ),
    );
    final feedbackMessage =
        _resolveRouteMutationCreateFailureFeedbackMessageUseCase.execute(
      feedbackPlan,
    );

    final action = feedbackPlan.key ==
            RouteMutationCreateFailureFeedbackKey.driverProfilePrecondition
        ? CreateDriverRouteFailureHandlingAction
            .showInfoAndRedirectDriverProfileSetup
        : CreateDriverRouteFailureHandlingAction.showInfoOnly;

    return CreateDriverRouteFailureHandlingPlan(
      action: action,
      feedbackMessage: feedbackMessage,
    );
  }
}
