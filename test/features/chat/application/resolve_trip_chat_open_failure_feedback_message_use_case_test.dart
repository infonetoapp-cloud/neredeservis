import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/chat/application/resolve_trip_chat_open_failure_feedback_message_use_case.dart';

void main() {
  group('ResolveTripChatOpenFailureFeedbackMessageUseCase', () {
    const useCase = ResolveTripChatOpenFailureFeedbackMessageUseCase();

    test('maps permission denied', () {
      expect(
        useCase.execute(errorCode: 'permission-denied'),
        'Bu sohbeti acma yetkin yok.',
      );
    });

    test('maps not found', () {
      expect(useCase.execute(errorCode: 'not-found'), 'Sohbet bulunamadi.');
    });

    test('maps failed precondition', () {
      expect(
        useCase.execute(errorCode: 'failed-precondition'),
        'Sohbet su an baslatilamiyor.',
      );
    });

    test('falls back to generic message', () {
      expect(
        useCase.execute(errorCode: 'internal'),
        'Sohbet acilirken hata olustu.',
      );
    });
  });
}
