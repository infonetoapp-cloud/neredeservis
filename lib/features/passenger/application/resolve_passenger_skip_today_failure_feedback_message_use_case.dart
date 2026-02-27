import '../../../ui/tokens/error_feedback_tokens.dart';

class ResolvePassengerSkipTodayFailureFeedbackMessageUseCase {
  const ResolvePassengerSkipTodayFailureFeedbackMessageUseCase();

  String execute({required String? errorCode}) {
    return switch (errorCode) {
      'failed-precondition' =>
        'Bugun icin uygun bir yolculuk bulunamadi. Ekrani yenileyip tekrar dene.',
      'permission-denied' => 'Bu route icin islem yapma yetkin yok.',
      'not-found' => 'Route bulunamadi.',
      _ => CoreErrorFeedbackTokens.skipTodayFailed,
    };
  }
}
