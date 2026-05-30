import '../../backend/data/mobile_backend_api_client.dart';
import '../domain/driver_active_trip_context_lookup_repository.dart';

class BackendDriverActiveTripContextLookupRepository
    implements DriverActiveTripContextLookupRepository {
  BackendDriverActiveTripContextLookupRepository({
    MobileBackendApiClient? client,
  }) : _client = client ?? MobileBackendApiClient();

  final MobileBackendApiClient _client;

  @override
  Future<DriverActiveTripContextLookupResult?> resolveActiveTripContext(
    DriverActiveTripContextLookupCommand command,
  ) async {
    final payload = await _client.getJson(
      '/api/driver/active-trip-context',
      queryParameters: <String, dynamic>{
        'routeId': command.routeId,
        'tripId': command.tripId,
      },
    );
    final rawTrip = payload['trip'];
    if (rawTrip is! Map) {
      return null;
    }
    final trip = Map<String, dynamic>.from(rawTrip);
    final routeId = (trip['routeId'] as String?)?.trim();
    final tripId = (trip['tripId'] as String?)?.trim();
    final transitionVersion = (trip['transitionVersion'] as num?)?.toInt();
    if (routeId == null ||
        routeId.isEmpty ||
        tripId == null ||
        tripId.isEmpty ||
        transitionVersion == null) {
      return null;
    }
    return DriverActiveTripContextLookupResult(
      routeId: routeId,
      tripId: tripId,
      transitionVersion: transitionVersion,
    );
  }
}
