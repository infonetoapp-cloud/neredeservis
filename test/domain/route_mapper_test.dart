import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/entities/route_entity.dart';
import 'package:neredeservis/features/domain/mappers/route_mapper.dart';
import 'package:neredeservis/features/domain/models/route_model.dart';

void main() {
  test('RouteModel.fromMap + toEntity maps route contract fields', () {
    final model = RouteModel.fromMap(
      <String, dynamic>{
        'name': 'Darica - GOSB',
        'driverId': 'driver_1',
        'authorizedDriverIds': <String>['driver_1', 'driver_2'],
        'memberIds': <String>['driver_1', 'passenger_1'],
        'companyId': 'company_1',
        'srvCode': 'AB2C3D',
        'visibility': 'private',
        'allowGuestTracking': true,
        'creationMode': 'ghost_drive',
        'routePolyline': 'encoded_polyline',
        'startPoint': <String, dynamic>{'lat': 40.77, 'lng': 29.94},
        'startAddress': 'Darica Merkez',
        'endPoint': <String, dynamic>{'lat': 40.83, 'lng': 29.40},
        'endAddress': 'GOSB',
        'scheduledTime': '07:30',
        'timeSlot': 'morning',
        'isArchived': false,
        'vacationUntil': null,
        'passengerCount': 24,
        'lastTripStartedNotificationAt': '2026-02-18T06:55:00.000Z',
        'createdAt': '2026-02-01T06:00:00.000Z',
        'updatedAt': '2026-02-18T06:59:00.000Z',
      },
      routeId: 'route_001',
    );

    final entity = model.toEntity();

    expect(entity.routeId, 'route_001');
    expect(entity.visibility, RouteVisibility.privateOnly);
    expect(entity.creationMode, RouteCreationMode.ghostDrive);
    expect(entity.timeSlot, RouteTimeSlot.morning);
    expect(entity.startPoint.lat, closeTo(40.77, 0.000001));
    expect(entity.lastTripStartedNotificationAt?.isUtc, isTrue);
    expect(entity.createdAt.isUtc, isTrue);
  });

  test('routeCreationMode and timeSlot fall back to unknown', () {
    const model = RouteModel(
      routeId: 'route_002',
      name: 'Fallback Route',
      driverId: 'driver_2',
      authorizedDriverIds: <String>[],
      memberIds: <String>[],
      companyId: null,
      srvCode: 'ZX2Q9P',
      visibility: 'private',
      allowGuestTracking: false,
      creationMode: 'custom_mode',
      routePolyline: null,
      startPoint: RouteGeoPointModel(lat: 0, lng: 0),
      startAddress: '',
      endPoint: RouteGeoPointModel(lat: 0, lng: 0),
      endAddress: '',
      scheduledTime: '00:00',
      timeSlot: 'late_night',
      isArchived: false,
      vacationUntil: null,
      passengerCount: 0,
      lastTripStartedNotificationAt: null,
      createdAt: '2026-02-01T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z',
    );

    final entity = model.toEntity();

    expect(entity.creationMode, RouteCreationMode.unknown);
    expect(entity.timeSlot, RouteTimeSlot.unknown);
  });

  test('routeModelFromEntity serializes creationMode manual_pin', () {
    final entity = RouteEntity(
      routeId: 'route_003',
      name: 'Manual Route',
      driverId: 'driver_3',
      authorizedDriverIds: const <String>['driver_3'],
      memberIds: const <String>['driver_3'],
      companyId: null,
      srvCode: 'LM4N6P',
      visibility: RouteVisibility.privateOnly,
      allowGuestTracking: false,
      creationMode: RouteCreationMode.manualPin,
      routePolyline: null,
      startPoint: const RouteGeoPointEntity(lat: 40.7, lng: 29.9),
      startAddress: 'A',
      endPoint: const RouteGeoPointEntity(lat: 40.8, lng: 29.8),
      endAddress: 'B',
      scheduledTime: '06:30',
      timeSlot: RouteTimeSlot.custom,
      isArchived: false,
      vacationUntil: DateTime.utc(2026, 2, 20),
      passengerCount: 10,
      lastTripStartedNotificationAt: null,
      createdAt: DateTime.utc(2026, 2, 10, 7),
      updatedAt: DateTime.utc(2026, 2, 18, 7),
    );

    final model = routeModelFromEntity(entity);
    final map = model.toMap();

    expect(model.creationMode, 'manual_pin');
    expect(model.timeSlot, 'custom');
    expect(model.visibility, 'private');
    expect(map['srvCode'], 'LM4N6P');
    expect(map['vacationUntil'], '2026-02-20T00:00:00.000Z');
  });
}
