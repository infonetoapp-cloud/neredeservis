import '../../../ui/tokens/error_feedback_tokens.dart';

class ResolveDeleteAccountFailureFeedbackMessageUseCase {
  const ResolveDeleteAccountFailureFeedbackMessageUseCase();

  String execute() {
    return CoreErrorFeedbackTokens.accountDeleteFailed;
  }
}
