import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/entities/passenger_profile_entity.dart';
import 'package:neredeservis/features/domain/mappers/passenger_profile_mapper.dart';
import 'package:neredeservis/features/domain/models/passenger_profile_model.dart';

void main() {
  test('PassengerProfileModel.fromMap + toEntity maps contract', () {
    final model = PassengerProfileModel.fromMap(
      <String, dynamic>{
        'name': 'Yolcu 1',
        'phone': '+905551231212',
        'showPhoneToDriver': true,
        'boardingArea': 'Durak A',
        'virtualStop': <String, dynamic>{'lat': 40.78, 'lng': 29.92},
        'virtualStopLabel': 'Market Onu',
        'notificationTime': '07:10',
        'joinedAt': '2026-02-18T06:20:00.000Z',
        'updatedAt': '2026-02-18T06:30:00.000Z',
      },
      routeId: 'route_1',
      passengerId: 'passenger_1',
    );

    final entity = model.toEntity();

    expect(entity.routeId, 'route_1');
    expect(entity.passengerId, 'passenger_1');
    expect(entity.virtualStop?.lat, closeTo(40.78, 0.000001));
    expect(entity.notificationTime, '07:10');
    expect(entity.joinedAt.isUtc, isTrue);
  });

  test('passengerProfileModelFromEntity handles null virtual stop', () {
    final entity = PassengerProfileEntity(
      routeId: 'route_2',
      passengerId: 'passenger_2',
      name: 'Yolcu 2',
      phone: null,
      showPhoneToDriver: false,
      boardingArea: 'Durak B',
      virtualStop: null,
      virtualStopLabel: null,
      notificationTime: '08:00',
      joinedAt: DateTime.utc(2026, 2, 18, 7),
      updatedAt: DateTime.utc(2026, 2, 18, 7, 10),
    );

    final model = passengerProfileModelFromEntity(entity);
    final map = model.toMap();

    expect(model.virtualStop, isNull);
    expect(map['phone'], isNull);
    expect(map['showPhoneToDriver'], isFalse);
    expect(map['updatedAt'], '2026-02-18T07:10:00.000Z');
  });
}
