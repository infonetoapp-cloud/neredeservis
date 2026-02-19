import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/permissions/application/battery_optimization_fallback_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues(<String, Object>{});
  });

  test('first need moment prompts once, then suppresses', () async {
    final service = BatteryOptimizationFallbackService();

    final first = await service.shouldPromptAtNeedMoment(
      oemKillSignalDetected: false,
    );
    await service.markNeedMomentHandled();
    final second = await service.shouldPromptAtNeedMoment(
      oemKillSignalDetected: false,
    );

    expect(first, isTrue);
    expect(second, isFalse);
  });

  test('oem kill signal forces prompt even after first handling', () async {
    final service = BatteryOptimizationFallbackService();
    await service.markNeedMomentHandled();

    final shouldPrompt = await service.shouldPromptAtNeedMoment(
      oemKillSignalDetected: true,
    );

    expect(shouldPrompt, isTrue);
  });

  test('degrade mode flag persists', () async {
    final service = BatteryOptimizationFallbackService();

    expect(await service.isDegradeModeEnabled(), isFalse);
    await service.setDegradeModeEnabled(true);
    expect(await service.isDegradeModeEnabled(), isTrue);
    await service.setDegradeModeEnabled(false);
    expect(await service.isDegradeModeEnabled(), isFalse);
  });
}
