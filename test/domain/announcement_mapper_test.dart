import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/entities/announcement_entity.dart';
import 'package:neredeservis/features/domain/mappers/announcement_mapper.dart';
import 'package:neredeservis/features/domain/models/announcement_model.dart';

void main() {
  test('AnnouncementModel.fromMap + toEntity maps channels', () {
    final model = AnnouncementModel.fromMap(
      <String, dynamic>{
        'routeId': 'route_1',
        'driverId': 'driver_1',
        'templateKey': 'delay_notice',
        'customText': 'Trafik var',
        'channels': <String>['fcm', 'whatsapp_link'],
        'createdAt': '2026-02-18T07:00:00.000Z',
      },
      announcementId: 'ann_1',
    );

    final entity = model.toEntity();

    expect(entity.announcementId, 'ann_1');
    expect(entity.channels, <AnnouncementChannel>[
      AnnouncementChannel.fcm,
      AnnouncementChannel.whatsappLink,
    ]);
  });

  test('toEntity falls back unknown for unsupported channel', () {
    const model = AnnouncementModel(
      announcementId: 'ann_2',
      routeId: 'route_2',
      driverId: 'driver_2',
      templateKey: 'custom',
      customText: null,
      channels: <String>['legacy'],
      createdAt: '2026-02-18T07:00:00.000Z',
    );

    final entity = model.toEntity();
    expect(entity.channels.single, AnnouncementChannel.unknown);
  });

  test('announcementModelFromEntity serializes channels', () {
    final entity = AnnouncementEntity(
      announcementId: 'ann_3',
      routeId: 'route_3',
      driverId: 'driver_3',
      templateKey: 'arrived',
      customText: null,
      channels: const <AnnouncementChannel>[AnnouncementChannel.whatsappLink],
      createdAt: DateTime.utc(2026, 2, 18, 8),
    );

    final model = announcementModelFromEntity(entity);

    expect(model.channels, <String>['whatsapp_link']);
    expect(model.createdAt, '2026-02-18T08:00:00.000Z');
  });
}
