import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/plan_route_mutation_create_failure_feedback_use_case.dart';
import 'package:neredeservis/features/driver/application/resolve_route_mutation_create_failure_feedback_message_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('ResolveRouteMutationCreateFailureFeedbackMessageUseCase', () {
    const useCase = ResolveRouteMutationCreateFailureFeedbackMessageUseCase();

    test('uses shared token copy for unauthenticated', () {
      final message = useCase.execute(
        const RouteMutationCreateFailureFeedbackPlan(
          key: RouteMutationCreateFailureFeedbackKey.unauthenticated,
        ),
      );

      expect(message, CoreErrorFeedbackTokens.sessionMissingSignInAgain);
    });

    test('resolves driver profile precondition copy', () {
      final message = useCase.execute(
        const RouteMutationCreateFailureFeedbackPlan(
          key: RouteMutationCreateFailureFeedbackKey.driverProfilePrecondition,
        ),
      );

      expect(message, 'Sofor profilini tamamlamadan rota islemi yapamazsin.');
    });

    test('resolves retryable unavailable copy', () {
      final message = useCase.execute(
        const RouteMutationCreateFailureFeedbackPlan(
          key: RouteMutationCreateFailureFeedbackKey.retryableUnavailable,
        ),
      );

      expect(
          message, 'Sunucuya ulasilamadi. Interneti kontrol edip tekrar dene.');
    });

    test('normalizes blank code label in fallback branch', () {
      final message = useCase.execute(
        const RouteMutationCreateFailureFeedbackPlan(
          key: RouteMutationCreateFailureFeedbackKey.routeCreateFailedWithCode,
          codeLabel: '   ',
        ),
      );

      expect(message, '${CoreErrorFeedbackTokens.routeCreateFailed} (unknown)');
    });
  });
}
