import '../../../ui/tokens/error_feedback_tokens.dart';

enum AccountProfileOperationFeedbackKind {
  sessionMissingSignInAgain,
  phoneVisibilityUpdateFailed,
  profilePhotoUploadSucceeded,
  profilePhotoUploadFailed,
}

class ResolveAccountProfileOperationFeedbackMessageUseCase {
  const ResolveAccountProfileOperationFeedbackMessageUseCase();

  String execute(AccountProfileOperationFeedbackKind kind) {
    switch (kind) {
      case AccountProfileOperationFeedbackKind.sessionMissingSignInAgain:
        return CoreErrorFeedbackTokens.sessionMissingSignInAgain;
      case AccountProfileOperationFeedbackKind.phoneVisibilityUpdateFailed:
        return CoreErrorFeedbackTokens.phoneVisibilityUpdateFailed;
      case AccountProfileOperationFeedbackKind.profilePhotoUploadSucceeded:
        return 'Profil fotografi yuklendi.';
      case AccountProfileOperationFeedbackKind.profilePhotoUploadFailed:
        return 'Profil fotografi yuklenemedi.';
    }
  }
}
