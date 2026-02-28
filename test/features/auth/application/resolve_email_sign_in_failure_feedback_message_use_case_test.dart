import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/application/resolve_email_sign_in_failure_feedback_message_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('ResolveEmailSignInFailureFeedbackMessageUseCase', () {
    const useCase = ResolveEmailSignInFailureFeedbackMessageUseCase();

    test('maps invalid credential', () {
      expect(
        useCase.execute(errorCode: 'invalid-credential'),
        'Email veya sifre hatali.',
      );
    });

    test('maps user not found', () {
      expect(
        useCase.execute(errorCode: 'user-not-found'),
        'Bu email ile kullanici bulunamadi.',
      );
    });

    test('maps wrong password', () {
      expect(
        useCase.execute(errorCode: 'wrong-password'),
        'Sifre hatali.',
      );
    });

    test('maps network failure', () {
      expect(
        useCase.execute(errorCode: 'network-request-failed'),
        'Internet baglantini kontrol et.',
      );
    });

    test('falls back to token', () {
      expect(
        useCase.execute(errorCode: 'internal'),
        CoreErrorFeedbackTokens.emailSignInFailed,
      );
    });
  });
}
