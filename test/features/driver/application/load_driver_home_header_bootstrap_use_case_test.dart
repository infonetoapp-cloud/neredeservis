import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/domain/user_role.dart';
import 'package:neredeservis/features/driver/application/load_driver_home_header_bootstrap_use_case.dart';
import 'package:neredeservis/features/driver/domain/driver_home_header_bootstrap_repository.dart';

void main() {
  group('LoadDriverHomeHeaderBootstrapUseCase', () {
    test('returns non-driver fallback for missing uid and skips repository',
        () async {
      final repository = _FakeDriverHomeHeaderBootstrapRepository();
      final useCase = LoadDriverHomeHeaderBootstrapUseCase(
        repository: repository,
      );

      final result = await useCase.execute(
        const DriverHomeHeaderBootstrapSeed(
          fallbackDisplayName: 'Seed Driver',
          fallbackPhotoUrl: 'seed-photo',
        ),
      );

      expect(result.isDriver, isFalse);
      expect(result.driverDisplayName, 'Seed Driver');
      expect(result.driverPhotoUrl, 'seed-photo');
      expect(repository.getUserRoleCalls, 0);
      expect(repository.loadUserProfileCalls, 0);
      expect(repository.loadDriverProfileCalls, 0);
    });

    test('returns non-driver fallback when role is passenger', () async {
      final repository = _FakeDriverHomeHeaderBootstrapRepository(
        role: UserRole.passenger,
      );
      final useCase = LoadDriverHomeHeaderBootstrapUseCase(
        repository: repository,
      );

      final result = await useCase.execute(
        const DriverHomeHeaderBootstrapSeed(
          fallbackDisplayName: 'Seed Driver',
          userId: 'u1',
          fallbackPhotoUrl: 'seed-photo',
        ),
      );

      expect(result.isDriver, isFalse);
      expect(result.driverDisplayName, 'Seed Driver');
      expect(result.driverPhotoUrl, 'seed-photo');
      expect(repository.getUserRoleCalls, 1);
      expect(repository.loadUserProfileCalls, 0);
      expect(repository.loadDriverProfileCalls, 0);
    });

    test('merges user then driver profile with driver precedence', () async {
      final repository = _FakeDriverHomeHeaderBootstrapRepository(
        role: UserRole.driver,
        userProfile: const DriverHomeUserProfileRemoteData(
          displayName: '  User Driver  ',
          photoUrl: ' user-photo ',
        ),
        driverProfile: const DriverHomeDriverProfileRemoteData(
          name: ' Driver Name ',
          photoUrl: ' driver-photo ',
        ),
      );
      final useCase = LoadDriverHomeHeaderBootstrapUseCase(
        repository: repository,
      );

      final result = await useCase.execute(
        const DriverHomeHeaderBootstrapSeed(
          fallbackDisplayName: 'Seed Driver',
          userId: 'driver-1',
          fallbackPhotoUrl: 'seed-photo',
        ),
      );

      expect(result.isDriver, isTrue);
      expect(result.driverDisplayName, 'Driver Name');
      expect(result.driverPhotoUrl, 'driver-photo');
      expect(repository.getUserRoleCalls, 1);
      expect(repository.loadUserProfileCalls, 1);
      expect(repository.loadDriverProfileCalls, 1);
    });

    test('continues as driver with user fallback when user profile read fails',
        () async {
      final repository = _FakeDriverHomeHeaderBootstrapRepository(
        role: UserRole.driver,
        throwOnLoadUserProfile: true,
        driverProfile: const DriverHomeDriverProfileRemoteData(
          name: 'Driver Name',
        ),
      );
      final useCase = LoadDriverHomeHeaderBootstrapUseCase(
        repository: repository,
      );

      final result = await useCase.execute(
        const DriverHomeHeaderBootstrapSeed(
          fallbackDisplayName: 'Seed Driver',
          userId: 'driver-1',
          fallbackPhotoUrl: 'seed-photo',
        ),
      );

      expect(result.isDriver, isTrue);
      expect(result.driverDisplayName, 'Driver Name');
      expect(result.driverPhotoUrl, 'seed-photo');
      expect(repository.loadUserProfileCalls, 1);
      expect(repository.loadDriverProfileCalls, 1);
    });

    test('keeps user profile values when driver profile read fails', () async {
      final repository = _FakeDriverHomeHeaderBootstrapRepository(
        role: UserRole.driver,
        userProfile: const DriverHomeUserProfileRemoteData(
          displayName: 'User Driver',
          photoUrl: 'user-photo',
        ),
        throwOnLoadDriverProfile: true,
      );
      final useCase = LoadDriverHomeHeaderBootstrapUseCase(
        repository: repository,
      );

      final result = await useCase.execute(
        const DriverHomeHeaderBootstrapSeed(
          fallbackDisplayName: 'Seed Driver',
          userId: 'driver-1',
          fallbackPhotoUrl: 'seed-photo',
        ),
      );

      expect(result.isDriver, isTrue);
      expect(result.driverDisplayName, 'User Driver');
      expect(result.driverPhotoUrl, 'user-photo');
      expect(repository.loadUserProfileCalls, 1);
      expect(repository.loadDriverProfileCalls, 1);
    });

    test('role resolution failure returns non-driver fallback', () async {
      final repository = _FakeDriverHomeHeaderBootstrapRepository(
        throwOnGetUserRole: true,
      );
      final useCase = LoadDriverHomeHeaderBootstrapUseCase(
        repository: repository,
      );

      final result = await useCase.execute(
        const DriverHomeHeaderBootstrapSeed(
          fallbackDisplayName: 'Seed Driver',
          userId: 'u1',
          fallbackPhotoUrl: 'seed-photo',
        ),
      );

      expect(result.isDriver, isFalse);
      expect(result.driverDisplayName, 'Seed Driver');
      expect(result.driverPhotoUrl, 'seed-photo');
      expect(repository.getUserRoleCalls, 1);
      expect(repository.loadUserProfileCalls, 0);
      expect(repository.loadDriverProfileCalls, 0);
    });
  });
}

class _FakeDriverHomeHeaderBootstrapRepository
    implements DriverHomeHeaderBootstrapRepository {
  _FakeDriverHomeHeaderBootstrapRepository({
    this.role = UserRole.driver,
    this.userProfile = const DriverHomeUserProfileRemoteData(),
    this.driverProfile = const DriverHomeDriverProfileRemoteData(),
    this.throwOnGetUserRole = false,
    this.throwOnLoadUserProfile = false,
    this.throwOnLoadDriverProfile = false,
  });

  final UserRole role;
  final DriverHomeUserProfileRemoteData userProfile;
  final DriverHomeDriverProfileRemoteData driverProfile;
  final bool throwOnGetUserRole;
  final bool throwOnLoadUserProfile;
  final bool throwOnLoadDriverProfile;

  int getUserRoleCalls = 0;
  int loadUserProfileCalls = 0;
  int loadDriverProfileCalls = 0;

  @override
  Future<UserRole> getUserRole(String uid) async {
    getUserRoleCalls++;
    if (throwOnGetUserRole) {
      throw Exception('role');
    }
    return role;
  }

  @override
  Future<DriverHomeUserProfileRemoteData> loadUserProfile(String uid) async {
    loadUserProfileCalls++;
    if (throwOnLoadUserProfile) {
      throw Exception('user');
    }
    return userProfile;
  }

  @override
  Future<DriverHomeDriverProfileRemoteData> loadDriverProfile(
      String uid) async {
    loadDriverProfileCalls++;
    if (throwOnLoadDriverProfile) {
      throw Exception('driver');
    }
    return driverProfile;
  }
}
