import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/passenger/application/plan_guest_session_create_failure_handling_use_case.dart';
import 'package:neredeservis/features/passenger/application/resolve_guest_join_failure_route_reason_use_case.dart';
import 'package:neredeservis/features/passenger/application/resolve_guest_session_create_failure_feedback_message_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('PlanGuestSessionCreateFailureHandlingUseCase', () {
    const useCase = PlanGuestSessionCreateFailureHandlingUseCase(
      resolveGuestJoinFailureRouteReasonUseCase:
          ResolveGuestJoinFailureRouteReasonUseCase(),
      resolveGuestSessionCreateFailureFeedbackMessageUseCase:
          ResolveGuestSessionCreateFailureFeedbackMessageUseCase(),
    );

    test('plans QR functions failure as route reason', () {
      final plan = useCase.execute(
        const PlanGuestSessionCreateFailureHandlingCommand.functionsFailure(
          isQrEntry: true,
          errorCode: 'unauthenticated',
        ),
      );

      expect(
        plan.action,
        GuestSessionCreateFailureHandlingAction.navigateToJoinErrorRoute,
      );
      expect(plan.joinErrorReason, 'session_expired');
    });

    test('plans manual functions failure as feedback message', () {
      final plan = useCase.execute(
        const PlanGuestSessionCreateFailureHandlingCommand.functionsFailure(
          isQrEntry: false,
          errorCode: 'not-found',
        ),
      );

      expect(plan.action, GuestSessionCreateFailureHandlingAction.showInfoOnly);
      expect(plan.feedbackMessage, 'SRV kodu ile route bulunamadi.');
    });

    test('plans QR incomplete response as unknown route reason', () {
      final plan = useCase.execute(
        const PlanGuestSessionCreateFailureHandlingCommand.incompleteResponse(
          isQrEntry: true,
        ),
      );

      expect(
        plan.action,
        GuestSessionCreateFailureHandlingAction.navigateToJoinErrorRoute,
      );
      expect(plan.joinErrorReason, 'unknown');
    });

    test('plans manual incomplete response token', () {
      final plan = useCase.execute(
        const PlanGuestSessionCreateFailureHandlingCommand.incompleteResponse(
          isQrEntry: false,
        ),
      );

      expect(plan.action, GuestSessionCreateFailureHandlingAction.showInfoOnly);
      expect(
        plan.feedbackMessage,
        CoreErrorFeedbackTokens.guestSessionResponseIncomplete,
      );
    });

    test('plans manual unknown failure token', () {
      final plan = useCase.execute(
        const PlanGuestSessionCreateFailureHandlingCommand.unknownFailure(
          isQrEntry: false,
        ),
      );

      expect(plan.action, GuestSessionCreateFailureHandlingAction.showInfoOnly);
      expect(plan.feedbackMessage,
          CoreErrorFeedbackTokens.guestSessionCreateFailed);
    });
  });
}
