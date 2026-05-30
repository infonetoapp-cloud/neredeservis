import '../../../core/errors/error_codes.dart';
import '../../../core/errors/error_propagation.dart';

class ResolveTripChatOpenFailureFeedbackMessageUseCase {
  const ResolveTripChatOpenFailureFeedbackMessageUseCase();

  String execute({required String? errorCode}) {
    return switch (normalizeErrorCode(errorCode)) {
      ErrorCodes.permissionDenied => 'Bu sohbeti acma yetkin yok.',
      ErrorCodes.invalidArgument => 'Sohbet baslatilirken veri hatasi olustu.',
      ErrorCodes.failedPrecondition => 'Sohbet su an baslatilamiyor.',
      ErrorCodes.unauthenticated => 'Oturum bulunamadi. Tekrar giris yap.',
      _ => 'Sohbet acilirken hata olustu.',
    };
  }
}
