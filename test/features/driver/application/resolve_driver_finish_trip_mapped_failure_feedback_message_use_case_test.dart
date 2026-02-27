import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/resolve_driver_finish_trip_mapped_failure_feedback_message_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('ResolveDriverFinishTripMappedFailureFeedbackMessageUseCase', () {
    const useCase =
        ResolveDriverFinishTripMappedFailureFeedbackMessageUseCase();

    test('maps permission-denied to device authority message', () {
      final message = useCase.execute(
        errorCode: 'permission-denied',
        errorMessage: null,
      );

      expect(
        message,
        'Bu cihazdan sefer sonlandirma yetkin yok (baslatan cihaz gerekli).',
      );
    });

    test('maps transition mismatch failed-precondition to refresh hint', () {
      final message = useCase.execute(
        errorCode: 'failed-precondition',
        errorMessage: 'TRANSITION_VERSION_MISMATCH',
      );

      expect(message, 'Sefer durumu degisti. Ekrani yenileyip tekrar dene.');
    });

    test('maps generic failed-precondition to generic finish-trip block', () {
      final message = useCase.execute(
        errorCode: 'failed-precondition',
        errorMessage: 'OTHER_PRECONDITION',
      );

      expect(message, 'Sefer su an sonlandirilamiyor.');
    });

    test('falls back to core token for unknown errors', () {
      final message = useCase.execute(
        errorCode: 'internal',
        errorMessage: 'something else',
      );

      expect(message, CoreErrorFeedbackTokens.tripFinishFailed);
    });
  });
}
