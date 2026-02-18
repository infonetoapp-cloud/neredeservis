import '../entities/route_entity.dart';
import '../models/route_model.dart';

extension RouteModelMapper on RouteModel {
  RouteEntity toEntity() {
    return RouteEntity(
      routeId: routeId,
      name: name,
      driverId: driverId,
      authorizedDriverIds: authorizedDriverIds,
      memberIds: memberIds,
      companyId: companyId,
      srvCode: srvCode,
      visibility: routeVisibilityFromRaw(visibility),
      allowGuestTracking: allowGuestTracking,
      creationMode: routeCreationModeFromRaw(creationMode),
      routePolyline: routePolyline,
      startPoint: RouteGeoPointEntity(
        lat: startPoint.lat,
        lng: startPoint.lng,
      ),
      startAddress: startAddress,
      endPoint: RouteGeoPointEntity(
        lat: endPoint.lat,
        lng: endPoint.lng,
      ),
      endAddress: endAddress,
      scheduledTime: scheduledTime,
      timeSlot: routeTimeSlotFromRaw(timeSlot),
      isArchived: isArchived,
      vacationUntil:
          vacationUntil == null ? null : _parseUtcDate(vacationUntil!),
      passengerCount: passengerCount,
      lastTripStartedNotificationAt: lastTripStartedNotificationAt == null
          ? null
          : _parseUtcDate(lastTripStartedNotificationAt!),
      createdAt: _parseUtcDate(createdAt),
      updatedAt: _parseUtcDate(updatedAt),
    );
  }
}

RouteModel routeModelFromEntity(RouteEntity entity) {
  return RouteModel(
    routeId: entity.routeId,
    name: entity.name,
    driverId: entity.driverId,
    authorizedDriverIds: List<String>.from(entity.authorizedDriverIds),
    memberIds: List<String>.from(entity.memberIds),
    companyId: entity.companyId,
    srvCode: entity.srvCode,
    visibility: _routeVisibilityToRaw(entity.visibility),
    allowGuestTracking: entity.allowGuestTracking,
    creationMode: _routeCreationModeToRaw(entity.creationMode),
    routePolyline: entity.routePolyline,
    startPoint: RouteGeoPointModel(
      lat: entity.startPoint.lat,
      lng: entity.startPoint.lng,
    ),
    startAddress: entity.startAddress,
    endPoint: RouteGeoPointModel(
      lat: entity.endPoint.lat,
      lng: entity.endPoint.lng,
    ),
    endAddress: entity.endAddress,
    scheduledTime: entity.scheduledTime,
    timeSlot: _routeTimeSlotToRaw(entity.timeSlot),
    isArchived: entity.isArchived,
    vacationUntil: entity.vacationUntil?.toUtc().toIso8601String(),
    passengerCount: entity.passengerCount,
    lastTripStartedNotificationAt:
        entity.lastTripStartedNotificationAt?.toUtc().toIso8601String(),
    createdAt: entity.createdAt.toUtc().toIso8601String(),
    updatedAt: entity.updatedAt.toUtc().toIso8601String(),
  );
}

String _routeVisibilityToRaw(RouteVisibility visibility) {
  switch (visibility) {
    case RouteVisibility.privateOnly:
      return 'private';
  }
}

String _routeCreationModeToRaw(RouteCreationMode creationMode) {
  switch (creationMode) {
    case RouteCreationMode.manualPin:
      return 'manual_pin';
    case RouteCreationMode.ghostDrive:
      return 'ghost_drive';
    case RouteCreationMode.unknown:
      return 'manual_pin';
  }
}

String _routeTimeSlotToRaw(RouteTimeSlot timeSlot) {
  switch (timeSlot) {
    case RouteTimeSlot.morning:
      return 'morning';
    case RouteTimeSlot.evening:
      return 'evening';
    case RouteTimeSlot.midday:
      return 'midday';
    case RouteTimeSlot.custom:
      return 'custom';
    case RouteTimeSlot.unknown:
      return 'custom';
  }
}

DateTime _parseUtcDate(String value) {
  return DateTime.parse(value).toUtc();
}
