import 'dart:async';

import '../../../services/repository_interfaces.dart';
import '../../backend/data/mobile_backend_api_client.dart';
import '../entities/live_location_entity.dart';

class BackendLiveLocationRepository implements LiveLocationRepository {
  BackendLiveLocationRepository({
    MobileBackendApiClient? client,
    Duration? pollInterval,
  })  : _client = client ?? MobileBackendApiClient(),
        _pollInterval = pollInterval ?? const Duration(seconds: 5);

  final MobileBackendApiClient _client;
  final Duration _pollInterval;

  @override
  Stream<LiveLocationEntity?> watchLiveLocation(String routeId) async* {
    yield await getLiveLocation(routeId);
    yield* Stream<LiveLocationEntity?>.periodic(
      _pollInterval,
      (_) => null,
    ).asyncMap((_) => getLiveLocation(routeId));
  }

  @override
  Future<LiveLocationEntity?> getLiveLocation(String routeId) async {
    final payload =
        await _client.getJson('/api/driver/routes/$routeId/live-location');
    final raw = payload['liveLocation'];
    if (raw is! Map) {
      return null;
    }
    final record = Map<String, dynamic>.from(raw);
    final resolvedRouteId = (record['routeId'] as String?)?.trim();
    final lat = (record['lat'] as num?)?.toDouble();
    final lng = (record['lng'] as num?)?.toDouble();
    final accuracy = (record['accuracy'] as num?)?.toDouble();
    final timestampMs = (record['timestampMs'] as num?)?.toInt();
    if (resolvedRouteId == null ||
        resolvedRouteId.isEmpty ||
        lat == null ||
        lng == null ||
        accuracy == null ||
        timestampMs == null) {
      return null;
    }

    return LiveLocationEntity(
      routeId: resolvedRouteId,
      lat: lat,
      lng: lng,
      speed: (record['speed'] as num?)?.toDouble() ?? 0,
      heading: (record['heading'] as num?)?.toDouble() ?? 0,
      accuracy: accuracy,
      timestampMs: timestampMs,
      tripId: (record['tripId'] as String?)?.trim() ?? '',
      driverId: (record['driverId'] as String?)?.trim() ?? '',
    );
  }

  @override
  Future<void> upsertLiveLocation(LiveLocationEntity location) async {
    await _client.postJson(
      '/api/driver/routes/${location.routeId}/live-location',
      body: <String, dynamic>{
        'tripId': location.tripId,
        'lat': location.lat,
        'lng': location.lng,
        'speed': location.speed,
        'heading': location.heading,
        'accuracy': location.accuracy,
        'timestampMs': location.timestampMs,
      },
    );
  }

  @override
  Future<void> clearLiveLocation(String routeId) async {}
}
