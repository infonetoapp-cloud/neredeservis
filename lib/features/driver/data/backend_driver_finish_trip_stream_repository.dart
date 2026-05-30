import 'dart:async';

import '../../backend/data/mobile_backend_api_client.dart';
import '../domain/driver_finish_trip_stream_repository.dart';

class BackendDriverFinishTripStreamRepository
    implements DriverFinishTripStreamRepository {
  BackendDriverFinishTripStreamRepository({
    MobileBackendApiClient? apiClient,
    Duration? pollInterval,
  })  : _apiClient = apiClient ?? MobileBackendApiClient(),
        _pollInterval = pollInterval ?? const Duration(seconds: 5);

  final MobileBackendApiClient _apiClient;
  final Duration _pollInterval;

  @override
  Future<DriverFinishTripSnapshotData?> readSnapshot({
    required String routeId,
    required String dateKey,
    String? tripId,
  }) async {
    final payload = await _apiClient.getJson(
      '/api/driver/routes/$routeId/finish-trip-snapshot',
      queryParameters: <String, dynamic>{
        'dateKey': dateKey,
        if ((tripId ?? '').trim().isNotEmpty) 'tripId': tripId,
      },
    );
    return DriverFinishTripSnapshotData.fromJson(payload);
  }

  @override
  Stream<DriverFinishTripSnapshotData?> watchSnapshot({
    required String routeId,
    required String dateKey,
    String? tripId,
  }) {
    return _watch(
      () => readSnapshot(
        routeId: routeId,
        dateKey: dateKey,
        tripId: tripId,
      ),
    );
  }

  Stream<DriverFinishTripSnapshotData?> _watch(
    Future<DriverFinishTripSnapshotData?> Function() reader,
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
