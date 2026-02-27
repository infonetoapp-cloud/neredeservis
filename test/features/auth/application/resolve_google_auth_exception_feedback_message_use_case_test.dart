import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/application/resolve_google_auth_exception_feedback_message_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('ResolveGoogleAuthExceptionFeedbackMessageUseCase', () {
    const useCase = ResolveGoogleAuthExceptionFeedbackMessageUseCase();

    test('maps network error', () {
      expect(
        useCase.execute(errorCode: 'network-request-failed'),
        'Google girisi icin internet baglantini kontrol et.',
      );
    });

    test('maps operation not allowed', () {
      expect(
        useCase.execute(errorCode: 'operation-not-allowed'),
        'Google girisi su an kullanilamiyor.',
      );
    });

    test('maps invalid credential', () {
      expect(
        useCase.execute(errorCode: 'invalid-credential'),
        'Google giris bilgisi gecersiz. Tekrar dene.',
      );
    });

    test('maps missing google tokens', () {
      expect(
        useCase.execute(errorCode: 'missing-google-tokens'),
        'Google tokeni alinamadi. Tekrar dene.',
      );
    });

    test('falls back to core token', () {
      expect(
        useCase.execute(errorCode: 'unknown'),
        CoreErrorFeedbackTokens.googleSignInStartFailed,
      );
    });
  });
}
