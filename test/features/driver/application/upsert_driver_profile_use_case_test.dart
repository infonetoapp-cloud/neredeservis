import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/upsert_driver_profile_use_case.dart';
import 'package:neredeservis/features/driver/domain/driver_profile_upsert_repository.dart';

void main() {
  group('UpsertDriverProfileUseCase', () {
    test('delegates command to repository', () async {
      final repository = _FakeDriverProfileUpsertRepository();
      final useCase = UpsertDriverProfileUseCase(repository: repository);
      const command = DriverProfileUpsertCommand(
        name: 'Ali',
        phone: '5551234567',
        plate: '34ABC123',
        showPhoneToPassengers: true,
        photoUrl: 'https://example.com/photo.jpg',
        photoPath: 'drivers/u1/photo.jpg',
        companyId: null,
      );

      await useCase.execute(command);

      expect(repository.calls, 1);
      expect(repository.lastCommand, same(command));
    });

    test('rethrows repository failures', () async {
      final repository = _FakeDriverProfileUpsertRepository(
        throwOnUpsert: true,
      );
      final useCase = UpsertDriverProfileUseCase(repository: repository);

      expect(
        () => useCase.execute(
          const DriverProfileUpsertCommand(
            name: 'Ali',
            phone: '5551234567',
            plate: '34ABC123',
            showPhoneToPassengers: false,
            companyId: 'cmp-1',
          ),
        ),
        throwsA(isA<StateError>()),
      );
      expect(repository.calls, 1);
    });
  });
}

class _FakeDriverProfileUpsertRepository
    implements DriverProfileUpsertRepository {
  _FakeDriverProfileUpsertRepository({
    this.throwOnUpsert = false,
  });

  final bool throwOnUpsert;
  int calls = 0;
  DriverProfileUpsertCommand? lastCommand;

  @override
  Future<void> upsertDriverProfile(DriverProfileUpsertCommand command) async {
    calls += 1;
    lastCommand = command;
    if (throwOnUpsert) {
      throw StateError('boom');
    }
  }
}
