import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/classify_route_mutation_create_failure_use_case.dart';
import 'package:neredeservis/features/driver/application/plan_create_driver_route_failure_handling_use_case.dart';
import 'package:neredeservis/features/driver/application/plan_route_mutation_create_failure_feedback_use_case.dart';
import 'package:neredeservis/features/driver/application/resolve_route_mutation_create_failure_feedback_message_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('PlanCreateDriverRouteFailureHandlingUseCase', () {
    const planner = PlanCreateDriverRouteFailureHandlingUseCase(
      planRouteMutationCreateFailureFeedbackUseCase:
          PlanRouteMutationCreateFailureFeedbackUseCase(
        classifyRouteMutationCreateFailureUseCase:
            ClassifyRouteMutationCreateFailureUseCase(),
      ),
      resolveRouteMutationCreateFailureFeedbackMessageUseCase:
          ResolveRouteMutationCreateFailureFeedbackMessageUseCase(),
    );

    test('plans redirect to driver profile setup on profile precondition', () {
      final plan = planner.execute(
        const PlanCreateDriverRouteFailureHandlingCommand(
          code: 'failed-precondition',
          message: 'driver profile is required',
        ),
      );

      expect(
        plan.action,
        CreateDriverRouteFailureHandlingAction
            .showInfoAndRedirectDriverProfileSetup,
      );
      expect(
        plan.feedbackMessage,
        'Sofor profilini tamamlamadan rota islemi yapamazsin.',
      );
    });

    test('plans info only on generic invalid argument failure', () {
      final plan = planner.execute(
        const PlanCreateDriverRouteFailureHandlingCommand(
          code: 'invalid-argument',
          message: 'invalid route',
        ),
      );

      expect(plan.action, CreateDriverRouteFailureHandlingAction.showInfoOnly);
      expect(
        plan.feedbackMessage,
        'Rota bilgileri gecersiz. Tum alanlari kontrol edip tekrar dene.',
      );
    });

    test('preserves fallback token-based message', () {
      final plan = planner.execute(
        const PlanCreateDriverRouteFailureHandlingCommand(
          code: 'weird-error',
          message: 'oops',
        ),
      );

      expect(plan.action, CreateDriverRouteFailureHandlingAction.showInfoOnly);
      expect(
        plan.feedbackMessage,
        '${CoreErrorFeedbackTokens.routeCreateFailed} (weird-error)',
      );
    });
  });
}
