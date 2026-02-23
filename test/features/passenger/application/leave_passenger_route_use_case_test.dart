import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/passenger/application/leave_passenger_route_use_case.dart';
import 'package:neredeservis/features/passenger/domain/passenger_route_leave_repository.dart';

void main() {
  group('LeavePassengerRouteUseCase', () {
    test('delegates command to repository and returns result', () async {
      const expected = PassengerRouteLeaveResult(left: true);
      final repository = _FakePassengerRouteLeaveRepository(result: expected);
      final useCase = LeavePassengerRouteUseCase(repository: repository);
      const command = PassengerRouteLeaveCommand(routeId: 'route-1');

      final result = await useCase.execute(command);

      expect(result.left, isTrue);
      expect(repository.calls, 1);
      expect(repository.lastCommand, same(command));
    });

    test('rethrows repository failures', () async {
      final repository = _FakePassengerRouteLeaveRepository(throwOnLeave: true);
      final useCase = LeavePassengerRouteUseCase(repository: repository);

      expect(
        () => useCase
            .execute(const PassengerRouteLeaveCommand(routeId: 'route-1')),
        throwsA(isA<StateError>()),
      );
      expect(repository.calls, 1);
    });
  });
}

class _FakePassengerRouteLeaveRepository
    implements PassengerRouteLeaveRepository {
  _FakePassengerRouteLeaveRepository({
    this.result = const PassengerRouteLeaveResult(left: false),
    this.throwOnLeave = false,
  });

  final PassengerRouteLeaveResult result;
  final bool throwOnLeave;
  int calls = 0;
  PassengerRouteLeaveCommand? lastCommand;

  @override
  Future<PassengerRouteLeaveResult> leaveRoute(
    PassengerRouteLeaveCommand command,
  ) async {
    calls += 1;
    lastCommand = command;
    if (throwOnLeave) {
      throw StateError('boom');
    }
    return result;
  }
}
