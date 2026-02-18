enum ConsentPlatform {
  android,
  ios,
  unknown,
}

ConsentPlatform consentPlatformFromRaw(String? rawPlatform) {
  switch (rawPlatform) {
    case 'android':
      return ConsentPlatform.android;
    case 'ios':
      return ConsentPlatform.ios;
    default:
      return ConsentPlatform.unknown;
  }
}

class ConsentEntity {
  const ConsentEntity({
    required this.uid,
    required this.privacyVersion,
    required this.kvkkTextVersion,
    required this.locationConsent,
    required this.acceptedAt,
    required this.platform,
  });

  final String uid;
  final String privacyVersion;
  final String kvkkTextVersion;
  final bool locationConsent;
  final DateTime acceptedAt;
  final ConsentPlatform platform;
}
