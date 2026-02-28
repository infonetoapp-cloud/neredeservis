import '../../../ui/tokens/error_feedback_tokens.dart';

class ResolveProfilePrepareFailureFeedbackMessageUseCase {
  const ResolveProfilePrepareFailureFeedbackMessageUseCase();

  String execute() {
    return CoreErrorFeedbackTokens.profilePrepareFailed;
  }
}
