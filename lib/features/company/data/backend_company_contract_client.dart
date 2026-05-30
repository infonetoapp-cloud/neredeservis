import '../../backend/data/mobile_backend_api_client.dart';
import '../domain/company_contract_models.dart';
import 'company_contract_parser.dart';

class BackendCompanyContractClient {
  BackendCompanyContractClient({
    MobileBackendApiClient? apiClient,
  }) : _apiClient = apiClient ?? MobileBackendApiClient();

  final MobileBackendApiClient _apiClient;

  Future<CreateCompanyResponse> createCompany({
    required String name,
    String? contactEmail,
    String? contactPhone,
  }) async {
    const endpoint = 'POST /api/my/companies';
    final payload = await _apiClient.postJson(
      '/api/my/companies',
      body: <String, dynamic>{
        'name': name,
        if ((contactEmail ?? '').trim().isNotEmpty)
          'contactEmail': contactEmail,
        if ((contactPhone ?? '').trim().isNotEmpty)
          'contactPhone': contactPhone,
      },
    );
    final ownerMember = parseCallableMap(
      payload['ownerMember'],
      callable: endpoint,
    );
    return CreateCompanyResponse(
      companyId: parseRequiredString(payload, 'companyId', callable: endpoint),
      createdAt: parseRequiredString(payload, 'createdAt', callable: endpoint),
      ownerUid: parseRequiredString(ownerMember, 'uid', callable: endpoint),
    );
  }

  Future<List<CompanyMembershipSummary>> listMyCompanies() async {
    const endpoint = 'GET /api/my/companies';
    final payload = await _apiClient.getJson('/api/my/companies');
    final itemsRaw = parseRequiredList(payload, 'items', callable: endpoint);
    return itemsRaw.map((item) {
      final itemMap = parseCallableMap(item, callable: endpoint);
      return CompanyMembershipSummary(
        companyId:
            parseRequiredString(itemMap, 'companyId', callable: endpoint),
        name: parseRequiredString(itemMap, 'name', callable: endpoint),
        role: parseRequiredString(itemMap, 'role', callable: endpoint),
        memberStatus:
            parseRequiredString(itemMap, 'memberStatus', callable: endpoint),
      );
    }).toList(growable: false);
  }

  Future<List<CompanyMemberSummary>> listCompanyMembers({
    required String companyId,
  }) async {
    final endpoint = 'GET /api/companies/$companyId/members';
    final payload =
        await _apiClient.getJson('/api/companies/$companyId/members');
    final itemsRaw = parseRequiredList(payload, 'items', callable: endpoint);
    return itemsRaw.map((item) {
      final itemMap = parseCallableMap(item, callable: endpoint);
      return CompanyMemberSummary(
        uid: parseRequiredString(itemMap, 'uid', callable: endpoint),
        displayName: parseRequiredString(
          itemMap,
          'displayName',
          callable: endpoint,
        ),
        email: parseOptionalString(itemMap, 'email'),
        phone: parseOptionalString(itemMap, 'phone'),
        role: parseRequiredString(itemMap, 'role', callable: endpoint),
        memberStatus:
            parseRequiredString(itemMap, 'memberStatus', callable: endpoint),
        companyId:
            parseRequiredString(itemMap, 'companyId', callable: endpoint),
      );
    }).toList(growable: false);
  }

