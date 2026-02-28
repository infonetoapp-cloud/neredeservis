import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/passenger/application/resolve_passenger_skip_today_failure_feedback_message_use_case.dart';
import 'package:neredeservis/ui/tokens/error_feedback_tokens.dart';

void main() {
  group('ResolvePassengerSkipTodayFailureFeedbackMessageUseCase', () {
    const useCase = ResolvePassengerSkipTodayFailureFeedbackMessageUseCase();

    test('maps failed precondition', () {
      expect(
        useCase.execute(errorCode: 'failed-precondition'),
        'Bugun icin uygun bir yolculuk bulunamadi. Ekrani yenileyip tekrar dene.',
      );
    });

    test('maps permission denied', () {
      expect(
        useCase.execute(errorCode: 'permission-denied'),
        'Bu route icin islem yapma yetkin yok.',
      );
    });

    test('maps not found', () {
      expect(
        useCase.execute(errorCode: 'not-found'),
        'Route bulunamadi.',
      );
    });

    test('falls back to core token', () {
      expect(
        useCase.execute(errorCode: 'internal'),
        CoreErrorFeedbackTokens.skipTodayFailed,
      );
    });
  });
}
