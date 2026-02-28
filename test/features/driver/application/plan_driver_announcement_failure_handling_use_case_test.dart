import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/plan_driver_announcement_failure_handling_use_case.dart';
import 'package:neredeservis/features/subscription/presentation/paywall_copy_tr.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('PlanDriverAnnouncementFailureHandlingUseCase', () {
    const useCase = PlanDriverAnnouncementFailureHandlingUseCase();

    test('plans premium entitlement permission denied as paywall redirect', () {
      final plan = useCase.execute(
        const PlanDriverAnnouncementFailureHandlingCommand(
          errorCode: 'permission-denied',
          rawErrorMessage:
              'Premium entitlement missing subscriptionStatus=free',
        ),
      );

      expect(
        plan.feedbackMessage,
        '${PaywallCopyTr.premiumInterceptBody} ${PaywallCopyTr.premiumInterceptCta}',
      );
      expect(plan.shouldRedirectToPaywall, isTrue);
    });

    test('plans generic permission denied without redirect', () {
      final plan = useCase.execute(
        const PlanDriverAnnouncementFailureHandlingCommand(
          errorCode: 'permission-denied',
          rawErrorMessage: 'forbidden',
        ),
      );

      expect(plan.feedbackMessage, 'Duyuru gonderme yetkiniz yok.');
      expect(plan.shouldRedirectToPaywall, isFalse);
    });

    test('plans not-found message', () {
      final plan = useCase.execute(
        const PlanDriverAnnouncementFailureHandlingCommand(
          errorCode: 'not-found',
          rawErrorMessage: null,
        ),
      );

      expect(plan.feedbackMessage, 'Route bulunamadi.');
      expect(plan.shouldRedirectToPaywall, isFalse);
    });

    test('plans failed-precondition message', () {
      final plan = useCase.execute(
        const PlanDriverAnnouncementFailureHandlingCommand(
          errorCode: 'failed-precondition',
          rawErrorMessage: null,
        ),
      );

      expect(
        plan.feedbackMessage,
        'Bu route icin su anda duyuru gonderemezsiniz.',
      );
      expect(plan.shouldRedirectToPaywall, isFalse);
    });

    test('falls back to default token', () {
      final plan = useCase.execute(
        const PlanDriverAnnouncementFailureHandlingCommand(
          errorCode: 'internal',
          rawErrorMessage: 'boom',
        ),
      );

      expect(
          plan.feedbackMessage, CoreErrorFeedbackTokens.announcementSendFailed);
      expect(plan.shouldRedirectToPaywall, isFalse);
    });
  });
}
