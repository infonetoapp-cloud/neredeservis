import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/application/resolve_google_sign_in_platform_failure_feedback_message_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('ResolveGoogleSignInPlatformFailureFeedbackMessageUseCase', () {
    const useCase = ResolveGoogleSignInPlatformFailureFeedbackMessageUseCase();

    test('maps sign in canceled', () {
      expect(
        useCase.execute(errorCode: 'sign_in_canceled'),
        'Google girisi iptal edildi.',
      );
    });

    test('maps sign in required', () {
      expect(
        useCase.execute(errorCode: 'sign_in_required'),
        'Google hesabi secimi tamamlanmadi.',
      );
    });

    test('falls back to token', () {
      expect(
        useCase.execute(errorCode: 'unknown'),
        CoreErrorFeedbackTokens.googleSignInStartFailed,
      );
    });
  });
}
