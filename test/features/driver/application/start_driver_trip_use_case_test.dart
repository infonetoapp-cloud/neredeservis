import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/start_driver_trip_use_case.dart';
import 'package:neredeservis/features/driver/domain/driver_trip_start_repository.dart';

void main() {
  group('StartDriverTripUseCase', () {
    test('delegates command to repository and returns result', () async {
      const expected = DriverTripStartResult(
        tripId: 'trip-123',
        status: 'active',
      );
      final repository = _FakeDriverTripStartRepository(result: expected);
      final useCase = StartDriverTripUseCase(repository: repository);
      const command = DriverTripStartCommand(
        routeId: 'route-1',
        deviceId: 'android_uid123',
        idempotencyKey: 'idem-1',
        expectedTransitionVersion: 4,
      );

      final result = await useCase.execute(command);

      expect(result.tripId, 'trip-123');
      expect(result.status, 'active');
      expect(repository.calls, 1);
      expect(repository.lastCommand, same(command));
    });

    test('rethrows repository failures', () async {
      final repository = _FakeDriverTripStartRepository(throwOnStart: true);
      final useCase = StartDriverTripUseCase(repository: repository);

      expect(
        () => useCase.execute(
          const DriverTripStartCommand(
            routeId: 'route-1',
            deviceId: 'android_uid123',
            idempotencyKey: 'idem-1',
            expectedTransitionVersion: 0,
          ),
        ),
        throwsA(isA<StateError>()),
      );
      expect(repository.calls, 1);
    });
  });
}

class _FakeDriverTripStartRepository implements DriverTripStartRepository {
  _FakeDriverTripStartRepository({
    this.result = const DriverTripStartResult(tripId: '', status: ''),
    this.throwOnStart = false,
  });

  final DriverTripStartResult result;
  final bool throwOnStart;
  int calls = 0;
  DriverTripStartCommand? lastCommand;

  @override
  Future<DriverTripStartResult> startTrip(
      DriverTripStartCommand command) async {
    calls += 1;
    lastCommand = command;
    if (throwOnStart) {
      throw StateError('boom');
    }
    return result;
  }
}
