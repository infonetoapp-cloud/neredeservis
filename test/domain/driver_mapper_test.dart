import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/entities/driver_entity.dart';
import 'package:neredeservis/features/domain/mappers/driver_mapper.dart';
import 'package:neredeservis/features/domain/models/driver_model.dart';

void main() {
  test('DriverModel.fromMap + toEntity maps driver contract', () {
    final model = DriverModel.fromMap(
      <String, dynamic>{
        'name': 'Ahmet K.',
        'phone': '+905551234567',
        'plate': '34 ABC 123',
        'showPhoneToPassengers': true,
        'companyId': 'company_1',
        'subscriptionStatus': 'active',
        'trialStartDate': '2026-02-01T00:00:00.000Z',
        'trialEndsAt': '2026-02-14T00:00:00.000Z',
        'lastPaywallShownAt': '2026-02-18T10:00:00.000Z',
        'activeDeviceToken': 'device_token_1',
        'createdAt': '2026-01-01T09:00:00.000Z',
        'updatedAt': '2026-02-18T10:30:00.000Z',
      },
      driverId: 'driver_001',
    );

    final entity = model.toEntity();

    expect(entity.driverId, 'driver_001');
    expect(entity.name, 'Ahmet K.');
    expect(entity.subscriptionStatus, DriverSubscriptionStatus.active);
    expect(entity.createdAt.isUtc, isTrue);
    expect(entity.updatedAt.isUtc, isTrue);
    expect(entity.lastPaywallShownAt?.isUtc, isTrue);
  });

  test('toEntity falls back subscription status to unknown', () {
    const model = DriverModel(
      driverId: 'driver_002',
      name: 'Unknown',
      phone: '0',
      plate: '00',
      showPhoneToPassengers: false,
      companyId: null,
      subscriptionStatus: 'legacy',
      trialStartDate: null,
      trialEndsAt: null,
      lastPaywallShownAt: null,
      activeDeviceToken: null,
      createdAt: '2026-02-18T00:00:00.000Z',
      updatedAt: '2026-02-18T00:00:00.000Z',
    );

    final entity = model.toEntity();
    expect(entity.subscriptionStatus, DriverSubscriptionStatus.unknown);
  });

  test('driverModelFromEntity serializes enum and timestamps', () {
    final entity = DriverEntity(
      driverId: 'driver_003',
      name: 'Trial Driver',
      phone: '+905559999999',
      plate: '34 XYZ 321',
      showPhoneToPassengers: false,
      companyId: null,
      subscriptionStatus: DriverSubscriptionStatus.trial,
      trialStartDate: DateTime.utc(2026, 2, 1),
      trialEndsAt: DateTime.utc(2026, 2, 15),
      lastPaywallShownAt: null,
      activeDeviceToken: 'token_3',
      createdAt: DateTime.utc(2026, 2, 1, 9),
      updatedAt: DateTime.utc(2026, 2, 18, 12),
    );

    final model = driverModelFromEntity(entity);

    expect(model.driverId, 'driver_003');
    expect(model.subscriptionStatus, 'trial');
    expect(model.trialStartDate, '2026-02-01T00:00:00.000Z');
    expect(model.updatedAt, '2026-02-18T12:00:00.000Z');
    expect(model.toMap()['plate'], '34 XYZ 321');
  });
}
