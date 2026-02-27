import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/application/resolve_password_reset_email_failure_feedback_message_use_case.dart';

void main() {
  group('ResolvePasswordResetEmailFailureFeedbackMessageUseCase', () {
    const useCase = ResolvePasswordResetEmailFailureFeedbackMessageUseCase();

    test('maps invalid email', () {
      expect(
        useCase.execute(errorCode: 'invalid-email'),
        'E-posta formati gecersiz.',
      );
    });

    test('maps network failure', () {
      expect(
        useCase.execute(errorCode: 'network-request-failed'),
        'Internet baglantini kontrol et.',
      );
    });

    test('maps too many requests', () {
      expect(
        useCase.execute(errorCode: 'too-many-requests'),
        'Cok fazla deneme yapildi. Lutfen biraz sonra tekrar dene.',
      );
    });

    test('returns null for unknown code', () {
      expect(useCase.execute(errorCode: 'user-not-found'), isNull);
    });
  });
}
