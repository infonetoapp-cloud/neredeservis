class AnnouncementModel {
  const AnnouncementModel({
    required this.announcementId,
    required this.routeId,
    required this.driverId,
    required this.templateKey,
    required this.customText,
    required this.channels,
    required this.createdAt,
  });

  final String announcementId;
  final String routeId;
  final String driverId;
  final String templateKey;
  final String? customText;
  final List<String> channels;
  final String createdAt;

  factory AnnouncementModel.fromMap(
    Map<String, dynamic> map, {
    required String announcementId,
  }) {
    return AnnouncementModel(
      announcementId: announcementId,
      routeId: map['routeId'] as String? ?? '',
      driverId: map['driverId'] as String? ?? '',
      templateKey: map['templateKey'] as String? ?? '',
      customText: map['customText'] as String?,
      channels: (map['channels'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<String>()
          .toList(growable: false),
      createdAt: map['createdAt'] as String? ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'routeId': routeId,
      'driverId': driverId,
      'templateKey': templateKey,
      'customText': customText,
      'channels': channels,
      'createdAt': createdAt,
    };
  }
}
