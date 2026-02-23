import '../../auth/domain/user_role.dart';
import '../../location/application/voice_feedback_settings_service.dart';
import '../../subscription/presentation/paywall_copy_tr.dart';
import '../domain/app_settings_bootstrap_repository.dart';

class AppSettingsBootstrapResult {
  const AppSettingsBootstrapResult({
    this.initialVoiceAlertEnabled = true,
    this.isDriver = false,
    this.subscriptionStatus = SubscriptionUiStatus.mock,
    this.trialDaysLeft = 0,
    this.initialShowPhoneToPassengers = false,
  });

  final bool initialVoiceAlertEnabled;
  final bool isDriver;
  final SubscriptionUiStatus subscriptionStatus;
  final int trialDaysLeft;
  final bool initialShowPhoneToPassengers;
}

class LoadAppSettingsBootstrapUseCase {
  LoadAppSettingsBootstrapUseCase({
    required AppSettingsBootstrapRepository repository,
    Future<bool> Function()? readVoiceAlertEnabled,
  })  : _repository = repository,
        _readVoiceAlertEnabled = readVoiceAlertEnabled ??
            VoiceFeedbackSettingsService().isVoiceAlertEnabled;

  final AppSettingsBootstrapRepository _repository;
  final Future<bool> Function() _readVoiceAlertEnabled;

  Future<AppSettingsBootstrapResult> execute() async {
    final initialVoiceAlertEnabled = await _readVoiceAlertEnabled();
    final uid = await _repository.getCurrentUserId();
    if (uid == null) {
      return AppSettingsBootstrapResult(
        initialVoiceAlertEnabled: initialVoiceAlertEnabled,
      );
    }

    final role = await _repository.getUserRole(uid);
    if (role != UserRole.driver) {
      return AppSettingsBootstrapResult(
        initialVoiceAlertEnabled: initialVoiceAlertEnabled,
      );
    }

    final driverBootstrap = await _repository.loadDriverSettingsBootstrap(uid);
    return AppSettingsBootstrapResult(
      initialVoiceAlertEnabled: initialVoiceAlertEnabled,
      isDriver: true,
      subscriptionStatus: driverBootstrap.subscriptionStatus,
      trialDaysLeft: driverBootstrap.trialDaysLeft,
      initialShowPhoneToPassengers: driverBootstrap.showPhoneToPassengers,
    );
  }
}
