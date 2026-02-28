import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/passenger/application/plan_passenger_join_failure_handling_use_case.dart';
import 'package:neredeservis/features/passenger/application/resolve_join_by_srv_code_failure_feedback_message_use_case.dart';
import 'package:neredeservis/features/passenger/application/resolve_passenger_join_failure_route_reason_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('PlanPassengerJoinFailureHandlingUseCase', () {
    const useCase = PlanPassengerJoinFailureHandlingUseCase(
      resolveJoinBySrvCodeFailureFeedbackMessageUseCase:
          ResolveJoinBySrvCodeFailureFeedbackMessageUseCase(),
      resolvePassengerJoinFailureRouteReasonUseCase:
          ResolvePassengerJoinFailureRouteReasonUseCase(),
    );

    test('plans QR incomplete response as join error route unknown', () {
      final plan = useCase.execute(
        const PlanPassengerJoinFailureHandlingCommand.incompleteResponse(
          isQrEntry: true,
        ),
      );

      expect(
        plan.action,
        PassengerJoinFailureHandlingAction.navigateToJoinErrorRoute,
      );
      expect(plan.joinErrorReason, 'unknown');
      expect(plan.feedbackMessage, isNull);
    });

    test('plans manual incomplete response as info token', () {
      final plan = useCase.execute(
        const PlanPassengerJoinFailureHandlingCommand.incompleteResponse(
          isQrEntry: false,
        ),
      );

      expect(plan.action, PassengerJoinFailureHandlingAction.showInfoOnly);
      expect(
          plan.feedbackMessage, CoreErrorFeedbackTokens.joinResponseIncomplete);
      expect(plan.joinErrorReason, isNull);
    });

    test('plans QR functions failure with route reason resolver', () {
      final plan = useCase.execute(
        const PlanPassengerJoinFailureHandlingCommand.functionsFailure(
          isQrEntry: true,
          errorCode: 'not-found',
          errorMessage: null,
        ),
      );

      expect(
        plan.action,
        PassengerJoinFailureHandlingAction.navigateToJoinErrorRoute,
      );
      expect(plan.joinErrorReason, 'srv_not_found');
    });

    test('plans manual functions failure with feedback resolver', () {
      final plan = useCase.execute(
        const PlanPassengerJoinFailureHandlingCommand.functionsFailure(
          isQrEntry: false,
          errorCode: 'not-found',
          errorMessage: null,
        ),
      );

      expect(plan.action, PassengerJoinFailureHandlingAction.showInfoOnly);
      expect(plan.feedbackMessage, 'SRV kodu ile route bulunamadi.');
    });

    test('plans manual unknown failure as joinFailed token', () {
      final plan = useCase.execute(
        const PlanPassengerJoinFailureHandlingCommand.unknownFailure(
          isQrEntry: false,
        ),
      );

      expect(plan.action, PassengerJoinFailureHandlingAction.showInfoOnly);
      expect(plan.feedbackMessage, CoreErrorFeedbackTokens.joinFailed);
    });
  });
}
