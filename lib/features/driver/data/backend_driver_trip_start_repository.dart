import '../../backend/data/mobile_backend_api_client.dart';
import '../domain/driver_trip_start_repository.dart';

class BackendDriverTripStartRepository implements DriverTripStartRepository {
  BackendDriverTripStartRepository({
    MobileBackendApiClient? client,
  }) : _client = client ?? MobileBackendApiClient();

  final MobileBackendApiClient _client;

  @override
  Future<DriverTripStartResult> startTrip(
    DriverTripStartCommand command,
  ) async {
    final payload = await _client.postJson(
      '/api/driver/trips/start',
      body: <String, dynamic>{
        'routeId': command.routeId,
        'deviceId': command.deviceId,
        'idempotencyKey': command.idempotencyKey,
        'expectedTransitionVersion': command.expectedTransitionVersion,
      },
    );
    return DriverTripStartResult(
      tripId: payload['tripId'] as String? ?? '',
      status: payload['status'] as String? ?? '',
    );
  }
}
