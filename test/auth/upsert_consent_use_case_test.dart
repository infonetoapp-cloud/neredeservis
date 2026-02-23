import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/application/upsert_consent_use_case.dart';
import 'package:neredeservis/features/auth/data/upsert_consent_client.dart';

void main() {
  test('UpsertConsentUseCase delegates to client', () async {
    var called = false;
    final useCase = UpsertConsentUseCase(
      client: UpsertConsentClient(
        invoker: (_, __) async {
          called = true;
          return <String, dynamic>{};
        },
      ),
    );

    await useCase.execute(
      const UpsertConsentInput(
        privacyVersion: 'v1',
        kvkkTextVersion: 'v1',
        locationConsent: false,
        platform: 'ios',
      ),
    );

    expect(called, isTrue);
  });
}
