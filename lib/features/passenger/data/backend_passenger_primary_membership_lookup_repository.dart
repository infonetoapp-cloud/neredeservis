import '../../backend/data/mobile_backend_api_client.dart';
import '../../company/data/company_contract_parser.dart';
import '../domain/passenger_primary_membership_lookup_repository.dart';

class BackendPassengerPrimaryMembershipLookupRepository
    implements PassengerPrimaryMembershipLookupRepository {
  BackendPassengerPrimaryMembershipLookupRepository({
    MobileBackendApiClient? apiClient,
  }) : _apiClient = apiClient ?? MobileBackendApiClient();

  final MobileBackendApiClient _apiClient;

  @override
  Future<PassengerPrimaryMembershipLookupResult?> lookupPrimaryMembership(
    String passengerUid,
  ) async {
    const endpoint = 'GET /api/passenger/membership';
    final payload = await _apiClient.getJson('/api/passenger/membership');
    final membershipRaw = payload['membership'];
    if (membershipRaw == null) {
      return null;
    }

    final membership = parseCallableMap(membershipRaw, callable: endpoint);
    final routeId = parseOptionalString(membership, 'routeId');
    if (routeId == null) {
      return null;
    }

    return PassengerPrimaryMembershipLookupResult(
      routeId: routeId,
      routeName: parseOptionalString(membership, 'routeName'),
    );
  }
}
