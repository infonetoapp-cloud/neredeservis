import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/company/data/company_contract_parser.dart';

void main() {
  group('CompanyContractParser smoke', () {
    test('accepts both dynamic and object keyed maps', () {
      final dynamicMap = parseCallableMap(
        <String, dynamic>{'companyId': 'cmp_1'},
        callable: 'createCompany',
      );
      final objectMap = parseCallableMap(
        <Object?, Object?>{'companyId': 'cmp_2'},
        callable: 'createCompany',
      );

      expect(dynamicMap['companyId'], 'cmp_1');
      expect(objectMap['companyId'], 'cmp_2');
    });

    test('throws contract exception for invalid payload shape', () {
      expect(
        () => parseCallableMap(
          'invalid_payload',
          callable: 'createCompany',
        ),
        throwsA(isA<CompanyCallableContractException>()),
      );
    });

    test('parses representative callable payloads crash-free', () {
      expect(
        () {
          final createCompanyPayload = parseCallableMap(
            <String, dynamic>{
              'companyId': 'cmp_1',
              'createdAt': '2026-02-27T20:00:00.000Z',
              'ownerMember': <String, dynamic>{'uid': 'owner_1'},
            },
            callable: 'createCompany',
          );
          final ownerMember = parseCallableMap(
            createCompanyPayload['ownerMember'],
            callable: 'createCompany',
          );
          parseRequiredString(
            createCompanyPayload,
            'companyId',
            callable: 'createCompany',
          );
          parseRequiredString(
            createCompanyPayload,
            'createdAt',
            callable: 'createCompany',
          );
          parseRequiredString(ownerMember, 'uid', callable: 'createCompany');

          final listCompaniesPayload = parseCallableMap(
            <String, dynamic>{
              'items': <dynamic>[
                <String, dynamic>{
                  'companyId': 'cmp_1',
                  'name': 'NeredeServis',
                  'role': 'owner',
                  'memberStatus': 'active',
                },
              ],
            },
            callable: 'listMyCompanies',
          );
          final companyItems = parseRequiredList(
            listCompaniesPayload,
            'items',
            callable: 'listMyCompanies',
          );
          final companyItem = parseCallableMap(
            companyItems.first,
            callable: 'listMyCompanies',
          );
          parseRequiredString(
            companyItem,
            'memberStatus',
            callable: 'listMyCompanies',
          );

          final listRoutesPayload = parseCallableMap(
            <String, dynamic>{
              'items': <dynamic>[
                <String, dynamic>{
                  'routeId': 'route_1',
                  'companyId': 'cmp_1',
                  'name': 'Sabah Servisi',
                  'srvCode': 'SRV-1001',
                  'driverId': 'driver_1',
                  'authorizedDriverIds': <dynamic>['driver_1'],
                  'scheduledTime': '08:00',
                  'timeSlot': 'morning',
                  'isArchived': false,
                  'allowGuestTracking': true,
                  'passengerCount': 24,
                  'updatedAt': '2026-02-27T20:00:00.000Z',
                },
              ],
            },
            callable: 'listCompanyRoutes',
          );
          final routeItems = parseRequiredList(
            listRoutesPayload,
            'items',
            callable: 'listCompanyRoutes',
          );
          final routeItem = parseCallableMap(
            routeItems.first,
            callable: 'listCompanyRoutes',
          );
          parseRequiredList(
            routeItem,
            'authorizedDriverIds',
            callable: 'listCompanyRoutes',
          );
          parseRequiredBool(
            routeItem,
            'allowGuestTracking',
            callable: 'listCompanyRoutes',
          );

          final listVehiclesPayload = parseCallableMap(
            <String, dynamic>{
              'items': <dynamic>[
                <String, dynamic>{
                  'vehicleId': 'veh_1',
                  'companyId': 'cmp_1',
                  'plate': '34 ABC 123',
                  'status': 'active',
                  'brand': 'Ford',
                  'model': 'Transit',
                  'year': 2023,
                  'capacity': 16,
                  'updatedAt': '2026-02-27T20:00:00.000Z',
                },
              ],
            },
            callable: 'listCompanyVehicles',
          );
          final vehicleItems = parseRequiredList(
            listVehiclesPayload,
            'items',
            callable: 'listCompanyVehicles',
          );
          final vehicleItem = parseCallableMap(
            vehicleItems.first,
            callable: 'listCompanyVehicles',
          );
          parseRequiredString(vehicleItem, 'plate', callable: 'listCompanyVehicles');
          parseOptionalInt(vehicleItem, 'year');

          final listStopsPayload = parseCallableMap(
            <String, dynamic>{
              'items': <dynamic>[
                <String, dynamic>{
                  'stopId': 'stop_1',
                  'routeId': 'route_1',
                  'companyId': 'cmp_1',
                  'name': 'Durak 1',
                  'location': <String, dynamic>{'lat': 41.0, 'lng': 29.0},
                  'order': 1,
                  'createdAt': '2026-02-27T20:00:00.000Z',
                  'updatedAt': '2026-02-27T20:00:00.000Z',
                },
              ],
            },
            callable: 'listCompanyRouteStops',
          );
          final stopItems = parseRequiredList(
            listStopsPayload,
            'items',
            callable: 'listCompanyRouteStops',
          );
          final stopItem = parseCallableMap(
            stopItems.first,
            callable: 'listCompanyRouteStops',
          );
          final location = parseCallableMap(
            stopItem['location'],
            callable: 'listCompanyRouteStops',
          );
          parseOptionalDouble(location, 'lat');
          parseOptionalDouble(location, 'lng');

          final listTripsPayload = parseCallableMap(
            <String, dynamic>{
              'items': <dynamic>[
                <String, dynamic>{
                  'tripId': 'trip_1',
                  'routeId': 'route_1',
                  'routeName': 'Sabah Servisi',
                  'driverUid': 'driver_1',
                  'driverName': 'Sofor 1',
                  'driverPlate': '34 ABC 123',
                  'status': 'active',
                  'startedAt': '2026-02-27T20:00:00.000Z',
                  'lastLocationAt': '2026-02-27T20:05:00.000Z',
                  'updatedAt': '2026-02-27T20:05:00.000Z',
                  'liveState': 'online',
                  'live': <String, dynamic>{
                    'source': 'rtdb',
                    'lat': 41.0,
                    'lng': 29.0,
                    'stale': false,
                  },
                },
              ],
            },
            callable: 'listActiveTripsByCompany',
          );
          final tripItems = parseRequiredList(
            listTripsPayload,
            'items',
            callable: 'listActiveTripsByCompany',
          );
          final tripItem = parseCallableMap(
            tripItems.first,
            callable: 'listActiveTripsByCompany',
          );
          final live = parseCallableMap(
            tripItem['live'],
            callable: 'listActiveTripsByCompany',
          );
          parseRequiredString(
            tripItem,
            'liveState',
            callable: 'listActiveTripsByCompany',
          );
          parseRequiredString(
            live,
            'source',
            callable: 'listActiveTripsByCompany',
          );
          parseRequiredBool(live, 'stale', callable: 'listActiveTripsByCompany');

          final permissionPayload = parseCallableMap(
            <String, dynamic>{
              'routeId': 'route_1',
              'driverUid': 'driver_1',
              'updatedAt': '2026-02-27T20:00:00.000Z',
              'permissions': <String, dynamic>{
                'canStartFinishTrip': true,
                'canSendAnnouncements': true,
                'canViewPassengerList': true,
                'canEditAssignedRouteMeta': false,
                'canEditStops': false,
                'canManageRouteSchedule': false,
              },
            },
            callable: 'grantDriverRoutePermissions',
          );
          final permissions = parseCallableMap(
            permissionPayload['permissions'],
            callable: 'grantDriverRoutePermissions',
          );
          parseRequiredBool(
            permissions,
            'canStartFinishTrip',
            callable: 'grantDriverRoutePermissions',
          );

          final invitePayload = parseCallableMap(
            <String, dynamic>{
              'companyId': 'cmp_1',
              'inviteId': 'inv_1',
              'memberUid': 'uid_1',
              'invitedEmail': 'test@example.com',
              'role': 'dispatcher',
              'status': 'invited',
              'expiresAt': '2026-03-01T00:00:00.000Z',
              'createdAt': '2026-02-27T20:00:00.000Z',
            },
            callable: 'inviteCompanyMember',
          );
          parseRequiredString(
            invitePayload,
            'status',
            callable: 'inviteCompanyMember',
          );

          final acceptInvitePayload = parseCallableMap(
            <String, dynamic>{
              'companyId': 'cmp_1',
              'memberUid': 'uid_1',
              'role': 'dispatcher',
              'memberStatus': 'active',
              'acceptedAt': '2026-02-27T20:01:00.000Z',
            },
            callable: 'acceptCompanyInvite',
          );
          parseRequiredString(
            acceptInvitePayload,
            'memberStatus',
            callable: 'acceptCompanyInvite',
          );

          final declineInvitePayload = parseCallableMap(
            <String, dynamic>{
              'companyId': 'cmp_1',
              'memberUid': 'uid_1',
              'role': 'dispatcher',
              'memberStatus': 'suspended',
              'declinedAt': '2026-02-27T20:01:00.000Z',
            },
            callable: 'declineCompanyInvite',
          );
          parseRequiredString(
            declineInvitePayload,
            'memberStatus',
            callable: 'declineCompanyInvite',
          );

          final removeMemberPayload = parseCallableMap(
            <String, dynamic>{
              'companyId': 'cmp_1',
              'memberUid': 'uid_2',
              'removedRole': 'viewer',
              'removedMemberStatus': 'suspended',
              'removed': true,
              'removedAt': '2026-02-27T20:01:00.000Z',
            },
            callable: 'removeCompanyMember',
          );
          parseRequiredBool(
            removeMemberPayload,
            'removed',
            callable: 'removeCompanyMember',
          );
        },
        returnsNormally,
      );
    });
  });
}
