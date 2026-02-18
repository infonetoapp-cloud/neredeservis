import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/domain/models/announcement_model.dart';
import 'package:neredeservis/features/domain/models/consent_model.dart';
import 'package:neredeservis/features/domain/models/driver_model.dart';
import 'package:neredeservis/features/domain/models/guest_session_model.dart';
import 'package:neredeservis/features/domain/models/local_ownership_model.dart';
import 'package:neredeservis/features/domain/models/route_model.dart';
import 'package:neredeservis/features/domain/models/trip_model.dart';
import 'package:neredeservis/features/domain/models/user_model.dart';

void main() {
  group('API contract alignment for domain data models', () {
    test('UserModel toMap keys stay aligned with UserDoc', () {
      const model = UserModel(
        uid: 'uid_1',
        role: 'driver',
        displayName: 'Driver One',
        phone: '+905551234567',
        email: 'driver@example.com',
        createdAt: '2026-02-18T00:00:00.000Z',
        updatedAt: '2026-02-18T00:00:00.000Z',
        deletedAt: null,
      );

      expect(
        model.toMap().keys.toSet(),
        equals(<String>{
          'role',
          'displayName',
          'phone',
          'email',
          'createdAt',
          'updatedAt',
          'deletedAt',
        }),
      );
    });

    test('DriverModel toMap keys stay aligned with DriverDoc', () {
      const model = DriverModel(
        driverId: 'driver_1',
        name: 'Driver One',
        phone: '+905551234567',
        plate: '34 ABC 123',
        showPhoneToPassengers: true,
        companyId: 'company_1',
        subscriptionStatus: 'trial',
        trialStartDate: '2026-02-01T00:00:00.000Z',
        trialEndsAt: '2026-02-15T00:00:00.000Z',
        lastPaywallShownAt: null,
        activeDeviceToken: null,
        createdAt: '2026-02-18T00:00:00.000Z',
        updatedAt: '2026-02-18T00:00:00.000Z',
      );

      expect(
        model.toMap().keys.toSet(),
        equals(<String>{
          'name',
          'phone',
          'plate',
          'showPhoneToPassengers',
          'companyId',
          'subscriptionStatus',
          'trialStartDate',
          'trialEndsAt',
          'lastPaywallShownAt',
          'activeDeviceToken',
          'createdAt',
          'updatedAt',
        }),
      );
    });

    test('RouteModel toMap keys stay aligned with RouteDoc', () {
      const model = RouteModel(
        routeId: 'route_1',
        name: 'Morning Route',
        driverId: 'driver_1',
        authorizedDriverIds: <String>['driver_2'],
        memberIds: <String>['driver_1', 'passenger_1'],
        companyId: null,
        srvCode: 'ABC234',
        visibility: 'private',
        allowGuestTracking: true,
        creationMode: 'manual_pin',
        routePolyline: null,
        startPoint: RouteGeoPointModel(lat: 41.0, lng: 29.0),
        startAddress: 'Start',
        endPoint: RouteGeoPointModel(lat: 41.1, lng: 29.1),
        endAddress: 'End',
        scheduledTime: '08:30',
        timeSlot: 'morning',
        isArchived: false,
        vacationUntil: null,
        passengerCount: 12,
        lastTripStartedNotificationAt: null,
        createdAt: '2026-02-18T00:00:00.000Z',
        updatedAt: '2026-02-18T00:00:00.000Z',
      );

      final map = model.toMap();
      expect(
        map.keys.toSet(),
        equals(<String>{
          'name',
          'driverId',
          'authorizedDriverIds',
          'memberIds',
          'companyId',
          'srvCode',
          'visibility',
          'allowGuestTracking',
          'creationMode',
          'routePolyline',
          'startPoint',
          'startAddress',
          'endPoint',
          'endAddress',
          'scheduledTime',
          'timeSlot',
          'isArchived',
          'vacationUntil',
          'passengerCount',
          'lastTripStartedNotificationAt',
          'createdAt',
          'updatedAt',
        }),
      );
      expect(
        (map['startPoint'] as Map<String, dynamic>).keys.toSet(),
        equals(<String>{'lat', 'lng'}),
      );
      expect(
        (map['endPoint'] as Map<String, dynamic>).keys.toSet(),
        equals(<String>{'lat', 'lng'}),
      );
    });

    test('TripModel toMap keys stay aligned with TripDoc', () {
      const model = TripModel(
        tripId: 'trip_1',
        routeId: 'route_1',
        driverId: 'driver_1',
        driverSnapshot: TripDriverSnapshotModel(
          name: 'Driver One',
          plate: '34 ABC 123',
          phone: null,
        ),
        status: 'active',
        startedAt: '2026-02-18T08:00:00.000Z',
        endedAt: null,
        lastLocationAt: '2026-02-18T08:05:00.000Z',
        endReason: null,
        startedByDeviceId: 'device_1',
        transitionVersion: 1,
        updatedAt: '2026-02-18T08:05:00.000Z',
      );

      final map = model.toMap();
      expect(
        map.keys.toSet(),
        equals(<String>{
          'routeId',
          'driverId',
          'driverSnapshot',
          'status',
          'startedAt',
          'endedAt',
          'lastLocationAt',
          'endReason',
          'startedByDeviceId',
          'transitionVersion',
          'updatedAt',
        }),
      );
      expect(
        (map['driverSnapshot'] as Map<String, dynamic>).keys.toSet(),
        equals(<String>{'name', 'plate', 'phone'}),
      );
    });

    test('AnnouncementModel toMap keys stay aligned with AnnouncementDoc', () {
      const model = AnnouncementModel(
        announcementId: 'announcement_1',
        routeId: 'route_1',
        driverId: 'driver_1',
        templateKey: 'custom',
        customText: 'Delayed 5 minutes',
        channels: <String>['fcm'],
        createdAt: '2026-02-18T08:00:00.000Z',
      );

      expect(
        model.toMap().keys.toSet(),
        equals(<String>{
          'routeId',
          'driverId',
          'templateKey',
          'customText',
          'channels',
          'createdAt',
        }),
      );
    });

    test('ConsentModel toMap keys stay aligned with ConsentDoc', () {
      const model = ConsentModel(
        uid: 'uid_1',
        privacyVersion: 'v1.0',
        kvkkTextVersion: 'v1.0',
        locationConsent: true,
        acceptedAt: '2026-02-18T08:00:00.000Z',
        platform: 'android',
      );

      expect(
        model.toMap().keys.toSet(),
        equals(<String>{
          'privacyVersion',
          'kvkkTextVersion',
          'locationConsent',
          'acceptedAt',
          'platform',
        }),
      );
    });

    test('GuestSessionModel toMap keys stay aligned with GuestSessionDoc', () {
      const withoutOwnership = GuestSessionModel(
        sessionId: 'session_1',
        routeId: 'route_1',
        guestUid: 'guest_1',
        expiresAt: '2026-02-18T09:00:00.000Z',
        status: 'active',
        createdAt: '2026-02-18T08:00:00.000Z',
        ownership: null,
      );
      expect(
        withoutOwnership.toMap().keys.toSet(),
        equals(<String>{
          'routeId',
          'guestUid',
          'expiresAt',
          'status',
          'createdAt',
        }),
      );

      const withOwnership = GuestSessionModel(
        sessionId: 'session_2',
        routeId: 'route_2',
        guestUid: 'guest_2',
        expiresAt: '2026-02-18T09:00:00.000Z',
        status: 'active',
        createdAt: '2026-02-18T08:00:00.000Z',
        ownership: LocalOwnershipModel(
          ownerUid: 'guest_2',
          previousOwnerUid: 'anon_2',
          migratedAt: '2026-02-18T08:30:00.000Z',
        ),
      );
      expect(
        withOwnership.toMap().keys.toSet(),
        equals(<String>{
          'routeId',
          'guestUid',
          'expiresAt',
          'status',
          'createdAt',
          'ownerUid',
          'previousOwnerUid',
          'migratedAt',
        }),
      );
    });
  });
}
