import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/entities/live_location_entity.dart';
import 'package:neredeservis/features/domain/mappers/live_location_mapper.dart';
import 'package:neredeservis/features/domain/models/live_location_model.dart';

void main() {
  test('LiveLocationModel.fromMap + toEntity maps RTDB contract', () {
    final model = LiveLocationModel.fromMap(
      <String, dynamic>{
        'lat': 40.88,
        'lng': 29.32,
        'speed': 12.7,
        'heading': 94.0,
        'accuracy': 5.5,
        'timestamp': 1739880000000,
        'tripId': 'trip-01',
        'driverId': 'driver-01',
      },
      routeId: 'route-01',
    );

    final entity = model.toEntity();

    expect(entity.routeId, 'route-01');
    expect(entity.lat, closeTo(40.88, 0.000001));
    expect(entity.lng, closeTo(29.32, 0.000001));
    expect(entity.speed, closeTo(12.7, 0.000001));
    expect(entity.heading, closeTo(94.0, 0.000001));
    expect(entity.accuracy, closeTo(5.5, 0.000001));
    expect(entity.timestampMs, 1739880000000);
    expect(entity.tripId, 'trip-01');
    expect(entity.driverId, 'driver-01');
  });

  test('liveLocationModelFromEntity serializes map payload', () {
    const entity = LiveLocationEntity(
      routeId: 'route-09',
      lat: 41.0,
      lng: 29.0,
      speed: 0.0,
      heading: 180.0,
      accuracy: 3.2,
      timestampMs: 1739881234567,
      tripId: 'trip-99',
      driverId: 'driver-99',
    );

    final model = liveLocationModelFromEntity(entity);
    final map = model.toMap();

    expect(model.routeId, 'route-09');
    expect(map['lat'], 41.0);
    expect(map['lng'], 29.0);
    expect(map['speed'], 0.0);
    expect(map['heading'], 180.0);
    expect(map['accuracy'], 3.2);
    expect(map['timestamp'], 1739881234567);
    expect(map['tripId'], 'trip-99');
    expect(map['driverId'], 'driver-99');
  });
}
