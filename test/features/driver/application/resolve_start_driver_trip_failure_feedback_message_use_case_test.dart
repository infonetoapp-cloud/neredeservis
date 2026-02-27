import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/resolve_start_driver_trip_failure_feedback_message_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('ResolveStartDriverTripFailureFeedbackMessageUseCase', () {
    const useCase = ResolveStartDriverTripFailureFeedbackMessageUseCase();

    test('maps permission denied', () {
      expect(
        useCase.execute(errorCode: 'permission-denied', errorMessage: null),
        'Bu route icin sefer baslatma yetkin yok.',
      );
    });

    test('maps not found', () {
      expect(
        useCase.execute(errorCode: 'not-found', errorMessage: null),
        'Route bulunamadi.',
      );
    });

    test('maps transition mismatch precondition', () {
      expect(
        useCase.execute(
          errorCode: 'failed-precondition',
          errorMessage: 'TRANSITION_VERSION_MISMATCH',
        ),
        'Sefer durumu degisti. Ekrani yenileyip tekrar dene.',
      );
    });

    test('maps generic precondition', () {
      expect(
        useCase.execute(
          errorCode: 'failed-precondition',
          errorMessage: 'SOME_OTHER_PRECONDITION',
        ),
        'Sefer su an baslatilamiyor.',
      );
    });

    test('falls back to core token', () {
      expect(
        useCase.execute(errorCode: 'internal', errorMessage: null),
        CoreErrorFeedbackTokens.tripStartFailed,
      );
    });
  });
}
