import '../data/user_role_repository.dart';
import '../domain/user_role.dart';

class ReadUserRoleUseCase {
  const ReadUserRoleUseCase({
    required UserRoleRepository repository,
  }) : _repository = repository;

  final UserRoleRepository _repository;

  Future<UserRole> execute(String uid) async {
    if (uid.trim().isEmpty) {
      return UserRole.unknown;
    }
    return _repository.readRole(uid);
  }
}
