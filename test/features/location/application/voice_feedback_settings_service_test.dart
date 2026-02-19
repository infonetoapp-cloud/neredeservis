import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/location/application/voice_feedback_settings_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('VoiceFeedbackSettingsService', () {
    test('defaults to enabled when preference key is missing', () async {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final service = VoiceFeedbackSettingsService();

      final enabled = await service.isVoiceAlertEnabled();

      expect(enabled, isTrue);
    });

    test('persists and reads toggle value', () async {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final service = VoiceFeedbackSettingsService();

      await service.setVoiceAlertEnabled(false);
      final disabledValue = await service.isVoiceAlertEnabled();
      await service.setVoiceAlertEnabled(true);
      final enabledValue = await service.isVoiceAlertEnabled();

      expect(disabledValue, isFalse);
      expect(enabledValue, isTrue);
    });
  });
}
