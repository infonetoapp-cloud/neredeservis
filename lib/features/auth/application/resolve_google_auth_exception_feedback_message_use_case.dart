import '../../../ui/tokens/error_feedback_tokens.dart';

class ResolveGoogleAuthExceptionFeedbackMessageUseCase {
  const ResolveGoogleAuthExceptionFeedbackMessageUseCase();

  String execute({required String? errorCode}) {
    return switch (errorCode) {
      'network-request-failed' =>
        'Google girisi icin internet baglantini kontrol et.',
      'operation-not-allowed' => 'Google girisi su an kullanilamiyor.',
      'invalid-credential' => 'Google giris bilgisi gecersiz. Tekrar dene.',
      'missing-google-tokens' => 'Google tokeni alinamadi. Tekrar dene.',
      _ => CoreErrorFeedbackTokens.googleSignInStartFailed,
    };
  }
}
