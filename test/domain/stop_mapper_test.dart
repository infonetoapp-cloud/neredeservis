import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/entities/stop_entity.dart';
import 'package:neredeservis/features/domain/mappers/stop_mapper.dart';
import 'package:neredeservis/features/domain/models/stop_model.dart';

void main() {
  test('StopModel.fromMap + toEntity maps stop contract', () {
    final model = StopModel.fromMap(
      <String, dynamic>{
        'name': 'GOSB Giris',
        'location': <String, dynamic>{'lat': 40.824, 'lng': 29.405},
        'order': 3,
        'createdAt': '2026-02-18T06:00:00.000Z',
        'updatedAt': '2026-02-18T06:10:00.000Z',
      },
      routeId: 'route_1',
      stopId: 'stop_1',
    );

    final entity = model.toEntity();

    expect(entity.routeId, 'route_1');
    expect(entity.stopId, 'stop_1');
    expect(entity.name, 'GOSB Giris');
    expect(entity.location.lat, closeTo(40.824, 0.000001));
    expect(entity.order, 3);
    expect(entity.createdAt.isUtc, isTrue);
  });

  test('stopModelFromEntity round-trips map fields', () {
    final entity = StopEntity(
      routeId: 'route_2',
      stopId: 'stop_2',
      name: 'Darica',
      location: const StopGeoPointEntity(lat: 40.77, lng: 29.94),
      order: 1,
      createdAt: DateTime.utc(2026, 2, 10, 6),
      updatedAt: DateTime.utc(2026, 2, 10, 7),
    );

    final model = stopModelFromEntity(entity);
    final map = model.toMap();

    expect(model.stopId, 'stop_2');
    expect(map['order'], 1);
    expect(map['location']['lat'], 40.77);
    expect(map['createdAt'], '2026-02-10T06:00:00.000Z');
  });
}
