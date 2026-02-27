import '../../../ui/tokens/error_feedback_tokens.dart';
import 'resolve_join_by_srv_code_failure_feedback_message_use_case.dart';
import 'resolve_passenger_join_failure_route_reason_use_case.dart';

enum PassengerJoinFailureHandlingAction {
  showInfoOnly,
  navigateToJoinErrorRoute,
}

enum _PassengerJoinFailureHandlingKind {
  incompleteResponse,
  functionsFailure,
  unknownFailure,
}

class PlanPassengerJoinFailureHandlingCommand {
  const PlanPassengerJoinFailureHandlingCommand._({
    required _PassengerJoinFailureHandlingKind kind,
    required this.isQrEntry,
    this.errorCode,
    this.errorMessage,
  }) : _kind = kind;

  const PlanPassengerJoinFailureHandlingCommand.incompleteResponse({
    required bool isQrEntry,
  }) : this._(
          kind: _PassengerJoinFailureHandlingKind.incompleteResponse,
          isQrEntry: isQrEntry,
        );

  const PlanPassengerJoinFailureHandlingCommand.functionsFailure({
    required bool isQrEntry,
    required String? errorCode,
    required String? errorMessage,
  }) : this._(
          kind: _PassengerJoinFailureHandlingKind.functionsFailure,
          isQrEntry: isQrEntry,
          errorCode: errorCode,
          errorMessage: errorMessage,
        );

  const PlanPassengerJoinFailureHandlingCommand.unknownFailure({
    required bool isQrEntry,
  }) : this._(
          kind: _PassengerJoinFailureHandlingKind.unknownFailure,
          isQrEntry: isQrEntry,
        );

  final _PassengerJoinFailureHandlingKind _kind;
  final bool isQrEntry;
  final String? errorCode;
  final String? errorMessage;
}

class PassengerJoinFailureHandlingPlan {
  const PassengerJoinFailureHandlingPlan({
    required this.action,
    this.feedbackMessage,
    this.joinErrorReason,
  });

  final PassengerJoinFailureHandlingAction action;
  final String? feedbackMessage;
  final String? joinErrorReason;
}

class PlanPassengerJoinFailureHandlingUseCase {
  const PlanPassengerJoinFailureHandlingUseCase({
    required ResolveJoinBySrvCodeFailureFeedbackMessageUseCase
        resolveJoinBySrvCodeFailureFeedbackMessageUseCase,
    required ResolvePassengerJoinFailureRouteReasonUseCase
        resolvePassengerJoinFailureRouteReasonUseCase,
  })  : _resolveJoinBySrvCodeFailureFeedbackMessageUseCase =
            resolveJoinBySrvCodeFailureFeedbackMessageUseCase,
        _resolvePassengerJoinFailureRouteReasonUseCase =
            resolvePassengerJoinFailureRouteReasonUseCase;

  final ResolveJoinBySrvCodeFailureFeedbackMessageUseCase
      _resolveJoinBySrvCodeFailureFeedbackMessageUseCase;
  final ResolvePassengerJoinFailureRouteReasonUseCase
      _resolvePassengerJoinFailureRouteReasonUseCase;

  PassengerJoinFailureHandlingPlan execute(
    PlanPassengerJoinFailureHandlingCommand command,
  ) {
    if (command.isQrEntry) {
      final reason = switch (command._kind) {
        _PassengerJoinFailureHandlingKind.functionsFailure =>
          _resolvePassengerJoinFailureRouteReasonUseCase.execute(
            errorCode: command.errorCode,
          ),
        _PassengerJoinFailureHandlingKind.incompleteResponse ||
        _PassengerJoinFailureHandlingKind.unknownFailure =>
          'unknown',
      };
      return PassengerJoinFailureHandlingPlan(
        action: PassengerJoinFailureHandlingAction.navigateToJoinErrorRoute,
        joinErrorReason: reason,
      );
    }

    final feedbackMessage = switch (command._kind) {
      _PassengerJoinFailureHandlingKind.incompleteResponse =>
        CoreErrorFeedbackTokens.joinResponseIncomplete,
      _PassengerJoinFailureHandlingKind.functionsFailure =>
        _resolveJoinBySrvCodeFailureFeedbackMessageUseCase.execute(
          errorCode: command.errorCode,
          errorMessage: command.errorMessage,
        ),
      _PassengerJoinFailureHandlingKind.unknownFailure =>
        CoreErrorFeedbackTokens.joinFailed,
    };

    return PassengerJoinFailureHandlingPlan(
      action: PassengerJoinFailureHandlingAction.showInfoOnly,
      feedbackMessage: feedbackMessage,
    );
  }
}
