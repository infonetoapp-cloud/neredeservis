import '../../../ui/tokens/error_feedback_tokens.dart';

class ResolveStartDriverTripFailureFeedbackMessageUseCase {
  const ResolveStartDriverTripFailureFeedbackMessageUseCase();

  String execute({
    required String? errorCode,
    required String? errorMessage,
  }) {
    final transitionMismatch =
        (errorMessage ?? '').contains('TRANSITION_VERSION_MISMATCH');
    return switch (errorCode) {
      'permission-denied' => 'Bu route icin sefer baslatma yetkin yok.',
      'not-found' => 'Route bulunamadi.',
      'failed-precondition' => transitionMismatch
          ? 'Sefer durumu degisti. Ekrani yenileyip tekrar dene.'
          : 'Sefer su an baslatilamiyor.',
      _ => CoreErrorFeedbackTokens.tripStartFailed,
    };
  }
}
