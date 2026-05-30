import '../../backend/data/mobile_backend_api_client.dart';
import '../domain/guest_session_create_repository.dart';

class BackendGuestSessionCreateRepository
    implements GuestSessionCreateRepository {
  BackendGuestSessionCreateRepository({
    MobileBackendApiClient? apiClient,
  }) : _apiClient = apiClient ?? MobileBackendApiClient();

  final MobileBackendApiClient _apiClient;

  @override
  Future<CreateGuestSessionResult> createGuestSession(
    CreateGuestSessionCommand command,
  ) async {
    final payload = await _apiClient.postJson(
      '/api/guest-sessions',
      body: <String, dynamic>{
        'srvCode': command.srvCode,
        if (command.name != null && command.name!.isNotEmpty)
          'name': command.name,
      },
    );
    return CreateGuestSessionResult(
      routeId: payload['routeId'] as String? ?? '',
      routeName: payload['routeName'] as String?,
      sessionId: payload['sessionId'] as String? ?? '',
      expiresAt: payload['expiresAt'] as String? ?? '',
    );
  }
}
