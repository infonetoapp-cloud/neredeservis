import '../../backend/data/mobile_backend_api_client.dart';
import '../domain/passenger_route_join_repository.dart';

class BackendPassengerRouteJoinRepository
    implements PassengerRouteJoinRepository {
  BackendPassengerRouteJoinRepository({
    MobileBackendApiClient? apiClient,
  }) : _apiClient = apiClient ?? MobileBackendApiClient();

  final MobileBackendApiClient _apiClient;

  @override
  Future<PassengerRouteJoinBySrvCodeResult> joinBySrvCode(
    PassengerRouteJoinBySrvCodeCommand command,
  ) async {
    final payload = await _apiClient.postJson(
      '/api/passenger/routes/join',
      body: <String, dynamic>{
        'srvCode': command.srvCode,
        'name': command.name,
        if (command.phone != null && command.phone!.isNotEmpty)
          'phone': command.phone,
        'showPhoneToDriver': command.showPhoneToDriver,
        'boardingArea': command.boardingArea,
        'notificationTime': command.notificationTime,
      },
    );
    return PassengerRouteJoinBySrvCodeResult(
      routeId: payload['routeId'] as String? ?? '',
      routeName: payload['routeName'] as String? ?? '',
    );
  }
}
