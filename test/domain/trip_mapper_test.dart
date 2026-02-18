import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/entities/trip_entity.dart';
import 'package:neredeservis/features/domain/mappers/trip_mapper.dart';
import 'package:neredeservis/features/domain/models/trip_model.dart';

void main() {
  test('TripModel.fromMap + toEntity maps trip contract', () {
    final model = TripModel.fromMap(
      <String, dynamic>{
        'routeId': 'route_1',
        'driverId': 'driver_1',
        'driverSnapshot': <String, dynamic>{
          'name': 'Ahmet',
          'plate': '34 ABC 123',
          'phone': null,
        },
        'status': 'active',
        'startedAt': '2026-02-18T06:30:00.000Z',
        'endedAt': null,
        'lastLocationAt': '2026-02-18T06:45:00.000Z',
        'endReason': null,
        'startedByDeviceId': 'device_1',
        'transitionVersion': 2,
        'updatedAt': '2026-02-18T06:45:00.000Z',
      },
      tripId: 'trip_1',
    );

    final entity = model.toEntity();

    expect(entity.tripId, 'trip_1');
    expect(entity.status, TripStatus.active);
    expect(entity.endReason, isNull);
    expect(entity.driverSnapshot.phone, isNull);
    expect(entity.transitionVersion, 2);
  });

  test('tripModelFromEntity serializes endReason', () {
    final entity = TripEntity(
      tripId: 'trip_2',
      routeId: 'route_2',
      driverId: 'driver_2',
      driverSnapshot: const TripDriverSnapshotEntity(
        name: 'Driver',
        plate: '34 XYZ 999',
        phone: '+905550001122',
      ),
      status: TripStatus.completed,
      startedAt: DateTime.utc(2026, 2, 18, 5),
      endedAt: DateTime.utc(2026, 2, 18, 7),
      lastLocationAt: DateTime.utc(2026, 2, 18, 7),
      endReason: TripEndReason.driverFinished,
      startedByDeviceId: 'device_2',
      transitionVersion: 5,
      updatedAt: DateTime.utc(2026, 2, 18, 7),
    );

    final model = tripModelFromEntity(entity);

    expect(model.status, 'completed');
    expect(model.endReason, 'driver_finished');
    expect(model.endedAt, '2026-02-18T07:00:00.000Z');
  });

  test('toEntity falls back unknown enums on unsupported values', () {
    const model = TripModel(
      tripId: 'trip_3',
      routeId: 'route_3',
      driverId: 'driver_3',
      driverSnapshot: TripDriverSnapshotModel(name: '', plate: '', phone: null),
      status: 'legacy',
      startedAt: '2026-02-18T00:00:00.000Z',
      endedAt: null,
      lastLocationAt: '2026-02-18T00:00:00.000Z',
      endReason: 'legacy_reason',
      startedByDeviceId: 'device_3',
      transitionVersion: 0,
      updatedAt: '2026-02-18T00:00:00.000Z',
    );

    final entity = model.toEntity();

    expect(entity.status, TripStatus.unknown);
    expect(entity.endReason, TripEndReason.unknown);
  });
}
