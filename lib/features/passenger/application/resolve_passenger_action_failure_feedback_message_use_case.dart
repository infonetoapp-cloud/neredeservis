import '../../../ui/tokens/error_feedback_tokens.dart';

enum PassengerActionFailureFeedbackKind {
  settingsSaveFailed,
  leaveRouteFailed,
}

class ResolvePassengerActionFailureFeedbackMessageUseCase {
  const ResolvePassengerActionFailureFeedbackMessageUseCase();

  String execute(PassengerActionFailureFeedbackKind kind) {
    switch (kind) {
      case PassengerActionFailureFeedbackKind.settingsSaveFailed:
        return CoreErrorFeedbackTokens.passengerSettingsSaveFailed;
      case PassengerActionFailureFeedbackKind.leaveRouteFailed:
        return CoreErrorFeedbackTokens.leaveRouteFailed;
    }
  }
}
