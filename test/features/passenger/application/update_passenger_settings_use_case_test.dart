import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/passenger/application/update_passenger_settings_use_case.dart';
import 'package:neredeservis/features/passenger/domain/passenger_settings_update_repository.dart';

void main() {
  group('UpdatePassengerSettingsUseCase', () {
    test('delegates command to repository', () async {
      final repository = _FakePassengerSettingsUpdateRepository();
      final useCase = UpdatePassengerSettingsUseCase(repository: repository);
      const command = PassengerSettingsUpdateCommand(
        routeId: 'route-1',
        showPhoneToDriver: true,
        boardingArea: 'A kapisi',
        notificationTime: '07:30',
        phone: '5551234567',
        virtualStop: PassengerSettingsUpdateVirtualStop(lat: 41, lng: 29),
        virtualStopLabel: 'Kapı 1',
      );

      await useCase.execute(command);

      expect(repository.calls, 1);
      expect(repository.lastCommand, same(command));
    });

    test('rethrows repository failures', () async {
      final repository = _FakePassengerSettingsUpdateRepository(
        throwOnUpdate: true,
      );
      final useCase = UpdatePassengerSettingsUseCase(repository: repository);

      expect(
        () => useCase.execute(
          const PassengerSettingsUpdateCommand(
            routeId: 'route-1',
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

class _FakePassengerSettingsUpdateRepository
    implements PassengerSettingsUpdateRepository {
  _FakePassengerSettingsUpdateRepository({
    this.throwOnUpdate = false,
  });

  final bool throwOnUpdate;
  int calls = 0;
  PassengerSettingsUpdateCommand? lastCommand;

  @override
  Future<void> updateSettings(PassengerSettingsUpdateCommand command) async {
    calls += 1;
    lastCommand = command;
    if (throwOnUpdate) {
      throw StateError('boom');
    }
  }
}
