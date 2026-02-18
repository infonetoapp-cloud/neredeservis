import '../../auth/domain/user_role.dart';
import '../entities/user_entity.dart';
import '../models/user_model.dart';

extension UserModelMapper on UserModel {
  UserEntity toEntity() {
    return UserEntity(
      uid: uid,
      role: userRoleFromRaw(role),
      displayName: displayName,
      phone: phone,
      email: email,
      createdAt: _parseUtcDate(createdAt),
      updatedAt: _parseUtcDate(updatedAt),
      deletedAt: deletedAt == null ? null : _parseUtcDate(deletedAt!),
    );
  }
}

UserModel userModelFromEntity(UserEntity entity) {
  final deletedAt = entity.deletedAt;

  return UserModel(
    uid: entity.uid,
    role: entity.role.name,
    displayName: entity.displayName,
    phone: entity.phone,
    email: entity.email,
    createdAt: entity.createdAt.toUtc().toIso8601String(),
    updatedAt: entity.updatedAt.toUtc().toIso8601String(),
    deletedAt: deletedAt?.toUtc().toIso8601String(),
  );
}

DateTime _parseUtcDate(String value) {
  return DateTime.parse(value).toUtc();
}
