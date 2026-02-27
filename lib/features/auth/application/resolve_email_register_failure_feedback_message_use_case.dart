import '../../../ui/tokens/error_feedback_tokens.dart';

class ResolveEmailRegisterFailureFeedbackMessageUseCase {
  const ResolveEmailRegisterFailureFeedbackMessageUseCase();

  String execute({required String? errorCode}) {
    return switch (errorCode) {
      'email-already-in-use' => 'Bu email zaten kayitli.',
      'weak-password' => 'Sifre en az 6 karakter olmali.',
      'invalid-email' => 'Email formati gecersiz.',
      'network-request-failed' => 'Internet baglantini kontrol et.',
      _ => CoreErrorFeedbackTokens.registerFailed,
    };
  }
}
