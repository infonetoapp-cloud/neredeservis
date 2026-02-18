class ConsentModel {
  const ConsentModel({
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
  final String acceptedAt;
  final String platform;

  factory ConsentModel.fromMap(Map<String, dynamic> map,
      {required String uid}) {
    return ConsentModel(
      uid: uid,
      privacyVersion: map['privacyVersion'] as String? ?? '',
      kvkkTextVersion: map['kvkkTextVersion'] as String? ?? '',
      locationConsent: map['locationConsent'] as bool? ?? false,
      acceptedAt: map['acceptedAt'] as String? ?? '',
      platform: map['platform'] as String? ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'privacyVersion': privacyVersion,
      'kvkkTextVersion': kvkkTextVersion,
      'locationConsent': locationConsent,
      'acceptedAt': acceptedAt,
      'platform': platform,
    };
  }
}
