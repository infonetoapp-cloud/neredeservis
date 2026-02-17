import '../domain/user_role.dart';

abstract class UserRoleRepository {
  Stream<UserRole?> watchRole(String uid);
}
