import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/passenger/application/resolve_join_by_srv_code_failure_feedback_message_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('ResolveJoinBySrvCodeFailureFeedbackMessageUseCase', () {
    const useCase = ResolveJoinBySrvCodeFailureFeedbackMessageUseCase();

    test('maps own route permission denied branch', () {
      final message = useCase.execute(
        errorCode: 'permission-denied',
        errorMessage: "Kendi route'a katilamaz",
      );

      expect(message, "Ayni route'a yolcu olarak katilamazsin.");
    });

    test('maps not found', () {
      final message = useCase.execute(
        errorCode: 'not-found',
        errorMessage: null,
      );

      expect(message, 'SRV kodu ile route bulunamadi.');
    });

    test('falls back with code label', () {
      final message = useCase.execute(
        errorCode: 'internal',
        errorMessage: null,
      );

      expect(message, '${CoreErrorFeedbackTokens.joinFailed} (internal)');
    });
  });
}
