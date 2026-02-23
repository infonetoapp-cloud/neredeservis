import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/passenger/application/join_passenger_route_by_srv_code_use_case.dart';
import 'package:neredeservis/features/passenger/domain/passenger_route_join_repository.dart';

void main() {
  group('JoinPassengerRouteBySrvCodeUseCase', () {
    test('delegates command to repository and returns result', () async {
      const expected = PassengerRouteJoinBySrvCodeResult(
        routeId: 'route-1',
        routeName: 'Test Route',
      );
      final repository = _FakePassengerRouteJoinRepository(result: expected);
      final useCase =
          JoinPassengerRouteBySrvCodeUseCase(repository: repository);
      const command = PassengerRouteJoinBySrvCodeCommand(
        srvCode: 'SRV123',
        name: 'Ali',
        phone: '5551234567',
        showPhoneToDriver: true,
        boardingArea: 'A kapisi',
        notificationTime: '07:30',
      );

      final result = await useCase.execute(command);

      expect(result.routeId, 'route-1');
      expect(result.routeName, 'Test Route');
      expect(repository.calls, 1);
      expect(repository.lastCommand, same(command));
    });

    test('rethrows repository failures', () async {
      final repository = _FakePassengerRouteJoinRepository(throwOnJoin: true);
      final useCase =
          JoinPassengerRouteBySrvCodeUseCase(repository: repository);

      expect(
        () => useCase.execute(
          const PassengerRouteJoinBySrvCodeCommand(
            srvCode: 'SRV123',
            name: 'Ali',
            showPhoneToDriver: false,
            boardingArea: 'A',
            notificationTime: '07:30',
          ),
        ),
        throwsA(isA<StateError>()),
      );
      expect(repository.calls, 1);
    });
  });
}

class _FakePassengerRouteJoinRepository
    implements PassengerRouteJoinRepository {
  _FakePassengerRouteJoinRepository({
    this.result = const PassengerRouteJoinBySrvCodeResult(
      routeId: '',
      routeName: '',
    ),
    this.throwOnJoin = false,
  });

  final PassengerRouteJoinBySrvCodeResult result;
  final bool throwOnJoin;
  int calls = 0;
  PassengerRouteJoinBySrvCodeCommand? lastCommand;

  @override
  Future<PassengerRouteJoinBySrvCodeResult> joinBySrvCode(
    PassengerRouteJoinBySrvCodeCommand command,
  ) async {
    calls += 1;
    lastCommand = command;
    if (throwOnJoin) {
      throw StateError('boom');
    }
    return result;
  }
}
