import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/application/plan_profile_update_feedback_handling_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('PlanProfileUpdateFeedbackHandlingUseCase', () {
    const useCase = PlanProfileUpdateFeedbackHandlingUseCase();

    test('returns success plan with provided message', () {
      final plan = useCase.execute(
        const PlanProfileUpdateFeedbackHandlingCommand(
          succeeded: true,
          successMessage: 'Profil guncellendi.',
        ),
      );

      expect(plan.action, ProfileUpdateFeedbackHandlingAction.showInfoOnly);
      expect(plan.feedbackMessage, 'Profil guncellendi.');
    });

    test('returns failure token plan and rethrow action on failure', () {
      final plan = useCase.execute(
        const PlanProfileUpdateFeedbackHandlingCommand(
          succeeded: false,
          successMessage: 'ignored',
        ),
      );

      expect(
        plan.action,
        ProfileUpdateFeedbackHandlingAction.showInfoAndRethrow,
      );
      expect(plan.feedbackMessage, CoreErrorFeedbackTokens.profileUpdateFailed);
    });
  });
}
