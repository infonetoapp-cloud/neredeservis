import '../data/upsert_consent_client.dart';

class UpsertConsentUseCase {
  UpsertConsentUseCase({
    required UpsertConsentClient client,
  }) : _client = client;

  final UpsertConsentClient _client;

  Future<void> execute(UpsertConsentInput input) {
    return _client.upsert(input);
  }
}
