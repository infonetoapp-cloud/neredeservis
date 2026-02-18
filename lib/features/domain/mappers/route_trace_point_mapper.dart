import '../entities/route_trace_point_entity.dart';
import '../models/route_trace_point_model.dart';

extension RouteTracePointModelMapper on RouteTracePointModel {
  RouteTracePointEntity toEntity() {
    return RouteTracePointEntity(
      lat: lat,
      lng: lng,
      accuracy: accuracy,
      sampledAtMs: sampledAtMs,
    );
  }
}

RouteTracePointModel routeTracePointModelFromEntity(
  RouteTracePointEntity entity,
) {
  return RouteTracePointModel(
    lat: entity.lat,
    lng: entity.lng,
    accuracy: entity.accuracy,
    sampledAtMs: entity.sampledAtMs,
  );
}
