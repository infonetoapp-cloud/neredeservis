import '../../backend/data/mobile_backend_api_client.dart';

typedef DriverDeviceRegistrationInvoker = Future<void> Function({
  required String deviceId,
  required String activeDeviceToken,
  required DateTime lastSeenAtUtc,
});

class BackendDriverDeviceRegistrationInvoker {
  BackendDriverDeviceRegistrationInvoker({
    MobileBackendApiClient? apiClient,
  }) : _apiClient = apiClient ?? MobileBackendApiClient();

  final MobileBackendApiClient _apiClient;

  Future<void> invoke({
    required String deviceId,
    required String activeDeviceToken,
    required DateTime lastSeenAtUtc,
  }) async {
    await _apiClient.postJson(
      '/api/auth/device-registration',
      body: <String, dynamic>{
        'deviceId': deviceId,
        'activeDeviceToken': activeDeviceToken,
        'lastSeenAt': lastSeenAtUtc.toIso8601String(),
      },
    );
  }
}
