import '../entities/trip_entity.dart';
import '../models/trip_model.dart';

extension TripModelMapper on TripModel {
  TripEntity toEntity() {
    return TripEntity(
      tripId: tripId,
      routeId: routeId,
      driverId: driverId,
      driverSnapshot: TripDriverSnapshotEntity(
        name: driverSnapshot.name,
        plate: driverSnapshot.plate,
        phone: driverSnapshot.phone,
      ),
      status: tripStatusFromRaw(status),
      startedAt: _parseUtcDate(startedAt),
      endedAt: endedAt == null ? null : _parseUtcDate(endedAt!),
      lastLocationAt: _parseUtcDate(lastLocationAt),
      endReason: tripEndReasonFromRaw(endReason),
      startedByDeviceId: startedByDeviceId,
      transitionVersion: transitionVersion,
      updatedAt: _parseUtcDate(updatedAt),
    );
  }
}

TripModel tripModelFromEntity(TripEntity entity) {
  return TripModel(
    tripId: entity.tripId,
    routeId: entity.routeId,
    driverId: entity.driverId,
    driverSnapshot: TripDriverSnapshotModel(
      name: entity.driverSnapshot.name,
      plate: entity.driverSnapshot.plate,
      phone: entity.driverSnapshot.phone,
    ),
    status: _tripStatusToRaw(entity.status),
    startedAt: entity.startedAt.toUtc().toIso8601String(),
    endedAt: entity.endedAt?.toUtc().toIso8601String(),
    lastLocationAt: entity.lastLocationAt.toUtc().toIso8601String(),
    endReason: _tripEndReasonToRaw(entity.endReason),
    startedByDeviceId: entity.startedByDeviceId,
    transitionVersion: entity.transitionVersion,
    updatedAt: entity.updatedAt.toUtc().toIso8601String(),
  );
}

String _tripStatusToRaw(TripStatus status) {
  switch (status) {
    case TripStatus.active:
      return 'active';
    case TripStatus.completed:
      return 'completed';
    case TripStatus.abandoned:
      return 'abandoned';
    case TripStatus.unknown:
      return 'active';
  }
}

String? _tripEndReasonToRaw(TripEndReason? endReason) {
  switch (endReason) {
    case null:
      return null;
    case TripEndReason.driverFinished:
      return 'driver_finished';
    case TripEndReason.autoAbandoned:
      return 'auto_abandoned';
    case TripEndReason.unknown:
      return 'driver_finished';
  }
}

DateTime _parseUtcDate(String value) {
  return DateTime.parse(value).toUtc();
}
