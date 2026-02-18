import '../entities/local_ownership_entity.dart';
import '../models/local_ownership_model.dart';

extension LocalOwnershipModelMapper on LocalOwnershipModel {
  LocalOwnershipEntity toEntity() {
    return LocalOwnershipEntity(
      ownerUid: ownerUid,
      previousOwnerUid: previousOwnerUid,
      migratedAt: migratedAt == null ? null : _parseUtcDate(migratedAt!),
    );
  }
}

LocalOwnershipModel localOwnershipModelFromEntity(LocalOwnershipEntity entity) {
  return LocalOwnershipModel(
    ownerUid: entity.ownerUid,
    previousOwnerUid: entity.previousOwnerUid,
    migratedAt: entity.migratedAt?.toUtc().toIso8601String(),
  );
}

DateTime _parseUtcDate(String value) {
  return DateTime.parse(value).toUtc();
}
