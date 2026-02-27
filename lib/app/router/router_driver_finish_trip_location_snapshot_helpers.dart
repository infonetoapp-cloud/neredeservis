import '../../features/location/application/driver_heartbeat_policy.dart';
import '../../features/location/application/location_freshness.dart';
import '../../ui/screens/active_trip_screen.dart';
import 'router_driver_finish_trip_geometry_helpers.dart';
import 'router_value_parsing_helpers.dart';

class RouterDriverFinishTripLocationSnapshot {
  const RouterDriverFinishTripLocationSnapshot({
    required this.heartbeat,
    required this.routePathPoints,
    required this.vehiclePoint,
    required this.nextStop,
    required this.crowFlyDistanceMeters,
    required this.stopsRemaining,
  });

  final DriverHeartbeatSnapshot heartbeat;
  final List<ActiveTripMapPoint> routePathPoints;
  final ActiveTripMapPoint? vehiclePoint;
  final RouterDriverStopSnapshot? nextStop;
  final int? crowFlyDistanceMeters;
  final int? stopsRemaining;
}

RouterDriverFinishTripLocationSnapshot resolveDriverFinishTripLocationSnapshot({
  required Object? rawLocationValue,
  required Map<String, dynamic>? routeData,
  required List<RouterDriverStopSnapshot> orderedStops,
  required bool batteryDegradeModeEnabled,
}) {
  final rawMap = mapFromRouterDynamicValue(rawLocationValue);
  final timestampMs = parseLiveLocationTimestampMs(rawMap?['timestamp']);
  final nowUtc = DateTime.now().toUtc();
  final freshness = resolveLiveSignalFreshness(
    nowUtc: nowUtc,
    timestampMs: timestampMs,
    treatMissingAsLive: false,
  );
  final lastSeenAgo = formatLastSeenAgo(
    nowUtc: nowUtc,
    timestampMs: timestampMs,
  );
  final heartbeat = resolveDriverHeartbeatSnapshot(
    freshness: freshness,
    lastSeenAgo: lastSeenAgo,
    degradeModeEnabled: batteryDegradeModeEnabled,
  );

  final vehicleLat = parseFiniteRouterDouble(rawMap?['lat']);
  final vehicleLng = parseFiniteRouterDouble(rawMap?['lng']);
  final vehiclePoint = (vehicleLat == null || vehicleLng == null)
      ? null
      : ActiveTripMapPoint(lat: vehicleLat, lng: vehicleLng);

  final nextStop = resolveDriverFinishTripNextStop(
    orderedStops: orderedStops,
    vehiclePoint: vehiclePoint,
  );
  final routePathPoints = buildDriverFinishTripRoutePathPoints(
    routeData: routeData,
    orderedStops: orderedStops,
  );
  final crowFlyDistanceMeters = (vehiclePoint == null || nextStop == null)
      ? null
      : distanceMetersBetweenDriverFinishTripPoints(
          vehiclePoint,
          nextStop.point,
        ).round();
  final stopsRemaining = resolveDriverFinishTripStopsRemaining(
    orderedStops: orderedStops,
    nextStop: nextStop,
  );

  return RouterDriverFinishTripLocationSnapshot(
    heartbeat: heartbeat,
    routePathPoints: routePathPoints,
    vehiclePoint: vehiclePoint,
    nextStop: nextStop,
    crowFlyDistanceMeters: crowFlyDistanceMeters,
    stopsRemaining: stopsRemaining,
  );
}
