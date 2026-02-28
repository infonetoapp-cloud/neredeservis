import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/classify_route_mutation_create_failure_use_case.dart';

void main() {
  group('ClassifyRouteMutationCreateFailureUseCase', () {
    const useCase = ClassifyRouteMutationCreateFailureUseCase();

    test('classifies driver profile precondition from failed-precondition', () {
      final result = useCase.execute(
        const ClassifyRouteMutationCreateFailureCommand(
          code: 'FAILED-PRECONDITION',
          message: 'Driver profile missing for current user',
        ),
      );

      expect(
        result.kind,
        RouteMutationCreateFailureKind.driverProfilePrecondition,
      );
      expect(result.normalizedCode, 'failed-precondition');
      expect(
          result.normalizedMessage, 'driver profile missing for current user');
    });

    test('classifies sofor profil message as driver profile precondition', () {
      final result = useCase.execute(
        const ClassifyRouteMutationCreateFailureCommand(
          code: 'failed-precondition',
          message: 'Sofor profil tamamlanmadi',
        ),
      );

      expect(
        result.kind,
        RouteMutationCreateFailureKind.driverProfilePrecondition,
      );
    });

    test('returns other when code is not failed-precondition', () {
      final result = useCase.execute(
        const ClassifyRouteMutationCreateFailureCommand(
          code: 'permission-denied',
          message: 'driver profile missing',
        ),
      );

      expect(result.kind, RouteMutationCreateFailureKind.other);
      expect(result.normalizedCode, 'permission-denied');
    });
  });
}
