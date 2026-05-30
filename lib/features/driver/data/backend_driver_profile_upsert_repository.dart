import '../../backend/data/mobile_backend_api_client.dart';
import '../domain/driver_profile_upsert_repository.dart';

class BackendDriverProfileUpsertRepository
    implements DriverProfileUpsertRepository {
  BackendDriverProfileUpsertRepository({
    MobileBackendApiClient? apiClient,
  }) : _apiClient = apiClient ?? MobileBackendApiClient();

  final MobileBackendApiClient _apiClient;

  @override
  Future<void> upsertDriverProfile(DriverProfileUpsertCommand command) async {
    await _apiClient.patchJson(
      '/api/driver/profile',
      body: <String, dynamic>{
        'name': command.name,
        'phone': command.phone,
        'plate': command.plate,
        'showPhoneToPassengers': command.showPhoneToPassengers,
        if (command.photoUrl != null && command.photoUrl!.isNotEmpty)
          'photoUrl': command.photoUrl,
        if (command.photoPath != null && command.photoPath!.isNotEmpty)
          'photoPath': command.photoPath,
        'companyId': command.companyId,
      },
    );
  }
}
