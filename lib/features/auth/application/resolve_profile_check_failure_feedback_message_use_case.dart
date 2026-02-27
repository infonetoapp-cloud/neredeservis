import '../../../ui/tokens/error_feedback_tokens.dart';

class ResolveProfileCheckFailureFeedbackMessageUseCase {
  const ResolveProfileCheckFailureFeedbackMessageUseCase();

  String execute() {
    return CoreErrorFeedbackTokens.profileCheckFailed;
  }
}
