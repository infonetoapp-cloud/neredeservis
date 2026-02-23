import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/create_driver_route_use_case.dart';
import 'package:neredeservis/features/driver/domain/driver_route_create_repository.dart';

void main() {
  group('CreateDriverRouteUseCase', () {
    test('delegates all fields to repository and returns result', () async {
      const expected = DriverRouteCreateResult(
        routeId: 'route-1',
        srvCode: 'SRV123',
      );
      final repository = _FakeDriverRouteCreateRepository(result: expected);
      final useCase = CreateDriverRouteUseCase(repository: repository);

      final result = await useCase.execute(
        name: 'Hat A',
        startLat: 41.0,
        startLng: 29.0,
        startAddress: 'Start',
        endLat: 41.2,
        endLng: 29.2,
        endAddress: 'End',
        scheduledTime: '08:30',
        timeSlot: 'morning',
        allowGuestTracking: true,
      );

      expect(result.routeId, 'route-1');
      expect(result.srvCode, 'SRV123');
      expect(repository.calls, 1);
      expect(repository.lastCommand, isNotNull);
      expect(repository.lastCommand!.name, 'Hat A');
      expect(repository.lastCommand!.startLat, 41.0);
      expect(repository.lastCommand!.allowGuestTracking, isTrue);
      expect(repository.lastCommand!.timeSlot, 'morning');
    });

    test('rethrows repository failures', () async {
      final repository = _FakeDriverRouteCreateRepository(throwOnCreate: true);
      final useCase = CreateDriverRouteUseCase(repository: repository);

      expect(
        () => useCase.execute(
          name: 'Hat A',
          startLat: 41.0,
          startLng: 29.0,
          startAddress: 'Start',
          endLat: 41.2,
          endLng: 29.2,
          endAddress: 'End',
          scheduledTime: '08:30',
          timeSlot: 'morning',
          allowGuestTracking: false,
        ),
        throwsA(isA<StateError>()),
      );
      expect(repository.calls, 1);
    });
  });
}

class _FakeDriverRouteCreateRepository implements DriverRouteCreateRepository {
  _FakeDriverRouteCreateRepository({
    this.result = const DriverRouteCreateResult(),
    this.throwOnCreate = false,
  });

  final DriverRouteCreateResult result;
  final bool throwOnCreate;
  int calls = 0;
  DriverRouteCreateCommand? lastCommand;

  @override
  Future<DriverRouteCreateResult> createRoute(
      DriverRouteCreateCommand command) async {
    calls += 1;
    lastCommand = command;
    if (throwOnCreate) {
      throw StateError('boom');
    }
    return result;
  }
}
