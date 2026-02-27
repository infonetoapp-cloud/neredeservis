import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/passenger/application/resolve_guest_session_create_failure_feedback_message_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('ResolveGuestSessionCreateFailureFeedbackMessageUseCase', () {
    const useCase = ResolveGuestSessionCreateFailureFeedbackMessageUseCase();

    test('maps permission denied', () {
      expect(
        useCase.execute(errorCode: 'permission-denied'),
        'Bu route icin misafir takip oturumu baslatilamiyor.',
      );
    });

    test('maps not found', () {
      expect(
        useCase.execute(errorCode: 'not-found'),
        'SRV kodu ile route bulunamadi.',
      );
    });

    test('falls back to core token', () {
      expect(
        useCase.execute(errorCode: 'internal'),
        CoreErrorFeedbackTokens.guestSessionCreateFailed,
      );
    });
  });
}
