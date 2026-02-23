import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/delete_driver_stop_use_case.dart';
import 'package:neredeservis/features/driver/domain/driver_stop_mutation_repository.dart';

void main() {
  group('DeleteDriverStopUseCase', () {
    test('delegates command to repository', () async {
      final repository = _FakeDriverStopMutationRepository();
      final useCase = DeleteDriverStopUseCase(repository: repository);
      const command = DriverStopDeleteCommand(
        routeId: 'route-1',
        stopId: 'stop-1',
      );

      await useCase.execute(command);

      expect(repository.deleteCalls, 1);
      expect(repository.lastDeleteCommand, same(command));
    });

    test('rethrows repository failures', () async {
      final repository = _FakeDriverStopMutationRepository(throwOnDelete: true);
      final useCase = DeleteDriverStopUseCase(repository: repository);

      expect(
        () => useCase.execute(
          const DriverStopDeleteCommand(routeId: 'route-1', stopId: 'stop-1'),
        ),
        throwsA(isA<StateError>()),
      );
      expect(repository.deleteCalls, 1);
    });
  });
}

class _FakeDriverStopMutationRepository
    implements DriverStopMutationRepository {
  _FakeDriverStopMutationRepository({
    this.throwOnDelete = false,
  });

  final bool throwOnDelete;
  int upsertCalls = 0;
  int deleteCalls = 0;
  DriverStopUpsertCommand? lastUpsertCommand;
  DriverStopDeleteCommand? lastDeleteCommand;

  @override
  Future<void> deleteStop(DriverStopDeleteCommand command) async {
    deleteCalls += 1;
    lastDeleteCommand = command;
    if (throwOnDelete) {
      throw StateError('boom');
    }
  }

  @override
  Future<DriverStopUpsertResult> upsertStop(
      DriverStopUpsertCommand command) async {
    upsertCalls += 1;
    lastUpsertCommand = command;
    return const DriverStopUpsertResult(stopId: 'unused');
  }
}