  Future<List<CompanyRouteSummary>> listCompanyRoutes({
    required String companyId,
    bool includeArchived = false,
    int limit = 50,
  }) async {
    final endpoint = 'GET /api/companies/$companyId/routes';
    final payload = await _apiClient.getJson(
      '/api/companies/$companyId/routes',
      queryParameters: <String, dynamic>{
        'includeArchived': includeArchived,
        'limit': limit,
      },
    );
    final itemsRaw = parseRequiredList(payload, 'items', callable: endpoint);
    return itemsRaw.map((item) {
      final itemMap = parseCallableMap(item, callable: endpoint);
      final authorizedRaw = parseRequiredList(
        itemMap,
        'authorizedDriverIds',
        callable: endpoint,
      );
      return CompanyRouteSummary(
        routeId: parseRequiredString(itemMap, 'routeId', callable: endpoint),
        companyId:
            parseRequiredString(itemMap, 'companyId', callable: endpoint),
        name: parseRequiredString(itemMap, 'name', callable: endpoint),
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
            parseRequiredBool(itemMap, 'isArchived', callable: endpoint),
        allowGuestTracking: parseRequiredBool(
          itemMap,
          'allowGuestTracking',
          callable: endpoint,
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
    final endpoint = 'GET /api/companies/$companyId/vehicles';
    final payload = await _apiClient.getJson(
      '/api/companies/$companyId/vehicles',
      queryParameters: <String, dynamic>{
        'limit': limit,
      },
    );
    final itemsRaw = parseRequiredList(payload, 'items', callable: endpoint);
    return itemsRaw.map((item) {
      final itemMap = parseCallableMap(item, callable: endpoint);
      return CompanyVehicleSummary(
        vehicleId:
            parseRequiredString(itemMap, 'vehicleId', callable: endpoint),
        companyId:
            parseRequiredString(itemMap, 'companyId', callable: endpoint),
        plate: parseRequiredString(itemMap, 'plate', callable: endpoint),
        status: parseRequiredString(itemMap, 'status', callable: endpoint),
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
    final endpoint = 'POST /api/companies/$companyId/vehicles';
    final payload = await _apiClient.postJson(
      '/api/companies/$companyId/vehicles',
      body: <String, dynamic>{
        'ownerType': 'company',
        'plate': plate,
        if ((brand ?? '').trim().isNotEmpty) 'brand': brand,
        if ((model ?? '').trim().isNotEmpty) 'model': model,
        if (year != null) 'year': year,
        if (capacity != null) 'capacity': capacity,
        if ((status ?? '').trim().isNotEmpty) 'status': status,
      },
    );
    return CreateVehicleResponse(
      vehicleId: parseRequiredString(payload, 'vehicleId', callable: endpoint),
      createdAt: parseRequiredString(payload, 'createdAt', callable: endpoint),
    );
  }

  Future<UpdateVehicleResponse> updateVehicle({
    required String companyId,
    required String vehicleId,
    required Map<String, dynamic> patch,
  }) async {
    final endpoint = 'PATCH /api/companies/$companyId/vehicles/$vehicleId';
    final payload = await _apiClient.patchJson(
      '/api/companies/$companyId/vehicles/$vehicleId',
      body: patch,
    );
    return UpdateVehicleResponse(
      vehicleId: parseRequiredString(payload, 'vehicleId', callable: endpoint),
      updatedAt: parseRequiredString(payload, 'updatedAt', callable: endpoint),
    );
  }

  Future<UpdateCompanyMemberResponse> updateCompanyMember({
    required String companyId,
    required String memberUid,
    required Map<String, dynamic> patch,
  }) async {
    final endpoint = 'PATCH /api/companies/$companyId/members/$memberUid';
    final payload = await _apiClient.patchJson(
      '/api/companies/$companyId/members/$memberUid',
      body: patch,
    );
    return UpdateCompanyMemberResponse(
      companyId: parseRequiredString(payload, 'companyId', callable: endpoint),
      memberUid: parseRequiredString(payload, 'memberUid', callable: endpoint),
      role: parseRequiredString(payload, 'role', callable: endpoint),
      memberStatus:
          parseRequiredString(payload, 'memberStatus', callable: endpoint),
      updatedAt: parseRequiredString(payload, 'updatedAt', callable: endpoint),
    );
  }

  Future<InviteCompanyMemberResponse> inviteCompanyMember({
    required String companyId,
    required String email,
    required String role,
  }) async {
    final endpoint = 'POST /api/companies/$companyId/members';
    final payload = await _apiClient.postJson(
      '/api/companies/$companyId/members',
      body: <String, dynamic>{
        'email': email,
        'role': role,
      },
    );
    return InviteCompanyMemberResponse(
      companyId: parseRequiredString(payload, 'companyId', callable: endpoint),
      inviteId: parseRequiredString(payload, 'inviteId', callable: endpoint),
      memberUid: parseRequiredString(payload, 'memberUid', callable: endpoint),
      invitedEmail:
          parseRequiredString(payload, 'invitedEmail', callable: endpoint),
      role: parseRequiredString(payload, 'role', callable: endpoint),
      status: parseRequiredString(payload, 'status', callable: endpoint),
      expiresAt: parseRequiredString(payload, 'expiresAt', callable: endpoint),
      createdAt: parseRequiredString(payload, 'createdAt', callable: endpoint),
    );
  }

  Future<AcceptCompanyInviteResponse> acceptCompanyInvite({
    required String companyId,
  }) async {
    final endpoint = 'POST /api/my/company-invites/$companyId/accept';
    final payload = await _apiClient.postJson(
      '/api/my/company-invites/$companyId/accept',
      body: const <String, dynamic>{},
    );
    return AcceptCompanyInviteResponse(
      companyId: parseRequiredString(payload, 'companyId', callable: endpoint),
      memberUid: parseRequiredString(payload, 'memberUid', callable: endpoint),
      role: parseRequiredString(payload, 'role', callable: endpoint),
      memberStatus:
          parseRequiredString(payload, 'memberStatus', callable: endpoint),
      acceptedAt:
          parseRequiredString(payload, 'acceptedAt', callable: endpoint),
    );
  }

  Future<DeclineCompanyInviteResponse> declineCompanyInvite({
    required String companyId,
  }) async {
    final endpoint = 'POST /api/my/company-invites/$companyId/decline';
    final payload = await _apiClient.postJson(
      '/api/my/company-invites/$companyId/decline',
      body: const <String, dynamic>{},
    );
    return DeclineCompanyInviteResponse(
      companyId: parseRequiredString(payload, 'companyId', callable: endpoint),
      memberUid: parseRequiredString(payload, 'memberUid', callable: endpoint),
      role: parseRequiredString(payload, 'role', callable: endpoint),
      memberStatus:
          parseRequiredString(payload, 'memberStatus', callable: endpoint),
      declinedAt:
          parseRequiredString(payload, 'declinedAt', callable: endpoint),
    );
  }

  Future<RemoveCompanyMemberResponse> removeCompanyMember({
    required String companyId,
    required String memberUid,
  }) async {
    final endpoint = 'DELETE /api/companies/$companyId/members/$memberUid';
    final payload = await _apiClient.deleteJson(
      '/api/companies/$companyId/members/$memberUid',
    );
    return RemoveCompanyMemberResponse(
      companyId: parseRequiredString(payload, 'companyId', callable: endpoint),
      memberUid: parseRequiredString(payload, 'memberUid', callable: endpoint),
      removedRole:
          parseRequiredString(payload, 'removedRole', callable: endpoint),
      removedMemberStatus: parseRequiredString(
        payload,
        'removedMemberStatus',
        callable: endpoint,
      ),
      removed: parseRequiredBool(payload, 'removed', callable: endpoint),
      removedAt: parseRequiredString(payload, 'removedAt', callable: endpoint),
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
    final endpoint = 'POST /api/companies/$companyId/routes';
    final payload = await _apiClient.postJson(
      '/api/companies/$companyId/routes',
      body: <String, dynamic>{
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
      },
    );
    return CreateCompanyRouteResponse(
      routeId: parseRequiredString(payload, 'routeId', callable: endpoint),
      srvCode: parseRequiredString(payload, 'srvCode', callable: endpoint),
    );
  }

  Future<UpdateCompanyRouteResponse> updateCompanyRoute({
    required String companyId,
    required String routeId,
    required Map<String, dynamic> patch,
    String? lastKnownUpdateToken,
  }) async {
    final endpoint = 'PATCH /api/companies/$companyId/routes/$routeId';
    final payload = await _apiClient.patchJson(
      '/api/companies/$companyId/routes/$routeId',
      body: <String, dynamic>{
        'patch': patch,
        if ((lastKnownUpdateToken ?? '').trim().isNotEmpty)
          'lastKnownUpdateToken': lastKnownUpdateToken,
      },
    );
    return UpdateCompanyRouteResponse(
      routeId: parseRequiredString(payload, 'routeId', callable: endpoint),
      updatedAt: parseRequiredString(payload, 'updatedAt', callable: endpoint),
    );
  }

  Future<List<CompanyRouteStopSummary>> listCompanyRouteStops({
    required String companyId,
    required String routeId,
  }) async {
    final endpoint = 'GET /api/companies/$companyId/routes/$routeId/stops';
    final payload = await _apiClient
        .getJson('/api/companies/$companyId/routes/$routeId/stops');
    final itemsRaw = parseRequiredList(payload, 'items', callable: endpoint);
    return itemsRaw.map((item) {
      final itemMap = parseCallableMap(item, callable: endpoint);
      final location =
          parseCallableMap(itemMap['location'], callable: endpoint);
      return CompanyRouteStopSummary(
        stopId: parseRequiredString(itemMap, 'stopId', callable: endpoint),
        routeId: parseRequiredString(itemMap, 'routeId', callable: endpoint),
        companyId:
            parseRequiredString(itemMap, 'companyId', callable: endpoint),
        name: parseRequiredString(itemMap, 'name', callable: endpoint),
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
    final endpoint = 'POST /api/companies/$companyId/routes/$routeId/stops';
    final payload = await _apiClient.postJson(
      '/api/companies/$companyId/routes/$routeId/stops',
      body: <String, dynamic>{
        if ((stopId ?? '').trim().isNotEmpty) 'stopId': stopId,
        'name': name,
        'order': order,
        'location': location,
        if ((lastKnownUpdateToken ?? '').trim().isNotEmpty)
          'lastKnownUpdateToken': lastKnownUpdateToken,
      },
    );
    return UpsertCompanyRouteStopResponse(
      companyId: parseRequiredString(payload, 'companyId', callable: endpoint),
      routeId: parseRequiredString(payload, 'routeId', callable: endpoint),
      stopId: parseRequiredString(payload, 'stopId', callable: endpoint),
      updatedAt: parseRequiredString(payload, 'updatedAt', callable: endpoint),
    );
  }

  Future<DeleteCompanyRouteStopResponse> deleteCompanyRouteStop({
    required String companyId,
    required String routeId,
    required String stopId,
    String? lastKnownUpdateToken,
  }) async {
    final endpoint =
        'DELETE /api/companies/$companyId/routes/$routeId/stops/$stopId';
    final payload = await _apiClient.deleteJson(
      '/api/companies/$companyId/routes/$routeId/stops/$stopId',
      body: <String, dynamic>{
        if ((lastKnownUpdateToken ?? '').trim().isNotEmpty)
          'lastKnownUpdateToken': lastKnownUpdateToken,
      },
    );
    return DeleteCompanyRouteStopResponse(
      routeId: parseRequiredString(payload, 'routeId', callable: endpoint),
      stopId: parseRequiredString(payload, 'stopId', callable: endpoint),
      deleted: parseRequiredBool(payload, 'deleted', callable: endpoint),
    );
  }

  Future<ReorderCompanyRouteStopsResponse> reorderCompanyRouteStops({
    required String companyId,
    required String routeId,
    required String stopId,
    required String direction,
    String? lastKnownUpdateToken,
  }) async {
    final endpoint =
        'POST /api/companies/$companyId/routes/$routeId/stops/$stopId/reorder';
    final payload = await _apiClient.postJson(
      '/api/companies/$companyId/routes/$routeId/stops/$stopId/reorder',
      body: <String, dynamic>{
        'direction': direction,
        if ((lastKnownUpdateToken ?? '').trim().isNotEmpty)
          'lastKnownUpdateToken': lastKnownUpdateToken,
      },
    );
    return ReorderCompanyRouteStopsResponse(
      routeId: parseRequiredString(payload, 'routeId', callable: endpoint),
      updatedAt: parseRequiredString(payload, 'updatedAt', callable: endpoint),
      changed: parseRequiredBool(payload, 'changed', callable: endpoint),
    );
  }

  Future<List<CompanyActiveTripSummary>> listActiveTripsByCompany({
    required String companyId,
    String? routeId,
    String? driverUid,
    int pageSize = 50,
  }) async {
    final endpoint = 'GET /api/companies/$companyId/active-trips';
    final payload = await _apiClient.getJson(
      '/api/companies/$companyId/active-trips',
      queryParameters: <String, dynamic>{
        if ((routeId ?? '').trim().isNotEmpty) 'routeId': routeId,
        if ((driverUid ?? '').trim().isNotEmpty) 'driverUid': driverUid,
        'limit': pageSize,
      },
    );
    final itemsRaw = parseRequiredList(payload, 'items', callable: endpoint);
    return itemsRaw.map((item) {
      final itemMap = parseCallableMap(item, callable: endpoint);
      final liveMap = parseCallableMap(itemMap['live'], callable: endpoint);
      return CompanyActiveTripSummary(
        tripId: parseRequiredString(itemMap, 'tripId', callable: endpoint),
        routeId: parseRequiredString(itemMap, 'routeId', callable: endpoint),
        routeName:
            parseRequiredString(itemMap, 'routeName', callable: endpoint),
        driverUid:
            parseRequiredString(itemMap, 'driverUid', callable: endpoint),
        driverName:
            parseRequiredString(itemMap, 'driverName', callable: endpoint),
        driverPlate: parseOptionalString(itemMap, 'driverPlate'),
        status: parseRequiredString(itemMap, 'status', callable: endpoint),
        startedAt: parseOptionalString(itemMap, 'startedAt'),
        lastLocationAt: parseOptionalString(itemMap, 'lastLocationAt'),
        updatedAt: parseOptionalString(itemMap, 'updatedAt'),
        liveState:
            parseRequiredString(itemMap, 'liveState', callable: endpoint),
        liveSource: parseRequiredString(liveMap, 'source', callable: endpoint),
        liveLat: parseOptionalDouble(liveMap, 'lat'),
        liveLng: parseOptionalDouble(liveMap, 'lng'),
        liveStale: parseRequiredBool(liveMap, 'stale', callable: endpoint),
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
    final endpoint =
        'PUT /api/companies/$companyId/routes/$routeId/driver-permissions/$driverUid';
    final payload = await _apiClient.putJson(
      '/api/companies/$companyId/routes/$routeId/driver-permissions/$driverUid',
      body: <String, dynamic>{
        'permissions': permissions.toJson(),
        if ((idempotencyKey ?? '').trim().isNotEmpty)
          'idempotencyKey': idempotencyKey,
      },
    );
    return GrantDriverRoutePermissionsResponse(
      routeId: parseRequiredString(payload, 'routeId', callable: endpoint),
      driverUid: parseRequiredString(payload, 'driverUid', callable: endpoint),
      permissions: _parseRouteDriverPermissionFlags(
        payload['permissions'],
        callable: endpoint,
      ),
      updatedAt: parseRequiredString(payload, 'updatedAt', callable: endpoint),
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
    final endpoint =
        'DELETE /api/companies/$companyId/routes/$routeId/driver-permissions/$driverUid';
    final payload = await _apiClient.deleteJson(
      '/api/companies/$companyId/routes/$routeId/driver-permissions/$driverUid',
      body: <String, dynamic>{
        'permissionKeys': permissionKeys ?? <String>[],
        'resetToDefault': resetToDefault,
        if ((idempotencyKey ?? '').trim().isNotEmpty)
          'idempotencyKey': idempotencyKey,
      },
    );
    return RevokeDriverRoutePermissionsResponse(
      routeId: parseRequiredString(payload, 'routeId', callable: endpoint),
      driverUid: parseRequiredString(payload, 'driverUid', callable: endpoint),
      updatedAt: parseRequiredString(payload, 'updatedAt', callable: endpoint),
    );
  }

  Future<List<RouteDriverPermissionSummary>> listRouteDriverPermissions({
    required String companyId,
    required String routeId,
  }) async {
    final endpoint =
        'GET /api/companies/$companyId/routes/$routeId/driver-permissions';
    final payload = await _apiClient.getJson(
      '/api/companies/$companyId/routes/$routeId/driver-permissions',
    );
    final itemsRaw = parseRequiredList(payload, 'items', callable: endpoint);
    return itemsRaw.map((item) {
      final itemMap = parseCallableMap(item, callable: endpoint);
      return RouteDriverPermissionSummary(
        routeId: parseRequiredString(itemMap, 'routeId', callable: endpoint),
        driverUid:
            parseRequiredString(itemMap, 'driverUid', callable: endpoint),
        permissions: _parseRouteDriverPermissionFlags(
          itemMap['permissions'],
          callable: endpoint,
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
