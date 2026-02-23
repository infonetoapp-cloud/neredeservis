import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/chat/application/open_trip_conversation_use_case.dart';
import 'package:neredeservis/features/chat/domain/trip_conversation_repository.dart';

void main() {
  group('OpenTripConversationUseCase', () {
    test('delegates command to repository and returns result', () async {
      const expected = OpenTripConversationResult(
        conversationId: 'conv-1',
        routeId: 'route-1',
        driverUid: 'driver-1',
        passengerUid: 'passenger-1',
      );
      final repository = _FakeTripConversationRepository(result: expected);
      final useCase = OpenTripConversationUseCase(repository: repository);
      const command = OpenTripConversationCommand(
        routeId: 'route-1',
        driverUid: 'driver-1',
      );

      final result = await useCase.execute(command);

      expect(result.conversationId, 'conv-1');
      expect(repository.calls, 1);
      expect(repository.lastCommand, same(command));
    });

    test('rethrows repository failures', () async {
      final repository = _FakeTripConversationRepository(throwOnOpen: true);
      final useCase = OpenTripConversationUseCase(repository: repository);

      expect(
        () => useCase.execute(
          const OpenTripConversationCommand(
            routeId: 'route-1',
            passengerUid: 'passenger-1',
          ),
        ),
        throwsA(isA<StateError>()),
      );
      expect(repository.calls, 1);
    });
  });
}

class _FakeTripConversationRepository implements TripConversationRepository {
  _FakeTripConversationRepository({
    this.result = const OpenTripConversationResult(),
    this.throwOnOpen = false,
  });

  final OpenTripConversationResult result;
  final bool throwOnOpen;
  int calls = 0;
  OpenTripConversationCommand? lastCommand;

  @override
  Future<OpenTripConversationResult> openConversation(
    OpenTripConversationCommand command,
  ) async {
    calls += 1;
    lastCommand = command;
    if (throwOnOpen) {
      throw StateError('boom');
    }
    return result;
  }
}
