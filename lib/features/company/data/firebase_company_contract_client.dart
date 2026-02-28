import 'package:cloud_functions/cloud_functions.dart';

import '../domain/company_contract_models.dart';
import 'company_contract_parser.dart';

class FirebaseCompanyContractClient {
  FirebaseCompanyContractClient({
    required FirebaseFunctions functions,
  }) : _functions = functions;

  final FirebaseFunctions _functions;

  Future<CreateCompanyResponse> createCompany({
    required String name,
    String? contactEmail,
    String? contactPhone,
  }) async {
    const callableName = 'createCompany';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'name': name,
      if ((contactEmail ?? '').trim().isNotEmpty) 'contactEmail': contactEmail,
      if ((contactPhone ?? '').trim().isNotEmpty) 'contactPhone': contactPhone,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    final ownerMember = parseCallableMap(
      payload['ownerMember'],
      callable: callableName,
    );
    return CreateCompanyResponse(
      companyId:
          parseRequiredString(payload, 'companyId', callable: callableName),
      createdAt:
          parseRequiredString(payload, 'createdAt', callable: callableName),
      ownerUid: parseRequiredString(ownerMember, 'uid', callable: callableName),
    );
  }

  Future<List<CompanyMembershipSummary>> listMyCompanies() async {
    const callableName = 'listMyCompanies';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{});
    final payload = parseCallableMap(response.data, callable: callableName);
    final itemsRaw =
        parseRequiredList(payload, 'items', callable: callableName);
    return itemsRaw.map((item) {
      final itemMap = parseCallableMap(item, callable: callableName);
      return CompanyMembershipSummary(
        companyId:
            parseRequiredString(itemMap, 'companyId', callable: callableName),
        name: parseRequiredString(itemMap, 'name', callable: callableName),
        role: parseRequiredString(itemMap, 'role', callable: callableName),
        memberStatus: parseRequiredString(itemMap, 'memberStatus',
            callable: callableName),
      );
    }).toList(growable: false);
  }

  Future<List<CompanyMemberSummary>> listCompanyMembers({
    required String companyId,
  }) async {
    const callableName = 'listCompanyMembers';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'companyId': companyId,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    final itemsRaw =
        parseRequiredList(payload, 'items', callable: callableName);
    return itemsRaw.map((item) {
      final itemMap = parseCallableMap(item, callable: callableName);
      return CompanyMemberSummary(
        uid: parseRequiredString(itemMap, 'uid', callable: callableName),
        displayName:
            parseRequiredString(itemMap, 'displayName', callable: callableName),
        email: parseOptionalString(itemMap, 'email'),
        phone: parseOptionalString(itemMap, 'phone'),
        role: parseRequiredString(itemMap, 'role', callable: callableName),
        memberStatus: parseRequiredString(itemMap, 'memberStatus',
            callable: callableName),
        companyId:
            parseRequiredString(itemMap, 'companyId', callable: callableName),
      );
    }).toList(growable: false);
  }

  Future<List<CompanyRouteSummary>> listCompanyRoutes({
    required String companyId,
    bool includeArchived = false,
    int limit = 50,
  }) async {
    const callableName = 'listCompanyRoutes';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'companyId': companyId,
      'includeArchived': includeArchived,
      'limit': limit,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    final itemsRaw =
        parseRequiredList(payload, 'items', callable: callableName);
    return itemsRaw.map((item) {
      final itemMap = parseCallableMap(item, callable: callableName);
      final authorizedRaw = parseRequiredList(
        itemMap,
        'authorizedDriverIds',
        callable: callableName,
      );
      return CompanyRouteSummary(
        routeId:
            parseRequiredString(itemMap, 'routeId', callable: callableName),
        companyId:
            parseRequiredString(itemMap, 'companyId', callable: callableName),
        name: parseRequiredString(itemMap, 'name', callable: callableName),
        srvCode: parseOptionalString(itemMap, 'srvCode'),
        driverId: parseOptionalString(itemMap, 'driverId'),
        authorizedDriverIds: authorizedRaw
            .whereType<String>()
            .map((item) => item.trim())
            .where((item) => item.isNotEmpty)
            .toList(growable: false),
        scheduledTime: parseOptionalString(itemMap, 'scheduledTime'),
        timeSlot: parseOptionalString(itemMap, 'timeSlot'),
        isArchived:
            parseRequiredBool(itemMap, 'isArchived', callable: callableName),
        allowGuestTracking: parseRequiredBool(
          itemMap,
          'allowGuestTracking',
          callable: callableName,
        ),
        passengerCount: parseOptionalInt(itemMap, 'passengerCount'),
        updatedAt: parseOptionalString(itemMap, 'updatedAt'),
      );
    }).toList(growable: false);
  }

  Future<List<CompanyVehicleSummary>> listCompanyVehicles({
    required String companyId,
    int limit = 50,
  }) async {
    const callableName = 'listCompanyVehicles';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'companyId': companyId,
      'limit': limit,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    final itemsRaw =
        parseRequiredList(payload, 'items', callable: callableName);
    return itemsRaw.map((item) {
      final itemMap = parseCallableMap(item, callable: callableName);
      return CompanyVehicleSummary(
        vehicleId:
            parseRequiredString(itemMap, 'vehicleId', callable: callableName),
        companyId:
            parseRequiredString(itemMap, 'companyId', callable: callableName),
        plate: parseRequiredString(itemMap, 'plate', callable: callableName),
        status: parseRequiredString(itemMap, 'status', callable: callableName),
        brand: parseOptionalString(itemMap, 'brand'),
        model: parseOptionalString(itemMap, 'model'),
        year: parseOptionalInt(itemMap, 'year'),
        capacity: parseOptionalInt(itemMap, 'capacity'),
        updatedAt: parseOptionalString(itemMap, 'updatedAt'),
      );
    }).toList(growable: false);
  }

  Future<CreateVehicleResponse> createVehicle({
    required String companyId,
    required String plate,
    String? brand,
    String? model,
    int? year,
    int? capacity,
    String? status,
  }) async {
    const callableName = 'createVehicle';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'ownerType': 'company',
      'companyId': companyId,
      'plate': plate,
      if ((brand ?? '').trim().isNotEmpty) 'brand': brand,
      if ((model ?? '').trim().isNotEmpty) 'model': model,
      if (year != null) 'year': year,
      if (capacity != null) 'capacity': capacity,
      if ((status ?? '').trim().isNotEmpty) 'status': status,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    return CreateVehicleResponse(
      vehicleId:
          parseRequiredString(payload, 'vehicleId', callable: callableName),
      createdAt:
          parseRequiredString(payload, 'createdAt', callable: callableName),
    );
  }

  Future<UpdateVehicleResponse> updateVehicle({
    required String companyId,
    required String vehicleId,
    required Map<String, dynamic> patch,
  }) async {
    const callableName = 'updateVehicle';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'companyId': companyId,
      'vehicleId': vehicleId,
      'patch': patch,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    return UpdateVehicleResponse(
      vehicleId:
          parseRequiredString(payload, 'vehicleId', callable: callableName),
      updatedAt:
          parseRequiredString(payload, 'updatedAt', callable: callableName),
    );
  }

  Future<UpdateCompanyMemberResponse> updateCompanyMember({
    required String companyId,
    required String memberUid,
    required Map<String, dynamic> patch,
  }) async {
    const callableName = 'updateCompanyMember';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'companyId': companyId,
      'memberUid': memberUid,
      'patch': patch,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    return UpdateCompanyMemberResponse(
      companyId:
          parseRequiredString(payload, 'companyId', callable: callableName),
      memberUid:
          parseRequiredString(payload, 'memberUid', callable: callableName),
      role: parseRequiredString(payload, 'role', callable: callableName),
      memberStatus:
          parseRequiredString(payload, 'memberStatus', callable: callableName),
      updatedAt:
          parseRequiredString(payload, 'updatedAt', callable: callableName),
    );
  }

  Future<InviteCompanyMemberResponse> inviteCompanyMember({
    required String companyId,
    required String email,
    required String role,
  }) async {
    const callableName = 'inviteCompanyMember';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'companyId': companyId,
      'email': email,
      'role': role,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    return InviteCompanyMemberResponse(
      companyId:
          parseRequiredString(payload, 'companyId', callable: callableName),
      inviteId:
          parseRequiredString(payload, 'inviteId', callable: callableName),
      memberUid:
          parseRequiredString(payload, 'memberUid', callable: callableName),
      invitedEmail:
          parseRequiredString(payload, 'invitedEmail', callable: callableName),
      role: parseRequiredString(payload, 'role', callable: callableName),
      status: parseRequiredString(payload, 'status', callable: callableName),
      expiresAt:
          parseRequiredString(payload, 'expiresAt', callable: callableName),
      createdAt:
          parseRequiredString(payload, 'createdAt', callable: callableName),
    );
  }

  Future<AcceptCompanyInviteResponse> acceptCompanyInvite({
    required String companyId,
  }) async {
    const callableName = 'acceptCompanyInvite';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'companyId': companyId,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    return AcceptCompanyInviteResponse(
      companyId:
          parseRequiredString(payload, 'companyId', callable: callableName),
      memberUid:
          parseRequiredString(payload, 'memberUid', callable: callableName),
      role: parseRequiredString(payload, 'role', callable: callableName),
      memberStatus:
          parseRequiredString(payload, 'memberStatus', callable: callableName),
      acceptedAt:
          parseRequiredString(payload, 'acceptedAt', callable: callableName),
    );
  }

  Future<DeclineCompanyInviteResponse> declineCompanyInvite({
    required String companyId,
  }) async {
    const callableName = 'declineCompanyInvite';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'companyId': companyId,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    return DeclineCompanyInviteResponse(
      companyId:
          parseRequiredString(payload, 'companyId', callable: callableName),
      memberUid:
          parseRequiredString(payload, 'memberUid', callable: callableName),
      role: parseRequiredString(payload, 'role', callable: callableName),
      memberStatus:
          parseRequiredString(payload, 'memberStatus', callable: callableName),
      declinedAt:
          parseRequiredString(payload, 'declinedAt', callable: callableName),
    );
  }

  Future<RemoveCompanyMemberResponse> removeCompanyMember({
    required String companyId,
    required String memberUid,
  }) async {
    const callableName = 'removeCompanyMember';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'companyId': companyId,
      'memberUid': memberUid,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    return RemoveCompanyMemberResponse(
      companyId:
          parseRequiredString(payload, 'companyId', callable: callableName),
      memberUid:
          parseRequiredString(payload, 'memberUid', callable: callableName),
      removedRole:
          parseRequiredString(payload, 'removedRole', callable: callableName),
      removedMemberStatus: parseRequiredString(
        payload,
        'removedMemberStatus',
        callable: callableName,
      ),
      removed: parseRequiredBool(payload, 'removed', callable: callableName),
      removedAt:
          parseRequiredString(payload, 'removedAt', callable: callableName),
    );
  }

  Future<CreateCompanyRouteResponse> createCompanyRoute({
    required String companyId,
    required String name,
    required Map<String, double> startPoint,
    required String startAddress,
    required Map<String, double> endPoint,
    required String endAddress,
    required String scheduledTime,
    required String timeSlot,
    required bool allowGuestTracking,
    List<String>? authorizedDriverIds,
  }) async {
    const callableName = 'createCompanyRoute';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'companyId': companyId,
      'name': name,
      'startPoint': startPoint,
      'startAddress': startAddress,
      'endPoint': endPoint,
      'endAddress': endAddress,
      'scheduledTime': scheduledTime,
      'timeSlot': timeSlot,
      'allowGuestTracking': allowGuestTracking,
      if (authorizedDriverIds != null)
        'authorizedDriverIds': authorizedDriverIds,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    return CreateCompanyRouteResponse(
      routeId: parseRequiredString(payload, 'routeId', callable: callableName),
      srvCode: parseRequiredString(payload, 'srvCode', callable: callableName),
    );
  }

  Future<UpdateCompanyRouteResponse> updateCompanyRoute({
    required String companyId,
    required String routeId,
    required Map<String, dynamic> patch,
    String? lastKnownUpdateToken,
  }) async {
    const callableName = 'updateCompanyRoute';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'companyId': companyId,
      'routeId': routeId,
      'patch': patch,
      if ((lastKnownUpdateToken ?? '').trim().isNotEmpty)
        'lastKnownUpdateToken': lastKnownUpdateToken,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    return UpdateCompanyRouteResponse(
      routeId: parseRequiredString(payload, 'routeId', callable: callableName),
      updatedAt:
          parseRequiredString(payload, 'updatedAt', callable: callableName),
    );
  }

  Future<List<CompanyRouteStopSummary>> listCompanyRouteStops({
    required String companyId,
    required String routeId,
  }) async {
    const callableName = 'listCompanyRouteStops';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'companyId': companyId,
      'routeId': routeId,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    final itemsRaw =
        parseRequiredList(payload, 'items', callable: callableName);
    return itemsRaw.map((item) {
      final itemMap = parseCallableMap(item, callable: callableName);
      final location =
          parseCallableMap(itemMap['location'], callable: callableName);
      return CompanyRouteStopSummary(
        stopId: parseRequiredString(itemMap, 'stopId', callable: callableName),
        routeId:
            parseRequiredString(itemMap, 'routeId', callable: callableName),
        companyId:
            parseRequiredString(itemMap, 'companyId', callable: callableName),
        name: parseRequiredString(itemMap, 'name', callable: callableName),
        lat: parseOptionalDouble(location, 'lat') ?? 0,
        lng: parseOptionalDouble(location, 'lng') ?? 0,
        order: parseOptionalInt(itemMap, 'order'),
        createdAt: parseOptionalString(itemMap, 'createdAt'),
        updatedAt: parseOptionalString(itemMap, 'updatedAt'),
      );
    }).toList(growable: false);
  }

  Future<UpsertCompanyRouteStopResponse> upsertCompanyRouteStop({
    required String companyId,
    required String routeId,
    String? stopId,
    required String name,
    required int order,
    required Map<String, double> location,
    String? lastKnownUpdateToken,
  }) async {
    const callableName = 'upsertCompanyRouteStop';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'companyId': companyId,
      'routeId': routeId,
      if ((stopId ?? '').trim().isNotEmpty) 'stopId': stopId,
      'name': name,
      'order': order,
      'location': location,
      if ((lastKnownUpdateToken ?? '').trim().isNotEmpty)
        'lastKnownUpdateToken': lastKnownUpdateToken,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    return UpsertCompanyRouteStopResponse(
      companyId:
          parseRequiredString(payload, 'companyId', callable: callableName),
      routeId: parseRequiredString(payload, 'routeId', callable: callableName),
      stopId: parseRequiredString(payload, 'stopId', callable: callableName),
      updatedAt:
          parseRequiredString(payload, 'updatedAt', callable: callableName),
    );
  }

  Future<DeleteCompanyRouteStopResponse> deleteCompanyRouteStop({
    required String companyId,
    required String routeId,
    required String stopId,
    String? lastKnownUpdateToken,
  }) async {
    const callableName = 'deleteCompanyRouteStop';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'companyId': companyId,
      'routeId': routeId,
      'stopId': stopId,
      if ((lastKnownUpdateToken ?? '').trim().isNotEmpty)
        'lastKnownUpdateToken': lastKnownUpdateToken,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    return DeleteCompanyRouteStopResponse(
      routeId: parseRequiredString(payload, 'routeId', callable: callableName),
      stopId: parseRequiredString(payload, 'stopId', callable: callableName),
      deleted: parseRequiredBool(payload, 'deleted', callable: callableName),
    );
  }

  Future<ReorderCompanyRouteStopsResponse> reorderCompanyRouteStops({
    required String companyId,
    required String routeId,
    required String stopId,
    required String direction,
    String? lastKnownUpdateToken,
  }) async {
    const callableName = 'reorderCompanyRouteStops';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'companyId': companyId,
      'routeId': routeId,
      'stopId': stopId,
      'direction': direction,
      if ((lastKnownUpdateToken ?? '').trim().isNotEmpty)
        'lastKnownUpdateToken': lastKnownUpdateToken,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    return ReorderCompanyRouteStopsResponse(
      routeId: parseRequiredString(payload, 'routeId', callable: callableName),
      updatedAt:
          parseRequiredString(payload, 'updatedAt', callable: callableName),
      changed: parseRequiredBool(payload, 'changed', callable: callableName),
    );
  }

  Future<List<CompanyActiveTripSummary>> listActiveTripsByCompany({
    required String companyId,
    String? routeId,
    String? driverUid,
    int pageSize = 50,
  }) async {
    const callableName = 'listActiveTripsByCompany';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'companyId': companyId,
      if ((routeId ?? '').trim().isNotEmpty) 'routeId': routeId,
      if ((driverUid ?? '').trim().isNotEmpty) 'driverUid': driverUid,
      'pageSize': pageSize,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    final itemsRaw =
        parseRequiredList(payload, 'items', callable: callableName);
    return itemsRaw.map((item) {
      final itemMap = parseCallableMap(item, callable: callableName);
      final liveMap = parseCallableMap(itemMap['live'], callable: callableName);
      return CompanyActiveTripSummary(
        tripId: parseRequiredString(itemMap, 'tripId', callable: callableName),
        routeId:
            parseRequiredString(itemMap, 'routeId', callable: callableName),
        routeName:
            parseRequiredString(itemMap, 'routeName', callable: callableName),
        driverUid:
            parseRequiredString(itemMap, 'driverUid', callable: callableName),
        driverName:
            parseRequiredString(itemMap, 'driverName', callable: callableName),
        driverPlate: parseOptionalString(itemMap, 'driverPlate'),
        status: parseRequiredString(itemMap, 'status', callable: callableName),
        startedAt: parseOptionalString(itemMap, 'startedAt'),
        lastLocationAt: parseOptionalString(itemMap, 'lastLocationAt'),
        updatedAt: parseOptionalString(itemMap, 'updatedAt'),
        liveState:
            parseRequiredString(itemMap, 'liveState', callable: callableName),
        liveSource:
            parseRequiredString(liveMap, 'source', callable: callableName),
        liveLat: parseOptionalDouble(liveMap, 'lat'),
        liveLng: parseOptionalDouble(liveMap, 'lng'),
        liveStale: parseRequiredBool(liveMap, 'stale', callable: callableName),
      );
    }).toList(growable: false);
  }

  Future<GrantDriverRoutePermissionsResponse> grantDriverRoutePermissions({
    required String companyId,
    required String routeId,
    required String driverUid,
    required RouteDriverPermissionFlags permissions,
    String? idempotencyKey,
  }) async {
    const callableName = 'grantDriverRoutePermissions';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'companyId': companyId,
      'routeId': routeId,
      'driverUid': driverUid,
      'permissions': permissions.toJson(),
      if ((idempotencyKey ?? '').trim().isNotEmpty)
        'idempotencyKey': idempotencyKey,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    return GrantDriverRoutePermissionsResponse(
      routeId: parseRequiredString(payload, 'routeId', callable: callableName),
      driverUid:
          parseRequiredString(payload, 'driverUid', callable: callableName),
      permissions: _parseRouteDriverPermissionFlags(
        payload['permissions'],
        callable: callableName,
      ),
      updatedAt:
          parseRequiredString(payload, 'updatedAt', callable: callableName),
    );
  }

  Future<RevokeDriverRoutePermissionsResponse> revokeDriverRoutePermissions({
    required String companyId,
    required String routeId,
    required String driverUid,
    List<String>? permissionKeys,
    bool resetToDefault = false,
    String? idempotencyKey,
  }) async {
    const callableName = 'revokeDriverRoutePermissions';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'companyId': companyId,
      'routeId': routeId,
      'driverUid': driverUid,
      'permissionKeys': (permissionKeys ?? <String>[]),
      'resetToDefault': resetToDefault,
      if ((idempotencyKey ?? '').trim().isNotEmpty)
        'idempotencyKey': idempotencyKey,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    return RevokeDriverRoutePermissionsResponse(
      routeId: parseRequiredString(payload, 'routeId', callable: callableName),
      driverUid:
          parseRequiredString(payload, 'driverUid', callable: callableName),
      updatedAt:
          parseRequiredString(payload, 'updatedAt', callable: callableName),
    );
  }

  Future<List<RouteDriverPermissionSummary>> listRouteDriverPermissions({
    required String companyId,
    required String routeId,
  }) async {
    const callableName = 'listRouteDriverPermissions';
    final callable = _functions.httpsCallable(callableName);
    final response = await callable.call(<String, dynamic>{
      'companyId': companyId,
      'routeId': routeId,
    });
    final payload = parseCallableMap(response.data, callable: callableName);
    final itemsRaw =
        parseRequiredList(payload, 'items', callable: callableName);
    return itemsRaw.map((item) {
      final itemMap = parseCallableMap(item, callable: callableName);
      return RouteDriverPermissionSummary(
        routeId:
            parseRequiredString(itemMap, 'routeId', callable: callableName),
        driverUid:
            parseRequiredString(itemMap, 'driverUid', callable: callableName),
        permissions: _parseRouteDriverPermissionFlags(
          itemMap['permissions'],
          callable: callableName,
        ),
        updatedAt: parseOptionalString(itemMap, 'updatedAt'),
      );
    }).toList(growable: false);
  }

  RouteDriverPermissionFlags _parseRouteDriverPermissionFlags(
    Object? raw, {
    required String callable,
  }) {
    final payload = parseCallableMap(raw, callable: callable);
    return RouteDriverPermissionFlags(
      canStartFinishTrip: parseRequiredBool(
        payload,
        'canStartFinishTrip',
        callable: callable,
      ),
      canSendAnnouncements: parseRequiredBool(
        payload,
        'canSendAnnouncements',
        callable: callable,
      ),
      canViewPassengerList: parseRequiredBool(
        payload,
        'canViewPassengerList',
        callable: callable,
      ),
      canEditAssignedRouteMeta: parseRequiredBool(
        payload,
        'canEditAssignedRouteMeta',
        callable: callable,
      ),
      canEditStops: parseRequiredBool(
        payload,
        'canEditStops',
        callable: callable,
      ),
      canManageRouteSchedule: parseRequiredBool(
        payload,
        'canManageRouteSchedule',
        callable: callable,
      ),
    );
  }
}
