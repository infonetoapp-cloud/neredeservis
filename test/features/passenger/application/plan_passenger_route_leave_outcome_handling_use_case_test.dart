import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/passenger/application/plan_passenger_route_leave_outcome_handling_use_case.dart';

void main() {
  group('PlanPassengerRouteLeaveOutcomeHandlingUseCase', () {
    const useCase = PlanPassengerRouteLeaveOutcomeHandlingUseCase();

    test('plans success outcome', () {
      final plan = useCase.execute(
        const PlanPassengerRouteLeaveOutcomeHandlingCommand.success(),
      );

      expect(plan.telemetryResult, 'success');
      expect(plan.shouldClearRouteCaches, isTrue);
      expect(plan.shouldNavigateToJoin, isTrue);
    });

    test('plans noop outcome', () {
      final plan = useCase.execute(
        const PlanPassengerRouteLeaveOutcomeHandlingCommand.noop(),
      );

      expect(plan.telemetryResult, 'noop');
      expect(plan.shouldClearRouteCaches, isFalse);
      expect(plan.shouldNavigateToJoin, isTrue);
    });

    test('plans failure outcome', () {
      final plan = useCase.execute(
        const PlanPassengerRouteLeaveOutcomeHandlingCommand.failure(),
      );

      expect(plan.telemetryResult, 'error');
      expect(plan.shouldClearRouteCaches, isFalse);
      expect(plan.shouldNavigateToJoin, isFalse);
    });
  });
}
