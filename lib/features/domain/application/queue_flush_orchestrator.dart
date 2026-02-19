import '../../location/application/location_publish_service.dart';
import '../data/local_queue_repository.dart';
import 'trip_action_sync_service.dart';

class QueueFlushSummary {
  const QueueFlushSummary({
    required this.tripActionReplay,
    required this.locationReplay,
  });

  final TripActionReplaySummary tripActionReplay;
  final LocationFlushSummary locationReplay;

  bool get hasPendingTripActions => tripActionReplay.pendingRetryCount > 0;
  bool get hasManualIntervention => tripActionReplay.permanentFailureCount > 0;
  bool get hasPendingLocationSamples => locationReplay.queuedForRetryCount > 0;
}

class QueueFlushOrchestrator {
  QueueFlushOrchestrator({
    required LocalQueueRepository localQueueRepository,
    required TripActionSyncService tripActionSyncService,
    required LocationPublishService locationPublishService,
  })  : _localQueueRepository = localQueueRepository,
        _tripActionSyncService = tripActionSyncService,
        _locationPublishService = locationPublishService;

  final LocalQueueRepository _localQueueRepository;
  final TripActionSyncService _tripActionSyncService;
  final LocationPublishService _locationPublishService;

  Future<QueueFlushSummary> flushAll({
    required String ownerUid,
    int tripActionLimit = 20,
    int locationLimit = 20,
  }) async {
    // Runbook 327: trip action replay must run before location queue replay.
    final tripActionReplay = await _tripActionSyncService.flushQueued(
      ownerUid: ownerUid,
      limit: tripActionLimit,
    );
    final locationReplay = await _locationPublishService.flushQueued(
      ownerUid: ownerUid,
      limit: locationLimit,
    );
    return QueueFlushSummary(
      tripActionReplay: tripActionReplay,
      locationReplay: locationReplay,
    );
  }

  Future<bool> hasPendingQueue({
    required String ownerUid,
  }) {
    return _localQueueRepository.hasPendingOfflineData(ownerUid: ownerUid);
  }

  Future<bool> hasPendingCriticalTripActions({
    required String ownerUid,
  }) {
    return _tripActionSyncService.hasPendingCriticalActions(ownerUid: ownerUid);
  }

  Future<bool> hasManualInterventionRequirement({
    required String ownerUid,
  }) {
    return _tripActionSyncService.hasManualInterventionRequirement(
      ownerUid: ownerUid,
    );
  }
}
