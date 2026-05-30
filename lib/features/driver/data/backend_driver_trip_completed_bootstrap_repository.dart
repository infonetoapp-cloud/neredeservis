import '../../backend/data/mobile_backend_api_client.dart';
import '../../company/data/company_contract_parser.dart';
import '../domain/driver_trip_completed_bootstrap_repository.dart';

class BackendDriverTripCompletedBootstrapRepository
    implements DriverTripCompletedBootstrapRepository {
  BackendDriverTripCompletedBootstrapRepository({
    MobileBackendApiClient? apiClient,
  }) : _apiClient = apiClient ?? MobileBackendApiClient();

  final MobileBackendApiClient _apiClient;

  @override
  Future<DriverTripCompletedBootstrapRawData> loadRawData({
    required String routeId,
    required String tripId,
  }) async {
    final endpoint = 'GET /api/driver/routes/$routeId/trip-completed/$tripId';
    final payload = await _apiClient.getJson(
      '/api/driver/routes/$routeId/trip-completed/$tripId',
    );

    final routeData = _parseOptionalMap(payload['routeData']);
    final tripData = _parseOptionalMap(payload['tripData']);
    final stopsRaw = parseRequiredList(payload, 'stops', callable: endpoint);
    final passengerCount = parseOptionalInt(
        payload, 'passengerCountFromRoutePassengersCollection');

    final stops = stopsRaw
        .map((rawItem) => _parseOptionalMap(rawItem) ?? <String, dynamic>{})
        .toList(growable: false);

    return DriverTripCompletedBootstrapRawData(
      routeData: routeData,
      stops: stops,
      passengerCountFromRoutePassengersCollection: passengerCount,
      tripData: tripData,
    );
  }
}

Map<String, dynamic>? _parseOptionalMap(Object? rawValue) {
  if (rawValue is Map<String, dynamic>) {
    return rawValue;
  }
  if (rawValue is Map<Object?, Object?>) {
    return Map<String, dynamic>.from(rawValue);
  }
  return null;
}
