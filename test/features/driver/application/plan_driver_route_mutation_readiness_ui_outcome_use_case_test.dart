import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/plan_driver_route_mutation_readiness_ui_outcome_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('PlanDriverRouteMutationReadinessUiOutcomeUseCase', () {
    const useCase = PlanDriverRouteMutationReadinessUiOutcomeUseCase();

    test('plans unauthenticated outcome with auth push navigation', () {
      final plan = useCase.execute(
        const PlanDriverRouteMutationReadinessUiOutcomeCommand
            .unauthenticated(),
      );

      expect(plan.allowsRouteMutation, isFalse);
      expect(
        plan.navigationKind,
        DriverRouteMutationReadinessUiNavigationKind.pushAuthWithDriverNextRole,
      );
      expect(plan.feedbackMessage,
          'Rota olusturmak icin once giris yapman gerekiyor.');
    });

    test('plans profile check failed outcome with shared token copy', () {
      final plan = useCase.execute(
        const PlanDriverRouteMutationReadinessUiOutcomeCommand
            .profileCheckFailed(),
      );

      expect(plan.allowsRouteMutation, isFalse);
      expect(plan.navigationKind,
          DriverRouteMutationReadinessUiNavigationKind.none);
      expect(plan.feedbackMessage, CoreErrorFeedbackTokens.profileCheckFailed);
    });

    test('plans driver role required outcome', () {
      final plan = useCase.execute(
        const PlanDriverRouteMutationReadinessUiOutcomeCommand
            .driverRoleRequired(),
      );

      expect(plan.allowsRouteMutation, isFalse);
      expect(
        plan.navigationKind,
        DriverRouteMutationReadinessUiNavigationKind.goRoleSelect,
      );
      expect(
          plan.feedbackMessage, 'Rota islemleri icin sofor moduna gecmelisin.');
    });

    test('plans driver profile setup required outcome', () {
      final plan = useCase.execute(
        const PlanDriverRouteMutationReadinessUiOutcomeCommand
            .driverProfileSetupRequired(),
      );

      expect(plan.allowsRouteMutation, isFalse);
      expect(
        plan.navigationKind,
        DriverRouteMutationReadinessUiNavigationKind.goDriverProfileSetup,
      );
      expect(
        plan.feedbackMessage,
        'Rota islemleri icin once sofor profilini tamamlamalisin.',
      );
    });

    test('plans allow outcome', () {
      final plan = useCase.execute(
        const PlanDriverRouteMutationReadinessUiOutcomeCommand.allow(),
      );

      expect(plan.allowsRouteMutation, isTrue);
      expect(plan.navigationKind,
          DriverRouteMutationReadinessUiNavigationKind.none);
      expect(plan.feedbackMessage, isNull);
    });
  });
}
