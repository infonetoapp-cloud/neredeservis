import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/entities/consent_entity.dart';
import 'package:neredeservis/features/domain/mappers/consent_mapper.dart';
import 'package:neredeservis/features/domain/models/consent_model.dart';

void main() {
  test('ConsentModel.fromMap + toEntity maps consent contract', () {
    final model = ConsentModel.fromMap(
      <String, dynamic>{
        'privacyVersion': '1.0.0',
        'kvkkTextVersion': '2026-02',
        'locationConsent': true,
        'acceptedAt': '2026-02-18T08:00:00.000Z',
        'platform': 'android',
      },
      uid: 'uid_1',
    );

    final entity = model.toEntity();

    expect(entity.uid, 'uid_1');
    expect(entity.platform, ConsentPlatform.android);
    expect(entity.locationConsent, isTrue);
    expect(entity.acceptedAt.isUtc, isTrue);
  });

  test('toEntity falls back unknown platform', () {
    const model = ConsentModel(
      uid: 'uid_2',
      privacyVersion: '1',
      kvkkTextVersion: '1',
      locationConsent: false,
      acceptedAt: '2026-02-18T08:00:00.000Z',
      platform: 'web',
    );

    final entity = model.toEntity();
    expect(entity.platform, ConsentPlatform.unknown);
  });

  test('consentModelFromEntity serializes platform', () {
    final entity = ConsentEntity(
      uid: 'uid_3',
      privacyVersion: '2',
      kvkkTextVersion: '2',
      locationConsent: true,
      acceptedAt: DateTime.utc(2026, 2, 18, 9),
      platform: ConsentPlatform.ios,
    );

    final model = consentModelFromEntity(entity);

    expect(model.platform, 'ios');
    expect(model.acceptedAt, '2026-02-18T09:00:00.000Z');
  });
}
