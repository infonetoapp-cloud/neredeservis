import '../../backend/data/mobile_backend_api_client.dart';
import '../domain/passenger_route_leave_repository.dart';

class BackendPassengerRouteLeaveRepository
    implements PassengerRouteLeaveRepository {
  BackendPassengerRouteLeaveRepository({
    MobileBackendApiClient? apiClient,
  }) : _apiClient = apiClient ?? MobileBackendApiClient();

  final MobileBackendApiClient _apiClient;

  @override
  Future<PassengerRouteLeaveResult> leaveRoute(
    PassengerRouteLeaveCommand command,
  ) async {
    final payload = await _apiClient.postJson(
      '/api/passenger/routes/leave',
      body: <String, dynamic>{
        'routeId': command.routeId,
      },
    );
    return PassengerRouteLeaveResult(
      left: payload['left'] as bool? ?? false,
    );
  }
}
