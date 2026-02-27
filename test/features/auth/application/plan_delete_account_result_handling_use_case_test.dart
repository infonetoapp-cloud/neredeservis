import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/application/plan_delete_account_result_handling_use_case.dart';

void main() {
  group('PlanDeleteAccountResultHandlingUseCase', () {
    const useCase = PlanDeleteAccountResultHandlingUseCase();

    test('plans blocked subscription with provided message and label', () {
      final plan = useCase.execute(
        const PlanDeleteAccountResultHandlingCommand(
          status: 'blocked_subscription',
          interceptorMessage: 'Custom body',
          manageSubscriptionLabel: 'Open billing',
          defaultBlockedSubscriptionMessage: 'Default body',
          defaultManageSubscriptionLabel: 'Default manage',
          successMessage: 'Success',
        ),
      );

      expect(
        plan.action,
        DeleteAccountResultHandlingAction.showBlockedSubscriptionDialog,
      );
      expect(plan.feedbackMessage, 'Custom body');
      expect(plan.manageSubscriptionLabel, 'Open billing');
    });

    test('uses defaults when blocked subscription payload fields are blank',
        () {
      final plan = useCase.execute(
        const PlanDeleteAccountResultHandlingCommand(
          status: 'blocked_subscription',
          interceptorMessage: '   ',
          manageSubscriptionLabel: '',
          defaultBlockedSubscriptionMessage: 'Default body',
          defaultManageSubscriptionLabel: 'Default manage',
          successMessage: 'Success',
        ),
      );

      expect(plan.feedbackMessage, 'Default body');
      expect(plan.manageSubscriptionLabel, 'Default manage');
    });

    test('plans success info for non-blocked status', () {
      final plan = useCase.execute(
        const PlanDeleteAccountResultHandlingCommand(
          status: 'accepted',
          interceptorMessage: null,
          manageSubscriptionLabel: null,
          defaultBlockedSubscriptionMessage: 'Default body',
          defaultManageSubscriptionLabel: 'Default manage',
          successMessage: 'Hesap silme talebi alindi.',
        ),
      );

      expect(plan.action, DeleteAccountResultHandlingAction.showSuccessInfo);
      expect(plan.feedbackMessage, 'Hesap silme talebi alindi.');
      expect(plan.manageSubscriptionLabel, isNull);
    });
  });
}
