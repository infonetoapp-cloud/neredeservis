import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/application/resolve_account_profile_operation_feedback_message_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('ResolveAccountProfileOperationFeedbackMessageUseCase', () {
    const useCase = ResolveAccountProfileOperationFeedbackMessageUseCase();

    test('resolves token-backed messages', () {
      expect(
        useCase.execute(
          AccountProfileOperationFeedbackKind.sessionMissingSignInAgain,
        ),
        CoreErrorFeedbackTokens.sessionMissingSignInAgain,
      );
      expect(
        useCase.execute(
          AccountProfileOperationFeedbackKind.phoneVisibilityUpdateFailed,
        ),
        CoreErrorFeedbackTokens.phoneVisibilityUpdateFailed,
      );
    });

    test('resolves photo upload success and failure messages', () {
      expect(
        useCase.execute(
          AccountProfileOperationFeedbackKind.profilePhotoUploadSucceeded,
        ),
        'Profil fotografi yuklendi.',
      );
      expect(
        useCase.execute(
          AccountProfileOperationFeedbackKind.profilePhotoUploadFailed,
        ),
        'Profil fotografi yuklenemedi.',
      );
    });
  });
}
