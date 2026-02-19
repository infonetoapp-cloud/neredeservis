import 'package:shared_preferences/shared_preferences.dart';

class VoiceFeedbackSettingsService {
  VoiceFeedbackSettingsService({
    Future<SharedPreferences> Function()? sharedPreferencesFactory,
  }) : _sharedPreferencesFactory =
            sharedPreferencesFactory ?? SharedPreferences.getInstance;

  static const String _voiceAlertEnabledKey = 'driver_voice_feedback.enabled';

  final Future<SharedPreferences> Function() _sharedPreferencesFactory;

  Future<bool> isVoiceAlertEnabled() async {
    final preferences = await _sharedPreferencesFactory();
    return preferences.getBool(_voiceAlertEnabledKey) ?? true;
  }

  Future<void> setVoiceAlertEnabled(bool enabled) async {
    final preferences = await _sharedPreferencesFactory();
    await preferences.setBool(_voiceAlertEnabledKey, enabled);
  }
}
