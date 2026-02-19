import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/domain/application/domain_use_cases.dart';
import '../../features/domain/data/local_drift_database.dart';
import '../../features/domain/data/local_queue_repository.dart';
import '../../features/domain/data/rtdb_domain_repositories.dart';
import '../../features/location/application/location_publish_service.dart';
import '../../services/repository_interfaces.dart';

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

final liveLocationRepositoryProvider = Provider<LiveLocationRepository>((_) {
  return RtdbLiveLocationRepository();
});

final locationPublishServiceProvider = Provider<LocationPublishService>((ref) {
  final liveLocationRepository = ref.watch(liveLocationRepositoryProvider);
  final localQueueRepository = ref.watch(localQueueRepositoryProvider);
  return LocationPublishService(
    liveLocationRepository: liveLocationRepository,
    localQueueRepository: localQueueRepository,
  );
});

final transferLocalOwnershipAfterAccountLinkUseCaseProvider =
    Provider<TransferLocalOwnershipAfterAccountLinkUseCase>((ref) {
  final localQueueRepository = ref.watch(localQueueRepositoryProvider);
  return TransferLocalOwnershipAfterAccountLinkUseCase(
    localQueueRepository: localQueueRepository,
  );
});
