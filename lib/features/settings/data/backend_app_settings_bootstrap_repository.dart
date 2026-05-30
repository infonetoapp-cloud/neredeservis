import '../../auth/data/auth_credential_gateway.dart';
import '../../auth/data/current_auth_profile_snapshot_client.dart';
import '../../auth/data/identity_toolkit_auth_credential_gateway.dart';
import '../../auth/domain/user_role.dart';
import '../../subscription/domain/driver_subscription_snapshot.dart';
import '../domain/app_settings_bootstrap_repository.dart';

class BackendAppSettingsBootstrapRepository
    implements AppSettingsBootstrapRepository {
  BackendAppSettingsBootstrapRepository({
    AuthCredentialGateway? authCredentialGateway,
    CurrentAuthProfileSnapshotClient? snapshotClient,
  })  : _authCredentialGateway =
            authCredentialGateway ?? IdentityToolkitAuthCredentialGateway(),
        _snapshotClient = snapshotClient ?? CurrentAuthProfileSnapshotClient();

  final AuthCredentialGateway _authCredentialGateway;
  final CurrentAuthProfileSnapshotClient _snapshotClient;

  @override
  Future<String?> getCurrentUserId() async {
    return _authCredentialGateway.currentUser?.uid;
  }

  @override
  Future<UserRole> getUserRole(String uid) async {
    try {
      final snapshot = await _snapshotClient.readCurrent();
      return snapshot.uid == uid ? snapshot.role : UserRole.unknown;
    } catch (_) {
      return UserRole.unknown;
    }
  }

  @override
  Future<DriverSettingsBootstrapRemoteData> loadDriverSettingsBootstrap(
    String uid,
  ) async {
    try {
      final snapshot = await _snapshotClient.readCurrent();
      if (snapshot.uid != uid) {
        return const DriverSettingsBootstrapRemoteData();
      }

      final driverProfile = snapshot.driverProfile;
      final subscription = parseDriverSubscriptionSnapshotFromDriverData(
        <String, dynamic>{
          'subscriptionStatus': driverProfile?.subscriptionStatus,
          'trialEndsAt': driverProfile?.trialEndsAt,
        },
      );

      return DriverSettingsBootstrapRemoteData(
        subscriptionStatus: subscription.status,
        trialDaysLeft: subscription.trialDaysLeft,
        showPhoneToPassengers: driverProfile?.showPhoneToPassengers == true,
      );
    } catch (_) {
      return const DriverSettingsBootstrapRemoteData();
    }
  }
}
