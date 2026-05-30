import 'dart:async';

import '../../backend/data/mobile_backend_api_client.dart';
import '../domain/passenger_tracking_snapshot_repository.dart';

class BackendPassengerTrackingSnapshotRepository
    implements PassengerTrackingSnapshotRepository {
  BackendPassengerTrackingSnapshotRepository({
    MobileBackendApiClient? apiClient,
    Duration? pollInterval,
  })  : _apiClient = apiClient ?? MobileBackendApiClient(),
        _pollInterval = pollInterval ?? const Duration(seconds: 5);

  final MobileBackendApiClient _apiClient;
  final Duration _pollInterval;

  @override
  Future<PassengerTrackingSnapshotData?> readPassengerRouteTracking(
    String routeId,
  ) async {
    final payload =
        await _apiClient.getJson('/api/passenger/routes/$routeId/tracking');
    return PassengerTrackingSnapshotData.fromJson(payload);
  }

  @override
  Future<PassengerTrackingSnapshotData?> readGuestSessionTracking(
    String sessionId,
  ) async {
    final payload =
        await _apiClient.getJson('/api/guest-sessions/$sessionId/tracking');
    return PassengerTrackingSnapshotData.fromJson(payload);
  }

  @override
  Stream<PassengerTrackingSnapshotData?> watchPassengerRouteTracking(
    String routeId,
  ) {
    return _watch(() => readPassengerRouteTracking(routeId));
  }

  @override
  Stream<PassengerTrackingSnapshotData?> watchGuestSessionTracking(
    String sessionId,
  ) {
    return _watch(() => readGuestSessionTracking(sessionId));
  }

  Stream<PassengerTrackingSnapshotData?> _watch(
    Future<PassengerTrackingSnapshotData?> Function() reader,
  ) async* {
    String? lastSignature;
    bool emittedInitialFallback = false;

    while (true) {
      try {
        final nextSnapshot = await reader();
        final nextSignature = nextSnapshot?.signature();
        if (nextSignature != lastSignature) {
          lastSignature = nextSignature;
          yield nextSnapshot;
        }
      } catch (_) {
        if (!emittedInitialFallback && lastSignature == null) {
          emittedInitialFallback = true;
          yield null;
        }
      }
      await Future<void>.delayed(_pollInterval);
    }
  }
}
