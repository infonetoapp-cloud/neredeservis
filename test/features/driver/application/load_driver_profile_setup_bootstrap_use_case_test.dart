import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/load_driver_profile_setup_bootstrap_use_case.dart';
import 'package:neredeservis/features/driver/domain/driver_profile_setup_bootstrap_repository.dart';

void main() {
  group('LoadDriverProfileSetupBootstrapUseCase', () {
    test('returns seed defaults when user is anonymous and skips remote load',
        () async {
      final repository = _FakeDriverProfileSetupBootstrapRepository();
      final useCase = LoadDriverProfileSetupBootstrapUseCase(
        repository: repository,
      );

      final result = await useCase.execute(
        const DriverProfileSetupBootstrapSeed(
          fallbackName: 'Misafir',
          userId: 'guest-uid',
          isAnonymous: true,
          fallbackPhone: '+90 555',
          fallbackPhotoUrl: 'seed-photo',
        ),
      );

      expect(result.name, 'Misafir');
      expect(result.phone, '+90 555');
      expect(result.photoUrl, 'seed-photo');
      expect(result.plate, isNull);
      expect(result.photoPath, isNull);
      expect(result.showPhoneToPassengers, isTrue);
      expect(repository.loadCalls, 0);
    });

    test('merges remote user then driver fields with driver precedence',
        () async {
      final repository = _FakeDriverProfileSetupBootstrapRepository(
        remoteData: const DriverProfileSetupRemoteData(
          userDisplayName: '  User Name  ',
          userPhone: ' 111 ',
          userPhotoUrl: ' user-photo ',
          userPhotoPath: ' user-path ',
          driverName: ' Driver Name ',
          driverPhone: ' 222 ',
          driverPlate: ' 34 abc 123 ',
          driverPhotoUrl: ' driver-photo ',
          driverPhotoPath: ' driver-path ',
          driverShowPhoneToPassengers: false,
        ),
      );
      final useCase = LoadDriverProfileSetupBootstrapUseCase(
        repository: repository,
      );

      final result = await useCase.execute(
        const DriverProfileSetupBootstrapSeed(
          fallbackName: 'Fallback',
          userId: 'driver-1',
          fallbackPhone: 'seed-phone',
          fallbackPhotoUrl: 'seed-photo',
        ),
      );

      expect(result.name, 'Driver Name');
      expect(result.phone, '222');
      expect(result.plate, '34 ABC 123');
      expect(result.photoUrl, 'driver-photo');
      expect(result.photoPath, 'driver-path');
      expect(result.showPhoneToPassengers, isFalse);
      expect(repository.loadCalls, 1);
      expect(repository.lastUid, 'driver-1');
    });

    test('falls back to seed data when repository throws', () async {
      final repository = _FakeDriverProfileSetupBootstrapRepository(
        throwOnLoad: true,
      );
      final useCase = LoadDriverProfileSetupBootstrapUseCase(
        repository: repository,
      );

      final result = await useCase.execute(
        const DriverProfileSetupBootstrapSeed(
          fallbackName: 'Fallback',
          userId: 'driver-1',
          fallbackPhone: 'seed-phone',
          fallbackPhotoUrl: 'seed-photo',
        ),
      );

      expect(result.name, 'Fallback');
      expect(result.phone, 'seed-phone');
      expect(result.photoUrl, 'seed-photo');
      expect(result.plate, isNull);
      expect(result.photoPath, isNull);
      expect(result.showPhoneToPassengers, isTrue);
      expect(repository.loadCalls, 1);
    });
  });
}

class _FakeDriverProfileSetupBootstrapRepository
    implements DriverProfileSetupBootstrapRepository {
  _FakeDriverProfileSetupBootstrapRepository({
    this.remoteData = const DriverProfileSetupRemoteData(),
    this.throwOnLoad = false,
  });

  final DriverProfileSetupRemoteData remoteData;
  final bool throwOnLoad;

  int loadCalls = 0;
  String? lastUid;

  @override
  Future<DriverProfileSetupRemoteData> loadRemoteData(String uid) async {
    loadCalls++;
    lastUid = uid;
    if (throwOnLoad) {
      throw Exception('boom');
    }
    return remoteData;
  }
}
