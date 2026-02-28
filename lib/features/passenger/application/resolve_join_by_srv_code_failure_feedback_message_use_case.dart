import '../../../ui/tokens/error_feedback_tokens.dart';

class ResolveJoinBySrvCodeFailureFeedbackMessageUseCase {
  const ResolveJoinBySrvCodeFailureFeedbackMessageUseCase();

  String execute({
    required String? errorCode,
    required String? errorMessage,
  }) {
    final code = (errorCode ?? '').trim();
    final messageRaw = (errorMessage ?? '').trim().toLowerCase();

    switch (code) {
      case 'unauthenticated':
        return 'Oturum suresi doldu. Tekrar giris yap ve yeniden dene.';
      case 'permission-denied':
        if (messageRaw.contains("kendi route'a katilamaz") ||
            messageRaw.contains('kendi route')) {
          return "Ayni route'a yolcu olarak katilamazsin.";
        }
        if (messageRaw.contains('yetkin bulunmuyor')) {
          return 'Yolcu rolu yetkin aktif degil.';
        }
        return 'Bu hesapla katilma yetkin yok.';
      case 'not-found':
        return 'SRV kodu ile route bulunamadi.';
      case 'failed-precondition':
        return 'Bu route su an katilima kapali.';
      case 'resource-exhausted':
        return 'SRV deneme limiti doldu. Sonra tekrar dene.';
      default:
        final codeLabel = code.isEmpty ? 'unknown' : code;
        return '${CoreErrorFeedbackTokens.joinFailed} ($codeLabel)';
    }
  }
}
