import '../../../ui/tokens/error_feedback_tokens.dart';

class ResolveDriverFinishTripMappedFailureFeedbackMessageUseCase {
  const ResolveDriverFinishTripMappedFailureFeedbackMessageUseCase();

  String execute({
    required String? errorCode,
    required String? errorMessage,
  }) {
    final transitionMismatch =
        (errorMessage ?? '').contains('TRANSITION_VERSION_MISMATCH');
    switch (errorCode) {
      case 'permission-denied':
        return 'Bu cihazdan sefer sonlandirma yetkin yok (baslatan cihaz gerekli).';
      case 'not-found':
        return 'Aktif trip bulunamadi.';
      case 'failed-precondition':
        if (transitionMismatch) {
          return 'Sefer durumu degisti. Ekrani yenileyip tekrar dene.';
        }
        return 'Sefer su an sonlandirilamiyor.';
      default:
        return CoreErrorFeedbackTokens.tripFinishFailed;
    }
  }
}
