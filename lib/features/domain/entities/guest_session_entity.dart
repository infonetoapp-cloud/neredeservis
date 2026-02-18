import 'local_ownership_entity.dart';

enum GuestSessionStatus {
  active,
  expired,
  revoked,
  unknown,
}

GuestSessionStatus guestSessionStatusFromRaw(String? rawStatus) {
  switch (rawStatus) {
    case 'active':
      return GuestSessionStatus.active;
    case 'expired':
      return GuestSessionStatus.expired;
    case 'revoked':
      return GuestSessionStatus.revoked;
    default:
      return GuestSessionStatus.unknown;
  }
}

class GuestSessionEntity {
  const GuestSessionEntity({
    required this.sessionId,
    required this.routeId,
    required this.guestUid,
    required this.expiresAt,
    required this.status,
    required this.createdAt,
    required this.ownership,
  });

  final String sessionId;
  final String routeId;
  final String guestUid;
  final DateTime expiresAt;
  final GuestSessionStatus status;
  final DateTime createdAt;
  final LocalOwnershipEntity? ownership;
}
