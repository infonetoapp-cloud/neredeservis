class LocalOwnershipModel {
  const LocalOwnershipModel({
    required this.ownerUid,
    required this.previousOwnerUid,
    required this.migratedAt,
  });

  final String ownerUid;
  final String? previousOwnerUid;
  final String? migratedAt;

  factory LocalOwnershipModel.fromMap(Map<String, dynamic> map) {
    return LocalOwnershipModel(
      ownerUid: map['ownerUid'] as String? ?? '',
      previousOwnerUid: map['previousOwnerUid'] as String?,
      migratedAt: map['migratedAt'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'ownerUid': ownerUid,
      'previousOwnerUid': previousOwnerUid,
      'migratedAt': migratedAt,
    };
  }
}
