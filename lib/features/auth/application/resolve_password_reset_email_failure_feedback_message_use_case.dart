class ResolvePasswordResetEmailFailureFeedbackMessageUseCase {
  const ResolvePasswordResetEmailFailureFeedbackMessageUseCase();

  String? execute({required String? errorCode}) {
    return switch (errorCode) {
      'invalid-email' => 'E-posta formati gecersiz.',
      'network-request-failed' => 'Internet baglantini kontrol et.',
      'too-many-requests' =>
        'Cok fazla deneme yapildi. Lutfen biraz sonra tekrar dene.',
      _ => null,
    };
  }
}
