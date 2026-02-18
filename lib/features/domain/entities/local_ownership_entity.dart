class LocalOwnershipEntity {
  const LocalOwnershipEntity({
    required this.ownerUid,
    required this.previousOwnerUid,
    required this.migratedAt,
  });

  final String ownerUid;
  final String? previousOwnerUid;
  final DateTime? migratedAt;

  bool get isMigrated => previousOwnerUid != null && migratedAt != null;
}
