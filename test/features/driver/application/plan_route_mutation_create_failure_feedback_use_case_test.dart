import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/classify_route_mutation_create_failure_use_case.dart';
import 'package:neredeservis/features/driver/application/plan_route_mutation_create_failure_feedback_use_case.dart';

void main() {
  group('PlanRouteMutationCreateFailureFeedbackUseCase', () {
    const useCase = PlanRouteMutationCreateFailureFeedbackUseCase(
      classifyRouteMutationCreateFailureUseCase:
          ClassifyRouteMutationCreateFailureUseCase(),
    );

    test('plans unauthenticated feedback', () {
      final plan = useCase.execute(
        const PlanRouteMutationCreateFailureFeedbackCommand(
          code: 'unauthenticated',
          message: 'session expired',
        ),
      );

      expect(plan.key, RouteMutationCreateFailureFeedbackKey.unauthenticated);
      expect(plan.codeLabel, isNull);
    });

    test('plans driver profile precondition feedback', () {
      final plan = useCase.execute(
        const PlanRouteMutationCreateFailureFeedbackCommand(
          code: 'failed-precondition',
          message: 'driver profile is required',
        ),
      );

      expect(
        plan.key,
        RouteMutationCreateFailureFeedbackKey.driverProfilePrecondition,
      );
    });

    test('plans srv code collision feedback', () {
      final plan = useCase.execute(
        const PlanRouteMutationCreateFailureFeedbackCommand(
          code: 'failed-precondition',
          message: 'srv_code_collision_limit reached',
        ),
      );

      expect(
        plan.key,
        RouteMutationCreateFailureFeedbackKey.srvCodeCollisionLimit,
      );
    });

    test('plans retryable unavailable feedback', () {
      final unavailablePlan = useCase.execute(
        const PlanRouteMutationCreateFailureFeedbackCommand(
          code: 'unavailable',
          message: 'temporary',
        ),
      );
      final deadlinePlan = useCase.execute(
        const PlanRouteMutationCreateFailureFeedbackCommand(
          code: 'deadline-exceeded',
          message: 'timeout',
        ),
      );

      expect(
        unavailablePlan.key,
        RouteMutationCreateFailureFeedbackKey.retryableUnavailable,
      );
      expect(
        deadlinePlan.key,
        RouteMutationCreateFailureFeedbackKey.retryableUnavailable,
      );
    });

    test('plans fallback feedback with explicit code label', () {
      final plan = useCase.execute(
        const PlanRouteMutationCreateFailureFeedbackCommand(
          code: 'weird-error',
          message: 'x',
        ),
      );

      expect(
        plan.key,
        RouteMutationCreateFailureFeedbackKey.routeCreateFailedWithCode,
      );
      expect(plan.codeLabel, 'weird-error');
    });

    test('plans fallback feedback with unknown code label when blank', () {
      final plan = useCase.execute(
        const PlanRouteMutationCreateFailureFeedbackCommand(
          code: '   ',
          message: null,
        ),
      );

      expect(
        plan.key,
        RouteMutationCreateFailureFeedbackKey.routeCreateFailedWithCode,
      );
      expect(plan.codeLabel, 'unknown');
    });
  });
}
