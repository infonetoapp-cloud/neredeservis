import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/data/upsert_consent_client.dart';

void main() {
  test('UpsertConsentClient forwards callable payload', () async {
    String? callableName;
    Map<String, dynamic>? payload;
    final client = UpsertConsentClient(
      invoker: (name, input) async {
        callableName = name;
        payload = Map<String, dynamic>.from(input);
        return <String, dynamic>{};
      },
    );

    await client.upsert(
      const UpsertConsentInput(
        privacyVersion: 'v1',
        kvkkTextVersion: 'v1',
        locationConsent: true,
        platform: 'android',
      ),
    );

    expect(callableName, 'upsertConsent');
    expect(payload, <String, dynamic>{
      'privacyVersion': 'v1',
      'kvkkTextVersion': 'v1',
      'locationConsent': true,
      'platform': 'android',
    });
  });
}
