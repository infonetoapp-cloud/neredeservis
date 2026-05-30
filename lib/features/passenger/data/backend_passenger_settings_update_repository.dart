import '../../backend/data/mobile_backend_api_client.dart';
import '../domain/passenger_settings_update_repository.dart';

class BackendPassengerSettingsUpdateRepository
    implements PassengerSettingsUpdateRepository {
  BackendPassengerSettingsUpdateRepository({
    MobileBackendApiClient? apiClient,
  }) : _apiClient = apiClient ?? MobileBackendApiClient();

  final MobileBackendApiClient _apiClient;

  @override
  Future<void> updateSettings(PassengerSettingsUpdateCommand command) async {
    await _apiClient.patchJson(
      '/api/passenger/settings',
      body: <String, dynamic>{
        'routeId': command.routeId,
        'showPhoneToDriver': command.showPhoneToDriver,
        if (command.phone != null && command.phone!.isNotEmpty)
          'phone': command.phone,
        'boardingArea': command.boardingArea,
        'notificationTime': command.notificationTime,
        if (command.virtualStop != null)
          'virtualStop': <String, dynamic>{
            'lat': command.virtualStop!.lat,
            'lng': command.virtualStop!.lng,
          },
        if (command.virtualStopLabel != null &&
            command.virtualStopLabel!.trim().isNotEmpty)
          'virtualStopLabel': command.virtualStopLabel!.trim(),
      },
    );
  }
}
