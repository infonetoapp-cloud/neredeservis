import '../../backend/data/mobile_backend_api_client.dart';
import '../../company/data/company_contract_parser.dart';
import '../domain/driver_my_trips_repository.dart';

class BackendDriverMyTripsRepository implements DriverMyTripsRepository {
  BackendDriverMyTripsRepository({
    MobileBackendApiClient? apiClient,
  }) : _apiClient = apiClient ?? MobileBackendApiClient();

  final MobileBackendApiClient _apiClient;

  @override
  Future<DriverMyTripsRawData> loadRawData({
    required String driverUid,
  }) async {
    const endpoint = 'GET /api/driver/my-trips';
    final payload = await _apiClient.getJson('/api/driver/my-trips');
    final tripRowsRaw =
        parseRequiredList(payload, 'tripRows', callable: endpoint);

    final tripRows = tripRowsRaw.map((rawItem) {
      final item = parseCallableMap(rawItem, callable: endpoint);
      return DriverMyTripsRawTripRow(
        tripId: parseRequiredString(item, 'tripId', callable: endpoint),
        tripData: parseCallableMap(item['tripData'], callable: endpoint),
      );
    }).toList(growable: false);

    return DriverMyTripsRawData(
      managedRouteDocs: _parseMapOfMaps(payload['managedRouteDocs']),
      tripRows: tripRows,
    );
  }
}

Map<String, Map<String, dynamic>> _parseMapOfMaps(Object? raw) {
  if (raw is! Map) {
    return const <String, Map<String, dynamic>>{};
  }

  final result = <String, Map<String, dynamic>>{};
  for (final entry in raw.entries) {
    final key = entry.key;
    final value = entry.value;
    if (key is! String) {
      continue;
    }
    if (value is Map<String, dynamic>) {
      result[key] = value;
      continue;
    }
    if (value is Map<Object?, Object?>) {
      result[key] = Map<String, dynamic>.from(value);
    }
  }
  return result;
}
