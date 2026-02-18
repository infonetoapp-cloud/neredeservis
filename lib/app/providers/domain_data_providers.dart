import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/domain/application/domain_use_cases.dart';
import '../../features/domain/data/local_drift_database.dart';
import '../../features/domain/data/local_queue_repository.dart';

final localDriftDatabaseProvider = Provider<LocalDriftDatabase>((ref) {
  final database = LocalDriftDatabase();
  ref.onDispose(() {
    unawaited(database.close());
  });
  return database;
});

final localQueueRepositoryProvider = Provider<LocalQueueRepository>((ref) {
  final database = ref.watch(localDriftDatabaseProvider);
  final repository = LocalQueueRepository(database: database);
  unawaited(repository.resumePendingOwnershipMigrationIfNeeded());
  return repository;
});

final transferLocalOwnershipAfterAccountLinkUseCaseProvider =
    Provider<TransferLocalOwnershipAfterAccountLinkUseCase>((ref) {
  final localQueueRepository = ref.watch(localQueueRepositoryProvider);
  return TransferLocalOwnershipAfterAccountLinkUseCase(
    localQueueRepository: localQueueRepository,
  );
});
