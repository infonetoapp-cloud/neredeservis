class CompanyMembershipSummary {
  const CompanyMembershipSummary({
    required this.companyId,
    required this.name,
    required this.role,
    required this.memberStatus,
  });

  final String companyId;
  final String name;
  final String role;
  final String memberStatus;
}

class CompanyMemberSummary {
  const CompanyMemberSummary({
    required this.uid,
    required this.displayName,
    required this.email,
    required this.phone,
    required this.role,
    required this.memberStatus,
    required this.companyId,
  });

  final String uid;
  final String displayName;
  final String? email;
  final String? phone;
  final String role;
  final String memberStatus;
  final String companyId;
}

class CompanyRouteSummary {
  const CompanyRouteSummary({
    required this.routeId,
    required this.companyId,
    required this.name,
    required this.srvCode,
    required this.driverId,
    required this.authorizedDriverIds,
    required this.scheduledTime,
    required this.timeSlot,
    required this.isArchived,
    required this.allowGuestTracking,
    required this.passengerCount,
    required this.updatedAt,
  });

  final String routeId;
  final String companyId;
  final String name;
  final String? srvCode;
  final String? driverId;
  final List<String> authorizedDriverIds;
  final String? scheduledTime;
  final String? timeSlot;
  final bool isArchived;
  final bool allowGuestTracking;
  final int passengerCount;
  final String? updatedAt;
}

class CompanyVehicleSummary {
  const CompanyVehicleSummary({
    required this.vehicleId,
    required this.companyId,
    required this.plate,
    required this.status,
    required this.brand,
    required this.model,
    required this.year,
    required this.capacity,
    required this.updatedAt,
  });

  final String vehicleId;
  final String companyId;
  final String plate;
  final String status;
  final String? brand;
  final String? model;
  final int? year;
  final int? capacity;
  final String? updatedAt;
}

class CreateVehicleResponse {
  const CreateVehicleResponse({
    required this.vehicleId,
    required this.createdAt,
  });

  final String vehicleId;
  final String createdAt;
}

class UpdateVehicleResponse {
  const UpdateVehicleResponse({
    required this.vehicleId,
    required this.updatedAt,
  });

  final String vehicleId;
  final String updatedAt;
}

class CreateCompanyResponse {
  const CreateCompanyResponse({
    required this.companyId,
    required this.createdAt,
    required this.ownerUid,
  });

  final String companyId;
  final String createdAt;
  final String ownerUid;
}

class CreateCompanyRouteResponse {
  const CreateCompanyRouteResponse({
    required this.routeId,
    required this.srvCode,
  });

  final String routeId;
  final String srvCode;
}

class UpdateCompanyRouteResponse {
  const UpdateCompanyRouteResponse({
    required this.routeId,
    required this.updatedAt,
  });

  final String routeId;
  final String updatedAt;
}

class CompanyRouteStopSummary {
  const CompanyRouteStopSummary({
    required this.stopId,
    required this.routeId,
    required this.companyId,
    required this.name,
    required this.lat,
    required this.lng,
    required this.order,
    required this.createdAt,
    required this.updatedAt,
  });

  final String stopId;
  final String routeId;
  final String companyId;
  final String name;
  final double lat;
  final double lng;
  final int order;
  final String? createdAt;
  final String? updatedAt;
}

class UpsertCompanyRouteStopResponse {
  const UpsertCompanyRouteStopResponse({
    required this.companyId,
    required this.routeId,
    required this.stopId,
    required this.updatedAt,
  });

  final String companyId;
  final String routeId;
  final String stopId;
  final String updatedAt;
}

class DeleteCompanyRouteStopResponse {
  const DeleteCompanyRouteStopResponse({
    required this.routeId,
    required this.stopId,
    required this.deleted,
  });

  final String routeId;
  final String stopId;
  final bool deleted;
}

class ReorderCompanyRouteStopsResponse {
  const ReorderCompanyRouteStopsResponse({
    required this.routeId,
    required this.updatedAt,
    required this.changed,
  });

  final String routeId;
  final String updatedAt;
  final bool changed;
}

