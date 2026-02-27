import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/plan_route_mutation_write_feedback_use_case.dart';
import 'package:neredeservis/features/driver/application/resolve_route_mutation_write_feedback_message_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('ResolveRouteMutationWriteFeedbackMessageUseCase', () {
    const useCase = ResolveRouteMutationWriteFeedbackMessageUseCase();

    test('resolves route update success message without inline stops', () {
      final message = useCase.execute(
        const RouteMutationWriteFeedbackPlan(
          key: RouteMutationWriteFeedbackKey.routeUpdateSavedWithoutStopChanges,
          inlineStopUpsertsCount: 0,
        ),
      );

      expect(message, 'Route guncellendi.');
    });

    test('resolves route update success message with inline stops count', () {
      final message = useCase.execute(
        const RouteMutationWriteFeedbackPlan(
          key: RouteMutationWriteFeedbackKey.routeUpdateSavedWithStopChanges,
          inlineStopUpsertsCount: 2,
        ),
      );

      expect(message, 'Route guncellendi. 2 durak kaydedildi.');
    });

    test('normalizes blank stop id on stop saved feedback', () {
      final message = useCase.execute(
        const RouteMutationWriteFeedbackPlan(
          key: RouteMutationWriteFeedbackKey.stopSaved,
          stopId: '   ',
        ),
      );

      expect(message, 'Durak kaydedildi. Stop ID: -');
    });

    test('uses shared token copy for failure branches', () {
      final updateFailure = useCase.execute(
        const RouteMutationWriteFeedbackPlan(
          key: RouteMutationWriteFeedbackKey.routeUpdateFailed,
        ),
      );
      final stopDeleteFailure = useCase.execute(
        const RouteMutationWriteFeedbackPlan(
          key: RouteMutationWriteFeedbackKey.stopDeleteFailed,
        ),
      );

      expect(updateFailure, CoreErrorFeedbackTokens.routeUpdateFailed);
      expect(stopDeleteFailure, CoreErrorFeedbackTokens.stopDeleteFailed);
    });
  });
}
