import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/passenger/application/submit_passenger_skip_today_use_case.dart';
import 'package:neredeservis/features/passenger/domain/passenger_skip_today_repository.dart';

void main() {
  group('SubmitPassengerSkipTodayUseCase', () {
    test('delegates command to repository', () async {
      final repository = _FakePassengerSkipTodayRepository();
      final useCase = SubmitPassengerSkipTodayUseCase(repository: repository);
      const command = PassengerSkipTodayCommand(
        routeId: 'route-1',
        dateKey: '2026-02-23',
        idempotencyKey: 'skip_route-1_2026-02-23',
      );

      await useCase.execute(command);

      expect(repository.calls, 1);
      expect(repository.lastCommand, same(command));
    });

    test('rethrows repository failures', () async {
      final repository = _FakePassengerSkipTodayRepository(throwOnSubmit: true);
      final useCase = SubmitPassengerSkipTodayUseCase(repository: repository);

      expect(
        () => useCase.execute(
          const PassengerSkipTodayCommand(
            routeId: 'route-1',
            dateKey: '2026-02-23',
            idempotencyKey: 'idemp',
          ),
        ),
        throwsA(isA<StateError>()),
      );
      expect(repository.calls, 1);
    });
  });
}

class _FakePassengerSkipTodayRepository
    implements PassengerSkipTodayRepository {
  _FakePassengerSkipTodayRepository({
    this.throwOnSubmit = false,
  });

  final bool throwOnSubmit;
  int calls = 0;
  PassengerSkipTodayCommand? lastCommand;

  @override
  Future<void> submitSkipToday(PassengerSkipTodayCommand command) async {
    calls += 1;
    lastCommand = command;
    if (throwOnSubmit) {
      throw StateError('boom');
    }
  }
}