class CompanyActiveTripSummary {
  const CompanyActiveTripSummary({
    required this.tripId,
    required this.routeId,
    required this.routeName,
    required this.driverUid,
    required this.driverName,
    required this.driverPlate,
    required this.status,
    required this.startedAt,
    required this.lastLocationAt,
    required this.updatedAt,
    required this.liveState,
    required this.liveSource,
    required this.liveLat,
    required this.liveLng,
    required this.liveStale,
  });

  final String tripId;
  final String routeId;
  final String routeName;
  final String driverUid;
  final String driverName;
  final String? driverPlate;
  final String status;
  final String? startedAt;
  final String? lastLocationAt;
  final String? updatedAt;
  final String liveState;
  final String liveSource;
  final double? liveLat;
  final double? liveLng;
  final bool liveStale;
}

class InviteCompanyMemberResponse {
  const InviteCompanyMemberResponse({
    required this.companyId,
    required this.inviteId,
    required this.memberUid,
    required this.invitedEmail,
    required this.role,
    required this.status,
    required this.expiresAt,
    required this.createdAt,
  });

  final String companyId;
  final String inviteId;
  final String memberUid;
  final String invitedEmail;
  final String role;
  final String status;
  final String expiresAt;
  final String createdAt;
}

class AcceptCompanyInviteResponse {
  const AcceptCompanyInviteResponse({
    required this.companyId,
    required this.memberUid,
    required this.role,
    required this.memberStatus,
    required this.acceptedAt,
  });

  final String companyId;
  final String memberUid;
  final String role;
  final String memberStatus;
  final String acceptedAt;
}

class DeclineCompanyInviteResponse {
  const DeclineCompanyInviteResponse({
    required this.companyId,
    required this.memberUid,
    required this.role,
    required this.memberStatus,
    required this.declinedAt,
  });

  final String companyId;
  final String memberUid;
  final String role;
  final String memberStatus;
  final String declinedAt;
}

class UpdateCompanyMemberResponse {
  const UpdateCompanyMemberResponse({
    required this.companyId,
    required this.memberUid,
    required this.role,
    required this.memberStatus,
    required this.updatedAt,
  });

  final String companyId;
  final String memberUid;
  final String role;
  final String memberStatus;
  final String updatedAt;
}

class RemoveCompanyMemberResponse {
  const RemoveCompanyMemberResponse({
    required this.companyId,
    required this.memberUid,
    required this.removedRole,
    required this.removedMemberStatus,
    required this.removed,
    required this.removedAt,
  });

  final String companyId;
  final String memberUid;
  final String removedRole;
  final String removedMemberStatus;
  final bool removed;
  final String removedAt;
}

class RouteDriverPermissionFlags {
  const RouteDriverPermissionFlags({
    required this.canStartFinishTrip,
    required this.canSendAnnouncements,
    required this.canViewPassengerList,
    required this.canEditAssignedRouteMeta,
    required this.canEditStops,
    required this.canManageRouteSchedule,
  });

  final bool canStartFinishTrip;
  final bool canSendAnnouncements;
  final bool canViewPassengerList;
  final bool canEditAssignedRouteMeta;
  final bool canEditStops;
  final bool canManageRouteSchedule;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'canStartFinishTrip': canStartFinishTrip,
      'canSendAnnouncements': canSendAnnouncements,
      'canViewPassengerList': canViewPassengerList,
      'canEditAssignedRouteMeta': canEditAssignedRouteMeta,
      'canEditStops': canEditStops,
      'canManageRouteSchedule': canManageRouteSchedule,
    };
  }
}

class GrantDriverRoutePermissionsResponse {
  const GrantDriverRoutePermissionsResponse({
    required this.routeId,
    required this.driverUid,
    required this.permissions,
    required this.updatedAt,
  });

  final String routeId;
  final String driverUid;
  final RouteDriverPermissionFlags permissions;
  final String updatedAt;
}

class RevokeDriverRoutePermissionsResponse {
  const RevokeDriverRoutePermissionsResponse({
    required this.routeId,
    required this.driverUid,
    required this.updatedAt,
  });

  final String routeId;
  final String driverUid;
  final String updatedAt;
}

class RouteDriverPermissionSummary {
  const RouteDriverPermissionSummary({
    required this.routeId,
    required this.driverUid,
    required this.permissions,
    required this.updatedAt,
  });

  final String routeId;
  final String driverUid;
  final RouteDriverPermissionFlags permissions;
  final String? updatedAt;
}
