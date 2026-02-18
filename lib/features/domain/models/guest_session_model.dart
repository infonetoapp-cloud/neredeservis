import 'local_ownership_model.dart';

class GuestSessionModel {
  const GuestSessionModel({
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
  final String expiresAt;
  final String status;
  final String createdAt;
  final LocalOwnershipModel? ownership;

  factory GuestSessionModel.fromMap(
    Map<String, dynamic> map, {
    required String sessionId,
  }) {
    final ownerUid = map['ownerUid'] as String?;
    final ownership = ownerUid == null
        ? null
        : LocalOwnershipModel(
            ownerUid: ownerUid,
            previousOwnerUid: map['previousOwnerUid'] as String?,
            migratedAt: map['migratedAt'] as String?,
          );

    return GuestSessionModel(
      sessionId: sessionId,
      routeId: map['routeId'] as String? ?? '',
      guestUid: map['guestUid'] as String? ?? '',
      expiresAt: map['expiresAt'] as String? ?? '',
      status: map['status'] as String? ?? '',
      createdAt: map['createdAt'] as String? ?? '',
      ownership: ownership,
    );
  }

  Map<String, dynamic> toMap() {
    final ownershipMap = ownership?.toMap() ?? const <String, dynamic>{};
    return <String, dynamic>{
      'routeId': routeId,
      'guestUid': guestUid,
      'expiresAt': expiresAt,
      'status': status,
      'createdAt': createdAt,
      ...ownershipMap,
    };
  }
}
