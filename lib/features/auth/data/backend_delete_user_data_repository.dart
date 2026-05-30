import '../../backend/data/mobile_backend_api_client.dart';
import '../domain/delete_user_data_repository.dart';

class BackendDeleteUserDataRepository implements DeleteUserDataRepository {
  BackendDeleteUserDataRepository({
    MobileBackendApiClient? apiClient,
  }) : _apiClient = apiClient ?? MobileBackendApiClient();

  final MobileBackendApiClient _apiClient;

  @override
  Future<DeleteUserDataResult> deleteUserData(
    DeleteUserDataCommand command,
  ) async {
    final payload = await _apiClient.postJson(
      '/api/auth/delete-data',
      body: <String, dynamic>{
        'dryRun': command.dryRun,
      },
    );
    final urlsRaw = payload['manageSubscriptionUrls'];
    return DeleteUserDataResult(
      status: payload['status'] as String? ?? '',
      interceptorMessage: payload['interceptorMessage'] as String?,
      manageSubscriptionLabel: payload['manageSubscriptionLabel'] as String?,
      manageSubscriptionUrls:
          urlsRaw is Map ? Map<String, dynamic>.from(urlsRaw) : null,
    );
  }
}
