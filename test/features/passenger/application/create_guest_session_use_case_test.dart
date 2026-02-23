import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/passenger/application/create_guest_session_use_case.dart';
import 'package:neredeservis/features/passenger/domain/guest_session_create_repository.dart';

void main() {
  group('CreateGuestSessionUseCase', () {
    test('delegates command to repository and returns result', () async {
      const expected = CreateGuestSessionResult(
        routeId: 'route-1',
        routeName: 'Servis 1',
        sessionId: 'guest-1',
        expiresAt: '2026-02-23T10:00:00Z',
      );
      final repository = _FakeGuestSessionCreateRepository(result: expected);
      final useCase = CreateGuestSessionUseCase(repository: repository);
      const command =
          CreateGuestSessionCommand(srvCode: 'SRV123', name: 'Misafir');

      final result = await useCase.execute(command);

      expect(result.routeId, 'route-1');
      expect(result.sessionId, 'guest-1');
      expect(repository.calls, 1);
      expect(repository.lastCommand, same(command));
    });

    test('rethrows repository failures', () async {
      final repository = _FakeGuestSessionCreateRepository(throwOnCreate: true);
      final useCase = CreateGuestSessionUseCase(repository: repository);

      expect(
        () =>
            useCase.execute(const CreateGuestSessionCommand(srvCode: 'SRV123')),
        throwsA(isA<StateError>()),
      );
      expect(repository.calls, 1);
    });
  });
}

class _FakeGuestSessionCreateRepository
    implements GuestSessionCreateRepository {
  _FakeGuestSessionCreateRepository({
    this.result = const CreateGuestSessionResult(
      routeId: '',
      sessionId: '',
      expiresAt: '',
    ),
    this.throwOnCreate = false,
  });

  final CreateGuestSessionResult result;
  final bool throwOnCreate;
  int calls = 0;
  CreateGuestSessionCommand? lastCommand;

  @override
  Future<CreateGuestSessionResult> createGuestSession(
    CreateGuestSessionCommand command,
  ) async {
    calls += 1;
    lastCommand = command;
    if (throwOnCreate) {
      throw StateError('boom');
    }
    return result;
  }
}
