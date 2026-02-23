import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/application/read_user_role_use_case.dart';
import 'package:neredeservis/features/auth/data/user_role_repository.dart';
import 'package:neredeservis/features/auth/domain/user_role.dart';

void main() {
  group('ReadUserRoleUseCase', () {
    test('returns unknown for empty uid and skips repository', () async {
      final repository = _FakeUserRoleRepository();
      final useCase = ReadUserRoleUseCase(repository: repository);

      final result = await useCase.execute('   ');

      expect(result, UserRole.unknown);
      expect(repository.readCalls, 0);
    });

    test('delegates to repository for non-empty uid', () async {
      final repository = _FakeUserRoleRepository(role: UserRole.driver);
      final useCase = ReadUserRoleUseCase(repository: repository);

      final result = await useCase.execute('driver-1');

      expect(result, UserRole.driver);
      expect(repository.readCalls, 1);
      expect(repository.lastUid, 'driver-1');
    });
  });
}

class _FakeUserRoleRepository implements UserRoleRepository {
  _FakeUserRoleRepository({
    this.role = UserRole.unknown,
  });

  final UserRole role;
  int readCalls = 0;
  String? lastUid;

  @override
  Future<UserRole> readRole(String uid) async {
    readCalls++;
    lastUid = uid;
    return role;
  }

  @override
  Stream<UserRole?> watchRole(String uid) => const Stream<UserRole?>.empty();
}
