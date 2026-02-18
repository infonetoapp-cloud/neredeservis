import '../entities/live_location_entity.dart';
import '../models/live_location_model.dart';

extension LiveLocationModelMapper on LiveLocationModel {
  LiveLocationEntity toEntity() {
    return LiveLocationEntity(
      routeId: routeId,
      lat: lat,
      lng: lng,
      speed: speed,
      heading: heading,
      accuracy: accuracy,
      timestampMs: timestampMs,
      tripId: tripId,
      driverId: driverId,
    );
  }
}

LiveLocationModel liveLocationModelFromEntity(LiveLocationEntity entity) {
  return LiveLocationModel(
    routeId: entity.routeId,
    lat: entity.lat,
    lng: entity.lng,
    speed: entity.speed,
    heading: entity.heading,
    accuracy: entity.accuracy,
    timestampMs: entity.timestampMs,
    tripId: entity.tripId,
    driverId: entity.driverId,
  );
}
