import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/application/resolve_email_register_failure_feedback_message_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('ResolveEmailRegisterFailureFeedbackMessageUseCase', () {
    const useCase = ResolveEmailRegisterFailureFeedbackMessageUseCase();

    test('maps email already in use', () {
      expect(
        useCase.execute(errorCode: 'email-already-in-use'),
        'Bu email zaten kayitli.',
      );
    });

    test('maps weak password', () {
      expect(
        useCase.execute(errorCode: 'weak-password'),
        'Sifre en az 6 karakter olmali.',
      );
    });

    test('maps invalid email', () {
      expect(
        useCase.execute(errorCode: 'invalid-email'),
        'Email formati gecersiz.',
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
        CoreErrorFeedbackTokens.registerFailed,
      );
    });
  });
}
