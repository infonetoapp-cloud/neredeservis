import '../../backend/data/mobile_backend_api_client.dart';
import '../application/location_publish_service.dart';

LocationHistoryWriter buildBackendLocationHistoryWriter({
  MobileBackendApiClient? client,
}) {
  final resolvedClient = client ?? MobileBackendApiClient();
  return (sample) async {
    await resolvedClient.postJson(
      '/api/driver/routes/${sample.routeId}/location-history',
      body: <String, dynamic>{
        'tripId': sample.tripId,
        'lat': sample.lat,
        'lng': sample.lng,
        'accuracy': sample.accuracy,
        'speed': sample.speed,
        'heading': sample.heading,
        'sampledAtMs': sample.sampledAtMs,
        'recordedAtMs': sample.recordedAtMs,
        'source': sample.source,
      },
    );
  };
}
