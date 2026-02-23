import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/upsert_driver_stop_use_case.dart';
import 'package:neredeservis/features/driver/domain/driver_stop_mutation_repository.dart';

void main() {
  group('UpsertDriverStopUseCase', () {
    test('delegates command to repository and returns result', () async {
      const expected = DriverStopUpsertResult(stopId: 'stop-123');
      final repository = _FakeDriverStopMutationRepository(
        upsertResult: expected,
      );
      final useCase = UpsertDriverStopUseCase(repository: repository);
      const command = DriverStopUpsertCommand(
        routeId: 'route-1',
        stopId: 'stop-1',
        name: 'Durak A',
        lat: 41.0,
        lng: 29.0,
        order: 1,
      );

      final result = await useCase.execute(command);

      expect(result.stopId, 'stop-123');
      expect(repository.upsertCalls, 1);
      expect(repository.lastUpsertCommand, same(command));
    });

    test('rethrows repository failures', () async {
      final repository = _FakeDriverStopMutationRepository(
        throwOnUpsert: true,
      );
      final useCase = UpsertDriverStopUseCase(repository: repository);

      expect(
        () => useCase.execute(
          const DriverStopUpsertCommand(
            routeId: 'route-1',
            name: 'Durak A',
            lat: 41.0,
            lng: 29.0,
            order: 1,
          ),
        ),
        throwsA(isA<StateError>()),
      );
      expect(repository.upsertCalls, 1);
    });
  });
}

class _FakeDriverStopMutationRepository
    implements DriverStopMutationRepository {
  _FakeDriverStopMutationRepository({
    this.upsertResult = const DriverStopUpsertResult(),
    this.throwOnUpsert = false,
  });

  final DriverStopUpsertResult upsertResult;
  final bool throwOnUpsert;
  int upsertCalls = 0;
  int deleteCalls = 0;
  DriverStopUpsertCommand? lastUpsertCommand;
  DriverStopDeleteCommand? lastDeleteCommand;

  @override
  Future<void> deleteStop(DriverStopDeleteCommand command) async {
    deleteCalls += 1;
    lastDeleteCommand = command;
  }

  @override
  Future<DriverStopUpsertResult> upsertStop(
      DriverStopUpsertCommand command) async {
    upsertCalls += 1;
    lastUpsertCommand = command;
    if (throwOnUpsert) {
      throw StateError('boom');
    }
    return upsertResult;
  }
}
