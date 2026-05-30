import '../../backend/data/mobile_backend_api_client.dart';
import 'bootstrap_user_profile_client.dart';

class UpsertConsentInput {
  const UpsertConsentInput({
    required this.privacyVersion,
    required this.kvkkTextVersion,
    required this.locationConsent,
    required this.platform,
  });

  final String privacyVersion;
  final String kvkkTextVersion;
  final bool locationConsent;
  final String platform;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'privacyVersion': privacyVersion,
        'kvkkTextVersion': kvkkTextVersion,
        'locationConsent': locationConsent,
        'platform': platform,
      };
}

class UpsertConsentClient {
  UpsertConsentClient({
    MobileBackendApiClient? apiClient,
    CallableInvoker? invoker,
  })  : _apiClient = apiClient,
        _invoker = invoker;

  MobileBackendApiClient? _apiClient;
  final CallableInvoker? _invoker;

  Future<void> upsert(UpsertConsentInput input) async {
    if (_invoker != null) {
      await _invoker.call('upsertConsent', input.toJson());
      return;
    }
    final apiClient = _apiClient ??= MobileBackendApiClient();
    await apiClient.patchJson(
      '/api/auth/consent',
      body: input.toJson(),
    );
  }
}
