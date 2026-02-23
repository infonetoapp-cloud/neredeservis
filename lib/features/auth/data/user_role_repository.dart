import '../domain/user_role.dart';

abstract class UserRoleRepository {
  Future<UserRole> readRole(String uid);
  Stream<UserRole?> watchRole(String uid);
}
