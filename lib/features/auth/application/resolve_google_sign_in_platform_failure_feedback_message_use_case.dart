import '../../../ui/tokens/error_feedback_tokens.dart';

class ResolveGoogleSignInPlatformFailureFeedbackMessageUseCase {
  const ResolveGoogleSignInPlatformFailureFeedbackMessageUseCase();

  String execute({required String? errorCode}) {
    return switch (errorCode) {
      'sign_in_canceled' => 'Google girisi iptal edildi.',
      'sign_in_required' => 'Google hesabi secimi tamamlanmadi.',
      _ => CoreErrorFeedbackTokens.googleSignInStartFailed,
    };
  }
}
