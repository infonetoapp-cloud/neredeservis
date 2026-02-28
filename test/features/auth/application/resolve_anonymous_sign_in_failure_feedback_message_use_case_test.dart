import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/application/resolve_anonymous_sign_in_failure_feedback_message_use_case.dart';

void main() {
  group('ResolveAnonymousSignInFailureFeedbackMessageUseCase', () {
    const useCase = ResolveAnonymousSignInFailureFeedbackMessageUseCase();

    test('maps network error', () {
      expect(
        useCase.execute(errorCode: 'network-request-failed'),
        'Internet baglantini kontrol et.',
      );
    });

    test('maps default failure', () {
      expect(
        useCase.execute(errorCode: 'internal'),
        'Misafir oturumu acilamadi. Tekrar dene.',
      );
    });

    test('maps null error code to default failure', () {
      expect(
        useCase.execute(errorCode: null),
        'Misafir oturumu acilamadi. Tekrar dene.',
      );
    });
  });
}
