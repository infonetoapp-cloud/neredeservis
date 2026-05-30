import '../../backend/data/mobile_backend_api_client.dart';
import '../domain/passenger_skip_today_repository.dart';

class BackendPassengerSkipTodayRepository
    implements PassengerSkipTodayRepository {
  BackendPassengerSkipTodayRepository({
    MobileBackendApiClient? apiClient,
  }) : _apiClient = apiClient ?? MobileBackendApiClient();

  final MobileBackendApiClient _apiClient;

  @override
  Future<void> submitSkipToday(PassengerSkipTodayCommand command) async {
    await _apiClient.postJson(
      '/api/passenger/skip-today',
      body: <String, dynamic>{
        'routeId': command.routeId,
        'dateKey': command.dateKey,
        'idempotencyKey': command.idempotencyKey,
      },
    );
  }
}
