import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/application/delete_user_data_use_case.dart';
import 'package:neredeservis/features/auth/domain/delete_user_data_repository.dart';

void main() {
  group('DeleteUserDataUseCase', () {
    test('delegates command to repository and returns result', () async {
      const expected = DeleteUserDataResult(status: 'accepted');
      final repository = _FakeDeleteUserDataRepository(result: expected);
      final useCase = DeleteUserDataUseCase(repository: repository);
      const command = DeleteUserDataCommand(dryRun: false);

      final result = await useCase.execute(command);

      expect(result.status, 'accepted');
      expect(repository.calls, 1);
      expect(repository.lastCommand, same(command));
    });

    test('rethrows repository failures', () async {
      final repository = _FakeDeleteUserDataRepository(throwOnDelete: true);
      final useCase = DeleteUserDataUseCase(repository: repository);

      expect(
        () => useCase.execute(const DeleteUserDataCommand(dryRun: false)),
        throwsA(isA<StateError>()),
      );
      expect(repository.calls, 1);
    });
  });
}

class _FakeDeleteUserDataRepository implements DeleteUserDataRepository {
  _FakeDeleteUserDataRepository({
    this.result = const DeleteUserDataResult(status: ''),
    this.throwOnDelete = false,
  });

  final DeleteUserDataResult result;
  final bool throwOnDelete;
  int calls = 0;
  DeleteUserDataCommand? lastCommand;

  @override
  Future<DeleteUserDataResult> deleteUserData(
      DeleteUserDataCommand command) async {
    calls += 1;
    lastCommand = command;
    if (throwOnDelete) {
      throw StateError('boom');
    }
    return result;
  }
}
