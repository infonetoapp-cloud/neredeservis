import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/plan_route_mutation_write_failure_handling_use_case.dart';
import 'package:neredeservis/features/driver/application/plan_route_mutation_write_feedback_use_case.dart';
import 'package:neredeservis/features/driver/application/resolve_route_mutation_write_feedback_message_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('PlanRouteMutationWriteFailureHandlingUseCase', () {
    const useCase = PlanRouteMutationWriteFailureHandlingUseCase(
      planRouteMutationWriteFeedbackUseCase:
          PlanRouteMutationWriteFeedbackUseCase(),
      resolveRouteMutationWriteFeedbackMessageUseCase:
          ResolveRouteMutationWriteFeedbackMessageUseCase(),
    );

    test('plans route update failure feedback', () {
      final plan = useCase.execute(
        const PlanRouteMutationWriteFailureHandlingCommand.routeUpdateFailure(),
      );

      expect(plan.action, RouteMutationWriteFailureHandlingAction.showInfoOnly);
      expect(plan.feedbackMessage, CoreErrorFeedbackTokens.routeUpdateFailed);
    });

    test('plans upsert stop failure feedback', () {
      final plan = useCase.execute(
        const PlanRouteMutationWriteFailureHandlingCommand.upsertStopFailure(),
      );

      expect(plan.action, RouteMutationWriteFailureHandlingAction.showInfoOnly);
      expect(plan.feedbackMessage, CoreErrorFeedbackTokens.stopSaveFailed);
    });

    test('plans delete stop failure feedback', () {
      final plan = useCase.execute(
        const PlanRouteMutationWriteFailureHandlingCommand.deleteStopFailure(),
      );

      expect(plan.action, RouteMutationWriteFailureHandlingAction.showInfoOnly);
      expect(plan.feedbackMessage, CoreErrorFeedbackTokens.stopDeleteFailed);
    });

    test('maps update token mismatch feedback when reason is provided', () {
      final command = const PlanRouteMutationWriteFailureHandlingCommand
              .routeUpdateFailure()
          .withError(
        errorCode: 'failed-precondition',
        errorDetails: <String, dynamic>{
          'reasonCode': 'UPDATE_TOKEN_MISMATCH',
        },
      );
      final plan = useCase.execute(command);

      expect(plan.action, RouteMutationWriteFailureHandlingAction.showInfoOnly);
      expect(
        plan.feedbackMessage,
        'Rota baska bir cihazda degisti. Sayfayi yenileyip tekrar dene.',
      );
    });
  });
}
