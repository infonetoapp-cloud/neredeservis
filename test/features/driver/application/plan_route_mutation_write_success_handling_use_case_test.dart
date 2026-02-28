import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/plan_route_mutation_write_feedback_use_case.dart';
import 'package:neredeservis/features/driver/application/plan_route_mutation_write_success_handling_use_case.dart';
import 'package:neredeservis/features/driver/application/resolve_route_mutation_write_feedback_message_use_case.dart';

void main() {
  group('PlanRouteMutationWriteSuccessHandlingUseCase', () {
    const useCase = PlanRouteMutationWriteSuccessHandlingUseCase(
      planRouteMutationWriteFeedbackUseCase:
          PlanRouteMutationWriteFeedbackUseCase(),
      resolveRouteMutationWriteFeedbackMessageUseCase:
          ResolveRouteMutationWriteFeedbackMessageUseCase(),
    );

    test('plans route update success feedback with inline stop count', () {
      final plan = useCase.execute(
        const PlanRouteMutationWriteSuccessHandlingCommand.routeUpdateSuccess(
          inlineStopUpsertsCount: 2,
        ),
      );

      expect(plan.action, RouteMutationWriteSuccessHandlingAction.showInfoOnly);
      expect(plan.feedbackMessage, 'Route guncellendi. 2 durak kaydedildi.');
    });

    test('plans upsert stop success feedback', () {
      final plan = useCase.execute(
        const PlanRouteMutationWriteSuccessHandlingCommand.upsertStopSuccess(
          stopId: 'stop_42',
        ),
      );

      expect(plan.action, RouteMutationWriteSuccessHandlingAction.showInfoOnly);
      expect(plan.feedbackMessage, 'Durak kaydedildi. Stop ID: stop_42');
    });

    test('plans delete stop success feedback', () {
      final plan = useCase.execute(
        const PlanRouteMutationWriteSuccessHandlingCommand.deleteStopSuccess(),
      );

      expect(plan.action, RouteMutationWriteSuccessHandlingAction.showInfoOnly);
      expect(plan.feedbackMessage, 'Durak silindi.');
    });
  });
}
