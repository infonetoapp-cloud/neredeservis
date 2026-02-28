class ResolveAnonymousSignInFailureFeedbackMessageUseCase {
  const ResolveAnonymousSignInFailureFeedbackMessageUseCase();

  String execute({required String? errorCode}) {
    return switch (errorCode) {
      'network-request-failed' => 'Internet baglantini kontrol et.',
      _ => 'Misafir oturumu acilamadi. Tekrar dene.',
    };
  }
}
