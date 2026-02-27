import '../../../ui/tokens/error_feedback_tokens.dart';

class ResolveEmailSignInFailureFeedbackMessageUseCase {
  const ResolveEmailSignInFailureFeedbackMessageUseCase();

  String execute({required String? errorCode}) {
    return switch (errorCode) {
      'invalid-credential' => 'Email veya sifre hatali.',
      'user-not-found' => 'Bu email ile kullanici bulunamadi.',
      'wrong-password' => 'Sifre hatali.',
      'network-request-failed' => 'Internet baglantini kontrol et.',
      _ => CoreErrorFeedbackTokens.emailSignInFailed,
    };
  }
}
