import '../entities/stop_entity.dart';
import '../models/stop_model.dart';

extension StopModelMapper on StopModel {
  StopEntity toEntity() {
    return StopEntity(
      routeId: routeId,
      stopId: stopId,
      name: name,
      location: StopGeoPointEntity(
        lat: location.lat,
        lng: location.lng,
      ),
      order: order,
      createdAt: _parseUtcDate(createdAt),
      updatedAt: _parseUtcDate(updatedAt),
    );
  }
}

StopModel stopModelFromEntity(StopEntity entity) {
  return StopModel(
    routeId: entity.routeId,
    stopId: entity.stopId,
    name: entity.name,
    location: StopGeoPointModel(
      lat: entity.location.lat,
      lng: entity.location.lng,
    ),
    order: entity.order,
    createdAt: entity.createdAt.toUtc().toIso8601String(),
    updatedAt: entity.updatedAt.toUtc().toIso8601String(),
  );
}

DateTime _parseUtcDate(String value) {
  return DateTime.parse(value).toUtc();
}
