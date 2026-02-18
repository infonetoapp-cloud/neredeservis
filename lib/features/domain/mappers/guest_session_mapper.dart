import '../entities/guest_session_entity.dart';
import '../models/guest_session_model.dart';
import 'local_ownership_mapper.dart';

extension GuestSessionModelMapper on GuestSessionModel {
  GuestSessionEntity toEntity() {
    return GuestSessionEntity(
      sessionId: sessionId,
      routeId: routeId,
      guestUid: guestUid,
      expiresAt: _parseUtcDate(expiresAt),
      status: guestSessionStatusFromRaw(status),
      createdAt: _parseUtcDate(createdAt),
      ownership: ownership?.toEntity(),
    );
  }
}

GuestSessionModel guestSessionModelFromEntity(GuestSessionEntity entity) {
  return GuestSessionModel(
    sessionId: entity.sessionId,
    routeId: entity.routeId,
    guestUid: entity.guestUid,
    expiresAt: entity.expiresAt.toUtc().toIso8601String(),
    status: _guestSessionStatusToRaw(entity.status),
    createdAt: entity.createdAt.toUtc().toIso8601String(),
    ownership: entity.ownership == null
        ? null
        : localOwnershipModelFromEntity(entity.ownership!),
  );
}

String _guestSessionStatusToRaw(GuestSessionStatus status) {
  switch (status) {
    case GuestSessionStatus.active:
      return 'active';
    case GuestSessionStatus.expired:
      return 'expired';
    case GuestSessionStatus.revoked:
      return 'revoked';
    case GuestSessionStatus.unknown:
      return 'active';
  }
}

DateTime _parseUtcDate(String value) {
  return DateTime.parse(value).toUtc();
}
