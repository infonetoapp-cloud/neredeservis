import '../../../ui/tokens/error_feedback_tokens.dart';
import 'resolve_guest_join_failure_route_reason_use_case.dart';
import 'resolve_guest_session_create_failure_feedback_message_use_case.dart';

enum GuestSessionCreateFailureHandlingAction {
  showInfoOnly,
  navigateToJoinErrorRoute,
}

enum _GuestSessionCreateFailureHandlingKind {
  incompleteResponse,
  functionsFailure,
  unknownFailure,
}

class PlanGuestSessionCreateFailureHandlingCommand {
  const PlanGuestSessionCreateFailureHandlingCommand._({
    required _GuestSessionCreateFailureHandlingKind kind,
    required this.isQrEntry,
    this.errorCode,
  }) : _kind = kind;

  const PlanGuestSessionCreateFailureHandlingCommand.incompleteResponse({
    required bool isQrEntry,
  }) : this._(
          kind: _GuestSessionCreateFailureHandlingKind.incompleteResponse,
          isQrEntry: isQrEntry,
        );

  const PlanGuestSessionCreateFailureHandlingCommand.functionsFailure({
    required bool isQrEntry,
    required String? errorCode,
  }) : this._(
          kind: _GuestSessionCreateFailureHandlingKind.functionsFailure,
          isQrEntry: isQrEntry,
          errorCode: errorCode,
        );

  const PlanGuestSessionCreateFailureHandlingCommand.unknownFailure({
    required bool isQrEntry,
  }) : this._(
          kind: _GuestSessionCreateFailureHandlingKind.unknownFailure,
          isQrEntry: isQrEntry,
        );

  final _GuestSessionCreateFailureHandlingKind _kind;
  final bool isQrEntry;
  final String? errorCode;
}

class GuestSessionCreateFailureHandlingPlan {
  const GuestSessionCreateFailureHandlingPlan({
    required this.action,
    this.feedbackMessage,
    this.joinErrorReason,
  });

  final GuestSessionCreateFailureHandlingAction action;
  final String? feedbackMessage;
  final String? joinErrorReason;
}

class PlanGuestSessionCreateFailureHandlingUseCase {
  const PlanGuestSessionCreateFailureHandlingUseCase({
    required ResolveGuestJoinFailureRouteReasonUseCase
        resolveGuestJoinFailureRouteReasonUseCase,
    required ResolveGuestSessionCreateFailureFeedbackMessageUseCase
        resolveGuestSessionCreateFailureFeedbackMessageUseCase,
  })  : _resolveGuestJoinFailureRouteReasonUseCase =
            resolveGuestJoinFailureRouteReasonUseCase,
        _resolveGuestSessionCreateFailureFeedbackMessageUseCase =
            resolveGuestSessionCreateFailureFeedbackMessageUseCase;

  final ResolveGuestJoinFailureRouteReasonUseCase
      _resolveGuestJoinFailureRouteReasonUseCase;
  final ResolveGuestSessionCreateFailureFeedbackMessageUseCase
      _resolveGuestSessionCreateFailureFeedbackMessageUseCase;

  GuestSessionCreateFailureHandlingPlan execute(
    PlanGuestSessionCreateFailureHandlingCommand command,
  ) {
    if (command.isQrEntry) {
      final reason = switch (command._kind) {
        _GuestSessionCreateFailureHandlingKind.functionsFailure =>
          _resolveGuestJoinFailureRouteReasonUseCase.execute(
            errorCode: command.errorCode,
          ),
        _GuestSessionCreateFailureHandlingKind.incompleteResponse ||
        _GuestSessionCreateFailureHandlingKind.unknownFailure =>
          'unknown',
      };
      return GuestSessionCreateFailureHandlingPlan(
        action:
            GuestSessionCreateFailureHandlingAction.navigateToJoinErrorRoute,
        joinErrorReason: reason,
      );
    }

    final feedbackMessage = switch (command._kind) {
      _GuestSessionCreateFailureHandlingKind.incompleteResponse =>
        CoreErrorFeedbackTokens.guestSessionResponseIncomplete,
      _GuestSessionCreateFailureHandlingKind.functionsFailure =>
        _resolveGuestSessionCreateFailureFeedbackMessageUseCase.execute(
          errorCode: command.errorCode,
        ),
      _GuestSessionCreateFailureHandlingKind.unknownFailure =>
        CoreErrorFeedbackTokens.guestSessionCreateFailed,
    };

    return GuestSessionCreateFailureHandlingPlan(
      action: GuestSessionCreateFailureHandlingAction.showInfoOnly,
      feedbackMessage: feedbackMessage,
    );
  }
}
