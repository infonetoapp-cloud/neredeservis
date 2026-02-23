import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/update_driver_route_use_case.dart';
import 'package:neredeservis/features/driver/domain/driver_route_update_repository.dart';

void main() {
  group('UpdateDriverRouteUseCase', () {
    test('delegates command to repository', () async {
      final repository = _FakeDriverRouteUpdateRepository();
      final useCase = UpdateDriverRouteUseCase(repository: repository);
      const command = DriverRouteUpdateCommand(
        routeId: 'route-1',
        name: 'Hat A',
        startPoint: DriverRouteUpdatePoint(lat: 41.0, lng: 29.0),
        endPoint: DriverRouteUpdatePoint(lat: 41.2, lng: 29.2),
        allowGuestTracking: true,
        inlineStopUpserts: <DriverRouteInlineStopUpsertCommand>[
          DriverRouteInlineStopUpsertCommand(
            stopId: 'stop-1',
            name: 'Durak A',
            lat: 41.1,
            lng: 29.1,
            order: 1,
          ),
        ],
      );

      await useCase.execute(command);

      expect(repository.calls, 1);
      expect(repository.lastCommand, same(command));
    });

    test('rethrows repository failures', () async {
      final repository = _FakeDriverRouteUpdateRepository(throwOnUpdate: true);
      final useCase = UpdateDriverRouteUseCase(repository: repository);

      expect(
        () =>
            useCase.execute(const DriverRouteUpdateCommand(routeId: 'route-1')),
        throwsA(isA<StateError>()),
      );
      expect(repository.calls, 1);
    });
  });
}

class _FakeDriverRouteUpdateRepository implements DriverRouteUpdateRepository {
  _FakeDriverRouteUpdateRepository({
    this.throwOnUpdate = false,
  });

  final bool throwOnUpdate;
  int calls = 0;
  DriverRouteUpdateCommand? lastCommand;

  @override
  Future<void> updateRoute(DriverRouteUpdateCommand command) async {
    calls += 1;
    lastCommand = command;
    if (throwOnUpdate) {
      throw StateError('boom');
    }
  }
}
