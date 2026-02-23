import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/domain/user_role.dart';
import 'package:neredeservis/features/profile/application/load_profile_edit_bootstrap_use_case.dart';
import 'package:neredeservis/features/profile/domain/profile_edit_bootstrap_repository.dart';

void main() {
  group('LoadProfileEditBootstrapUseCase', () {
    test('returns seed defaults for anonymous user and skips remote calls',
        () async {
      final repository = _FakeProfileEditBootstrapRepository();
      final useCase = LoadProfileEditBootstrapUseCase(repository: repository);

      final result = await useCase.execute(
        const ProfileEditBootstrapSeed(
          fallbackDisplayName: 'Misafir',
          userId: 'guest-uid',
          isAnonymous: true,
          fallbackPhone: '+90 555',
          fallbackPhotoUrl: 'seed-photo',
        ),
      );

      expect(result.role, UserRole.passenger);
      expect(result.displayName, 'Misafir');
      expect(result.phone, '+90 555');
      expect(result.photoUrl, 'seed-photo');
      expect(result.photoPath, isNull);
      expect(repository.getUserRoleCalls, 0);
      expect(repository.loadUserProfileCalls, 0);
      expect(repository.loadDriverProfileCalls, 0);
    });

    test('uses user profile fields for non-driver role', () async {
      final repository = _FakeProfileEditBootstrapRepository(
        role: UserRole.passenger,
        userProfile: const ProfileEditUserRemoteData(
          displayName: '  User Name ',
          phone: ' 111 ',
          photoUrl: ' user-photo ',
          photoPath: ' user-path ',
        ),
      );
      final useCase = LoadProfileEditBootstrapUseCase(repository: repository);

      final result = await useCase.execute(
        const ProfileEditBootstrapSeed(
          fallbackDisplayName: 'Fallback',
          userId: 'u1',
          fallbackPhone: 'seed-phone',
          fallbackPhotoUrl: 'seed-photo',
        ),
      );

      expect(result.role, UserRole.passenger);
      expect(result.displayName, 'User Name');
      expect(result.phone, '111');
      expect(result.photoUrl, 'user-photo');
      expect(result.photoPath, 'user-path');
      expect(repository.getUserRoleCalls, 1);
      expect(repository.loadUserProfileCalls, 1);
      expect(repository.loadDriverProfileCalls, 0);
    });

    test('driver profile overrides user profile fields for driver role',
        () async {
      final repository = _FakeProfileEditBootstrapRepository(
        role: UserRole.driver,
        userProfile: const ProfileEditUserRemoteData(
          displayName: 'User Name',
          phone: '111',
          photoUrl: 'user-photo',
          photoPath: 'user-path',
        ),
        driverProfile: const ProfileEditDriverRemoteData(
          name: ' Driver Name ',
          phone: ' 222 ',
          photoUrl: ' driver-photo ',
          photoPath: ' driver-path ',
        ),
      );
      final useCase = LoadProfileEditBootstrapUseCase(repository: repository);

      final result = await useCase.execute(
        const ProfileEditBootstrapSeed(
          fallbackDisplayName: 'Fallback',
          userId: 'driver-1',
          fallbackPhone: 'seed-phone',
          fallbackPhotoUrl: 'seed-photo',
        ),
      );

      expect(result.role, UserRole.driver);
      expect(result.displayName, 'Driver Name');
      expect(result.phone, '222');
      expect(result.photoUrl, 'driver-photo');
      expect(result.photoPath, 'driver-path');
      expect(repository.getUserRoleCalls, 1);
      expect(repository.loadUserProfileCalls, 1);
      expect(repository.loadDriverProfileCalls, 1);
    });

    test(
        'role resolution failure defaults to passenger and still loads user profile',
        () async {
      final repository = _FakeProfileEditBootstrapRepository(
        throwOnGetUserRole: true,
        userProfile: const ProfileEditUserRemoteData(displayName: 'User'),
      );
      final useCase = LoadProfileEditBootstrapUseCase(repository: repository);

      final result = await useCase.execute(
        const ProfileEditBootstrapSeed(
          fallbackDisplayName: 'Fallback',
          userId: 'u1',
        ),
      );

      expect(result.role, UserRole.passenger);
      expect(result.displayName, 'User');
      expect(repository.getUserRoleCalls, 1);
      expect(repository.loadUserProfileCalls, 1);
      expect(repository.loadDriverProfileCalls, 0);
    });

    test(
        'profile read failure preserves seed values while keeping resolved role',
        () async {
      final repository = _FakeProfileEditBootstrapRepository(
        role: UserRole.driver,
        throwOnLoadUserProfile: true,
      );
      final useCase = LoadProfileEditBootstrapUseCase(repository: repository);

      final result = await useCase.execute(
        const ProfileEditBootstrapSeed(
          fallbackDisplayName: 'Fallback',
          userId: 'driver-1',
          fallbackPhone: 'seed-phone',
          fallbackPhotoUrl: 'seed-photo',
        ),
      );

      expect(result.role, UserRole.driver);
      expect(result.displayName, 'Fallback');
      expect(result.phone, 'seed-phone');
      expect(result.photoUrl, 'seed-photo');
      expect(result.photoPath, isNull);
      expect(repository.getUserRoleCalls, 1);
      expect(repository.loadUserProfileCalls, 1);
      expect(repository.loadDriverProfileCalls, 0);
    });
  });
}

class _FakeProfileEditBootstrapRepository
    implements ProfileEditBootstrapRepository {
  _FakeProfileEditBootstrapRepository({
    this.role = UserRole.passenger,
    this.userProfile = const ProfileEditUserRemoteData(),
    this.driverProfile = const ProfileEditDriverRemoteData(),
    this.throwOnGetUserRole = false,
    this.throwOnLoadUserProfile = false,
  });

  final UserRole role;
  final ProfileEditUserRemoteData userProfile;
  final ProfileEditDriverRemoteData driverProfile;
  final bool throwOnGetUserRole;
  final bool throwOnLoadUserProfile;

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
  Future<ProfileEditUserRemoteData> loadUserProfile(String uid) async {
    loadUserProfileCalls++;
    if (throwOnLoadUserProfile) {
      throw Exception('user');
    }
    return userProfile;
  }

  @override
  Future<ProfileEditDriverRemoteData> loadDriverProfile(String uid) async {
    loadDriverProfileCalls++;
    return driverProfile;
  }
}
