import '../../backend/data/mobile_backend_api_client.dart';
import '../domain/driver_active_trip_transition_version_repository.dart';

class BackendDriverActiveTripTransitionVersionRepository
    implements DriverActiveTripTransitionVersionRepository {
  BackendDriverActiveTripTransitionVersionRepository({
    MobileBackendApiClient? client,
  }) : _client = client ?? MobileBackendApiClient();

  final MobileBackendApiClient _client;

  @override
  Future<int> readCurrentTransitionVersion(String routeId) async {
    final payload = await _client.getJson(
      '/api/driver/active-trip-context',
      queryParameters: <String, dynamic>{
        'routeId': routeId,
      },
    );
    return (payload['transitionVersion'] as num?)?.toInt() ?? 0;
  }
}
