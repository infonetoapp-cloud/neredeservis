enum AnnouncementChannel {
  fcm,
  whatsappLink,
  unknown,
}

AnnouncementChannel announcementChannelFromRaw(String? rawChannel) {
  switch (rawChannel) {
    case 'fcm':
      return AnnouncementChannel.fcm;
    case 'whatsapp_link':
      return AnnouncementChannel.whatsappLink;
    default:
      return AnnouncementChannel.unknown;
  }
}

class AnnouncementEntity {
  const AnnouncementEntity({
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
  final List<AnnouncementChannel> channels;
  final DateTime createdAt;
}
