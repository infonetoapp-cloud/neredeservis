import '../data/local_queue_repository.dart';

class TransferLocalOwnershipAfterAccountLinkUseCase {
  TransferLocalOwnershipAfterAccountLinkUseCase({
    required LocalQueueRepository localQueueRepository,
  }) : _localQueueRepository = localQueueRepository;

  final LocalQueueRepository _localQueueRepository;

  Future<void> execute({
    required String previousOwnerUid,
    required String newOwnerUid,
    DateTime? migratedAt,
  }) {
    final safeMigratedAt = migratedAt ?? DateTime.now().toUtc();
    return _localQueueRepository.transferLocalOwnershipAfterAccountLink(
      previousOwnerUid: previousOwnerUid,
      newOwnerUid: newOwnerUid,
      migratedAtMs: safeMigratedAt.millisecondsSinceEpoch,
    );
  }
}
