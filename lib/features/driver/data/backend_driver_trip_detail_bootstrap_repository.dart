import '../../backend/data/mobile_backend_api_client.dart';
import '../../company/data/company_contract_parser.dart';
import '../domain/driver_trip_detail_bootstrap_repository.dart';

class BackendDriverTripDetailBootstrapRepository
    implements DriverTripDetailBootstrapRepository {
  BackendDriverTripDetailBootstrapRepository({
    MobileBackendApiClient? apiClient,
  }) : _apiClient = apiClient ?? MobileBackendApiClient();

  final MobileBackendApiClient _apiClient;

  @override
  Future<DriverTripDetailBootstrapRawData> loadRawData({
    required String routeId,
    required String? tripId,
  }) async {
    final endpoint = 'GET /api/driver/routes/$routeId/trip-detail';
    final payload = await _apiClient.getJson(
      '/api/driver/routes/$routeId/trip-detail',
      queryParameters: <String, dynamic>{
        if ((tripId ?? '').trim().isNotEmpty) 'tripId': tripId,
      },
    );

    final routeData = _parseOptionalMap(payload['routeData']);
    final tripData = _parseOptionalMap(payload['tripData']);
    final stopRowsRaw =
        parseRequiredList(payload, 'stopRows', callable: endpoint);
    final passengerRowsRaw =
        parseRequiredList(payload, 'passengerRows', callable: endpoint);

    final stopRows = stopRowsRaw.map((rawItem) {
      final item = parseCallableMap(rawItem, callable: endpoint);
      return DriverTripDetailRawStopRow(
        stopId: parseRequiredString(item, 'stopId', callable: endpoint),
        stopData: _parseOptionalMap(item['stopData']) ?? <String, dynamic>{},
      );
    }).toList(growable: false);

    final passengerRows = passengerRowsRaw.map((rawItem) {
      final item = parseCallableMap(rawItem, callable: endpoint);
      return DriverTripDetailRawPassengerRow(
        passengerId:
            parseRequiredString(item, 'passengerId', callable: endpoint),
        passengerData:
            _parseOptionalMap(item['passengerData']) ?? <String, dynamic>{},
      );
    }).toList(growable: false);

    return DriverTripDetailBootstrapRawData(
      routeData: routeData,
      stopRows: stopRows,
      passengerRows: passengerRows,
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
