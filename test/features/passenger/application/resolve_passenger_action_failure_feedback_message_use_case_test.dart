import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/passenger/application/resolve_passenger_action_failure_feedback_message_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('ResolvePassengerActionFailureFeedbackMessageUseCase', () {
    const useCase = ResolvePassengerActionFailureFeedbackMessageUseCase();

    test('resolves settings save failure token', () {
      expect(
        useCase.execute(PassengerActionFailureFeedbackKind.settingsSaveFailed),
        CoreErrorFeedbackTokens.passengerSettingsSaveFailed,
      );
    });

    test('resolves leave route failure token', () {
      expect(
        useCase.execute(PassengerActionFailureFeedbackKind.leaveRouteFailed),
        CoreErrorFeedbackTokens.leaveRouteFailed,
      );
    });
  });
}
