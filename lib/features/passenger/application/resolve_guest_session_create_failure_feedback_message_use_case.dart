import '../../../ui/tokens/error_feedback_tokens.dart';

class ResolveGuestSessionCreateFailureFeedbackMessageUseCase {
  const ResolveGuestSessionCreateFailureFeedbackMessageUseCase();

  String execute({required String? errorCode}) {
    return switch (errorCode) {
      'permission-denied' =>
        'Bu route icin misafir takip oturumu baslatilamiyor.',
      'not-found' => 'SRV kodu ile route bulunamadi.',
      _ => CoreErrorFeedbackTokens.guestSessionCreateFailed,
    };
  }
}
