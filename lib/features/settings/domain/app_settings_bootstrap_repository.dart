import '../../auth/domain/user_role.dart';
import '../../subscription/presentation/paywall_copy_tr.dart';

class DriverSettingsBootstrapRemoteData {
  const DriverSettingsBootstrapRemoteData({
    this.subscriptionStatus = SubscriptionUiStatus.mock,
    this.trialDaysLeft = 0,
    this.showPhoneToPassengers = false,
  });

  final SubscriptionUiStatus subscriptionStatus;
  final int trialDaysLeft;
  final bool showPhoneToPassengers;
}

abstract class AppSettingsBootstrapRepository {
  Future<String?> getCurrentUserId();
  Future<UserRole> getUserRole(String uid);
  Future<DriverSettingsBootstrapRemoteData> loadDriverSettingsBootstrap(
      String uid);
}
