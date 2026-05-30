import '../../backend/data/mobile_backend_api_client.dart';
import '../../company/data/company_contract_parser.dart';
import '../domain/driver_home_route_section_repository.dart';

class BackendDriverHomeRouteSectionRepository
    implements DriverHomeRouteSectionRepository {
  BackendDriverHomeRouteSectionRepository({
    MobileBackendApiClient? apiClient,
  }) : _apiClient = apiClient ?? MobileBackendApiClient();

  final MobileBackendApiClient _apiClient;

  @override
  Future<List<DriverHomeRouteCandidate>> loadCandidateRoutes(String uid) async {
    const endpoint = 'GET /api/driver/route-candidates';
    final payload = await _apiClient.getJson('/api/driver/route-candidates');
    final items = parseRequiredList(payload, 'items', callable: endpoint);

    return items.map((rawItem) {
      final item = parseCallableMap(rawItem, callable: endpoint);
      final updatedAtUtcRaw = parseOptionalString(item, 'updatedAtUtc') ??
          DateTime.fromMillisecondsSinceEpoch(0, isUtc: true).toIso8601String();
      return DriverHomeRouteCandidate(
        routeId: parseRequiredString(item, 'routeId', callable: endpoint),
        routeName: parseRequiredString(item, 'routeName', callable: endpoint),
        updatedAtUtc: DateTime.tryParse(updatedAtUtcRaw)?.toUtc() ??
            DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
        isOwnedByCurrentDriver: parseRequiredBool(
          item,
          'isOwnedByCurrentDriver',
          callable: endpoint,
        ),
      );
    }).toList(growable: false);
  }

  @override
  Future<List<DriverHomeStopSummary>> loadRouteStops(String routeId) async {
    final endpoint = 'GET /api/driver/routes/$routeId/stops';
    final payload =
        await _apiClient.getJson('/api/driver/routes/$routeId/stops');
    final items = parseRequiredList(payload, 'items', callable: endpoint);

    return items.map((rawItem) {
      final item = parseCallableMap(rawItem, callable: endpoint);
      return DriverHomeStopSummary(
        stopId: parseRequiredString(item, 'stopId', callable: endpoint),
        name: parseRequiredString(item, 'name', callable: endpoint),
        order: parseOptionalInt(item, 'order'),
        passengersWaiting: item['passengersWaiting'] is num
            ? (item['passengersWaiting'] as num).toInt()
            : null,
      );
    }).toList(growable: false);
  }
}
