import '../entities/consent_entity.dart';
import '../models/consent_model.dart';

extension ConsentModelMapper on ConsentModel {
  ConsentEntity toEntity() {
    return ConsentEntity(
      uid: uid,
      privacyVersion: privacyVersion,
      kvkkTextVersion: kvkkTextVersion,
      locationConsent: locationConsent,
      acceptedAt: _parseUtcDate(acceptedAt),
      platform: consentPlatformFromRaw(platform),
    );
  }
}

ConsentModel consentModelFromEntity(ConsentEntity entity) {
  return ConsentModel(
    uid: entity.uid,
    privacyVersion: entity.privacyVersion,
    kvkkTextVersion: entity.kvkkTextVersion,
    locationConsent: entity.locationConsent,
    acceptedAt: entity.acceptedAt.toUtc().toIso8601String(),
    platform: _consentPlatformToRaw(entity.platform),
  );
}

String _consentPlatformToRaw(ConsentPlatform platform) {
  switch (platform) {
    case ConsentPlatform.android:
      return 'android';
    case ConsentPlatform.ios:
      return 'ios';
    case ConsentPlatform.unknown:
      return 'android';
  }
}

DateTime _parseUtcDate(String value) {
  return DateTime.parse(value).toUtc();
}
