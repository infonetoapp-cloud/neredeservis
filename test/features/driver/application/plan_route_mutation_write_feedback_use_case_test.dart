import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/plan_route_mutation_write_feedback_use_case.dart';

void main() {
  group('PlanRouteMutationWriteFeedbackUseCase', () {
    const useCase = PlanRouteMutationWriteFeedbackUseCase();

    test('plans route update success without stop changes feedback', () {
      final plan = useCase.execute(
        const PlanRouteMutationWriteFeedbackCommand.routeUpdateSuccess(
          inlineStopUpsertsCount: 0,
        ),
      );

      expect(
        plan.key,
        RouteMutationWriteFeedbackKey.routeUpdateSavedWithoutStopChanges,
      );
      expect(plan.stopId, isNull);
      expect(plan.inlineStopUpsertsCount, 0);
    });

    test('plans route update success with stop changes feedback', () {
      final plan = useCase.execute(
        const PlanRouteMutationWriteFeedbackCommand.routeUpdateSuccess(
          inlineStopUpsertsCount: 3,
        ),
      );

      expect(
        plan.key,
        RouteMutationWriteFeedbackKey.routeUpdateSavedWithStopChanges,
      );
      expect(plan.stopId, isNull);
      expect(plan.inlineStopUpsertsCount, 3);
    });

    test('plans route update failure feedback', () {
      final plan = useCase.execute(
        const PlanRouteMutationWriteFeedbackCommand.routeUpdateFailure(),
      );

      expect(plan.key, RouteMutationWriteFeedbackKey.routeUpdateFailed);
      expect(plan.stopId, isNull);
      expect(plan.inlineStopUpsertsCount, isNull);
    });

    test('plans upsert stop success feedback and preserves stop id', () {
      final plan = useCase.execute(
        const PlanRouteMutationWriteFeedbackCommand.upsertStopSuccess(
          stopId: 'stop_123',
        ),
      );

      expect(plan.key, RouteMutationWriteFeedbackKey.stopSaved);
      expect(plan.stopId, 'stop_123');
      expect(plan.inlineStopUpsertsCount, isNull);
    });

    test('plans upsert stop failure feedback', () {
      final plan = useCase.execute(
        const PlanRouteMutationWriteFeedbackCommand.upsertStopFailure(),
      );

      expect(plan.key, RouteMutationWriteFeedbackKey.stopSaveFailed);
      expect(plan.stopId, isNull);
      expect(plan.inlineStopUpsertsCount, isNull);
    });

    test('plans delete stop success feedback', () {
      final plan = useCase.execute(
        const PlanRouteMutationWriteFeedbackCommand.deleteStopSuccess(),
      );

      expect(plan.key, RouteMutationWriteFeedbackKey.stopDeleted);
      expect(plan.inlineStopUpsertsCount, isNull);
    });

    test('plans delete stop failure feedback', () {
      final plan = useCase.execute(
        const PlanRouteMutationWriteFeedbackCommand.deleteStopFailure(),
      );

      expect(plan.key, RouteMutationWriteFeedbackKey.stopDeleteFailed);
      expect(plan.inlineStopUpsertsCount, isNull);
    });

    test('maps token mismatch reason for route update failure', () {
      final plan = useCase.execute(
        const PlanRouteMutationWriteFeedbackCommand.routeUpdateFailure(
          errorCode: 'failed-precondition',
          errorDetails: <String, dynamic>{
            'reasonCode': 'UPDATE_TOKEN_MISMATCH',
          },
        ),
      );

      expect(plan.key, RouteMutationWriteFeedbackKey.routeUpdateTokenMismatch);
    });

    test('maps stop state-invalid reason for upsert failure', () {
      final plan = useCase.execute(
        const PlanRouteMutationWriteFeedbackCommand.upsertStopFailure(
          errorCode: 'failed-precondition',
          errorDetails: <String, dynamic>{
            'reasonCode': 'ROUTE_STOP_INVALID_STATE',
          },
        ),
      );

      expect(plan.key, RouteMutationWriteFeedbackKey.stopSaveStateInvalid);
    });
  });
}
