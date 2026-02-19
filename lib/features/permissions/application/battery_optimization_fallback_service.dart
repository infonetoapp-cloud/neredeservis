import 'package:shared_preferences/shared_preferences.dart';

class BatteryOptimizationFallbackService {
  BatteryOptimizationFallbackService({
    Future<SharedPreferences> Function()? sharedPreferencesFactory,
  }) : _sharedPreferencesFactory =
            sharedPreferencesFactory ?? SharedPreferences.getInstance;

  static const String _needMomentHandledKey =
      'battery_optimization.need_moment_handled';
  static const String _degradeModeEnabledKey =
      'battery_optimization.degrade_mode_enabled';

  final Future<SharedPreferences> Function() _sharedPreferencesFactory;

  Future<bool> shouldPromptAtNeedMoment({
    required bool oemKillSignalDetected,
  }) async {
    final preferences = await _sharedPreferencesFactory();
    final handled = preferences.getBool(_needMomentHandledKey) ?? false;
    if (oemKillSignalDetected) {
      return true;
    }
    return !handled;
  }

  Future<void> markNeedMomentHandled() async {
    final preferences = await _sharedPreferencesFactory();
    await preferences.setBool(_needMomentHandledKey, true);
  }

  Future<void> setDegradeModeEnabled(bool enabled) async {
    final preferences = await _sharedPreferencesFactory();
    await preferences.setBool(_degradeModeEnabledKey, enabled);
  }

  Future<bool> isDegradeModeEnabled() async {
    final preferences = await _sharedPreferencesFactory();
    return preferences.getBool(_degradeModeEnabledKey) ?? false;
  }
}
