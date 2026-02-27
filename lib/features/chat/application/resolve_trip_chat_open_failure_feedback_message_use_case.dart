class ResolveTripChatOpenFailureFeedbackMessageUseCase {
  const ResolveTripChatOpenFailureFeedbackMessageUseCase();

  String execute({required String? errorCode}) {
    return switch (errorCode) {
      'permission-denied' => 'Bu sohbeti acma yetkin yok.',
      'not-found' => 'Sohbet bulunamadi.',
      'failed-precondition' => 'Sohbet su an baslatilamiyor.',
      _ => 'Sohbet acilirken hata olustu.',
    };
  }
}
