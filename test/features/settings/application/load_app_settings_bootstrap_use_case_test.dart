import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/domain/user_role.dart';
import 'package:neredeservis/features/settings/application/load_app_settings_bootstrap_use_case.dart';
import 'package:neredeservis/features/settings/domain/app_settings_bootstrap_repository.dart';
import 'package:neredeservis/features/subscription/presentation/paywall_copy_tr.dart';

void main() {
  group('LoadAppSettingsBootstrapUseCase', () {
    test('returns defaults for signed-out user while keeping voice setting',
        () async {
      final repository =
          _FakeAppSettingsBootstrapRepository(currentUserId: null);
      final useCase = LoadAppSettingsBootstrapUseCase(
        repository: repository,
        readVoiceAlertEnabled: () async => false,
      );

      final result = await useCase.execute();

      expect(result.initialVoiceAlertEnabled, isFalse);
      expect(result.isDriver, isFalse);
      expect(result.subscriptionStatus, SubscriptionUiStatus.mock);
      expect(result.trialDaysLeft, 0);
      expect(result.initialShowPhoneToPassengers, isFalse);
      expect(repository.getUserRoleCalls, 0);
      expect(repository.loadDriverBootstrapCalls, 0);
    });

    test('returns non-driver defaults when current user is passenger',
        () async {
      final repository = _FakeAppSettingsBootstrapRepository(
        currentUserId: 'u1',
        userRole: UserRole.passenger,
      );
      final useCase = LoadAppSettingsBootstrapUseCase(
        repository: repository,
        readVoiceAlertEnabled: () async => true,
      );

      final result = await useCase.execute();

      expect(result.initialVoiceAlertEnabled, isTrue);
      expect(result.isDriver, isFalse);
      expect(result.subscriptionStatus, SubscriptionUiStatus.mock);
      expect(repository.getUserRoleCalls, 1);
      expect(repository.loadDriverBootstrapCalls, 0);
    });

    test('loads driver-specific bootstrap data when current user is driver',
        () async {
      final repository = _FakeAppSettingsBootstrapRepository(
        currentUserId: 'driver-1',
        userRole: UserRole.driver,
        driverData: const DriverSettingsBootstrapRemoteData(
          subscriptionStatus: SubscriptionUiStatus.active,
          trialDaysLeft: 11,
          showPhoneToPassengers: true,
        ),
      );
      final useCase = LoadAppSettingsBootstrapUseCase(
        repository: repository,
        readVoiceAlertEnabled: () async => true,
      );

      final result = await useCase.execute();

      expect(result.isDriver, isTrue);
      expect(result.subscriptionStatus, SubscriptionUiStatus.active);
      expect(result.trialDaysLeft, 11);
      expect(result.initialShowPhoneToPassengers, isTrue);
      expect(repository.getUserRoleCalls, 1);
      expect(repository.loadDriverBootstrapCalls, 1);
    });
  });
}

class _FakeAppSettingsBootstrapRepository
    implements AppSettingsBootstrapRepository {
  _FakeAppSettingsBootstrapRepository({
    required this.currentUserId,
    this.userRole = UserRole.unknown,
    this.driverData = const DriverSettingsBootstrapRemoteData(),
  });

  final String? currentUserId;
  final UserRole userRole;
  final DriverSettingsBootstrapRemoteData driverData;

  int getUserRoleCalls = 0;
  int loadDriverBootstrapCalls = 0;

  @override
  Future<String?> getCurrentUserId() async => currentUserId;

  @override
  Future<UserRole> getUserRole(String uid) async {
    getUserRoleCalls++;
    return userRole;
  }

  @override
  Future<DriverSettingsBootstrapRemoteData> loadDriverSettingsBootstrap(
    String uid,
  ) async {
    loadDriverBootstrapCalls++;
    return driverData;
  }
}
