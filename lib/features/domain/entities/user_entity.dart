import '../../auth/domain/user_role.dart';

class UserEntity {
  const UserEntity({
    required this.uid,
    required this.role,
    required this.displayName,
    required this.phone,
    required this.email,
    required this.createdAt,
    required this.updatedAt,
    required this.deletedAt,
  });

  final String uid;
  final UserRole role;
  final String displayName;
  final String? phone;
  final String? email;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? deletedAt;

  bool get isDeleted => deletedAt != null;
}
