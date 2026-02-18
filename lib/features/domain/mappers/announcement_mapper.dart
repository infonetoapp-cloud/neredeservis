import '../entities/announcement_entity.dart';
import '../models/announcement_model.dart';

extension AnnouncementModelMapper on AnnouncementModel {
  AnnouncementEntity toEntity() {
    return AnnouncementEntity(
      announcementId: announcementId,
      routeId: routeId,
      driverId: driverId,
      templateKey: templateKey,
      customText: customText,
      channels:
          channels.map(announcementChannelFromRaw).toList(growable: false),
      createdAt: _parseUtcDate(createdAt),
    );
  }
}

AnnouncementModel announcementModelFromEntity(AnnouncementEntity entity) {
  return AnnouncementModel(
    announcementId: entity.announcementId,
    routeId: entity.routeId,
    driverId: entity.driverId,
    templateKey: entity.templateKey,
    customText: entity.customText,
    channels:
        entity.channels.map(_announcementChannelToRaw).toList(growable: false),
    createdAt: entity.createdAt.toUtc().toIso8601String(),
  );
}

String _announcementChannelToRaw(AnnouncementChannel channel) {
  switch (channel) {
    case AnnouncementChannel.fcm:
      return 'fcm';
    case AnnouncementChannel.whatsappLink:
      return 'whatsapp_link';
    case AnnouncementChannel.unknown:
      return 'fcm';
  }
}

DateTime _parseUtcDate(String value) {
  return DateTime.parse(value).toUtc();
}
