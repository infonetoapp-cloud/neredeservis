import 'dart:math';

import '../../ui/screens/active_trip_screen.dart';
import 'router_value_parsing_helpers.dart';

class RouterDriverStopSnapshot {
  const RouterDriverStopSnapshot({
    required this.stopId,
    required this.name,
    required this.order,
    required this.point,
  });

  final String stopId;
  final String name;
  final int order;
  final ActiveTripMapPoint point;
}

List<RouterDriverStopSnapshot> parseDriverFinishTripStops(
  List<Map<String, dynamic>> stopRows,
) {
  if (stopRows.isEmpty) {
    return const <RouterDriverStopSnapshot>[];
  }
  final stops = <RouterDriverStopSnapshot>[];
  for (final row in stopRows) {
    final stopId = (row['stopId'] as String?)?.trim();
    final data = mapFromRouterDynamicValue(row['stopData']);
    if (data == null) {
      continue;
    }
    final location = _parseMapPointFromRaw(data['location']);
    if (location == null) {
      continue;
    }
    final rawName = (data['name'] as String?)?.trim();
    final name = (rawName == null || rawName.isEmpty) ? 'Durak' : rawName;
    final orderRaw = data['order'];
    final order = orderRaw is num ? orderRaw.toInt() : 9999;
    stops.add(
      RouterDriverStopSnapshot(
        stopId: (stopId == null || stopId.isEmpty) ? 'stop' : stopId,
        name: name,
        order: order,
        point: location,
      ),
    );
  }
  stops.sort((left, right) {
    final orderCompare = left.order.compareTo(right.order);
    if (orderCompare != 0) {
      return orderCompare;
    }
    return left.stopId.compareTo(right.stopId);
  });
  return stops;
}

List<ActiveTripMapPoint> buildDriverFinishTripRoutePathPoints({
  required Map<String, dynamic>? routeData,
  required List<RouterDriverStopSnapshot> orderedStops,
}) {
  if (orderedStops.length >= 2) {
    return orderedStops.map((stop) => stop.point).toList(growable: false);
  }

  final startPoint = _parseMapPointFromRaw(routeData?['startPoint']);
  final endPoint = _parseMapPointFromRaw(routeData?['endPoint']);
  if (startPoint != null && endPoint != null) {
    if ((startPoint.lat - endPoint.lat).abs() < 0.0000001 &&
        (startPoint.lng - endPoint.lng).abs() < 0.0000001) {
      return <ActiveTripMapPoint>[startPoint];
    }
    return <ActiveTripMapPoint>[startPoint, endPoint];
  }
  if (orderedStops.length == 1) {
    return <ActiveTripMapPoint>[orderedStops.first.point];
  }
  return const <ActiveTripMapPoint>[];
}

RouterDriverStopSnapshot? resolveDriverFinishTripNextStop({
  required List<RouterDriverStopSnapshot> orderedStops,
  required ActiveTripMapPoint? vehiclePoint,
}) {
  if (orderedStops.isEmpty) {
    return null;
  }
  if (vehiclePoint == null) {
    return orderedStops.first;
  }

  var nearest = orderedStops.first;
  var nearestDistanceMeters =
      distanceMetersBetweenDriverFinishTripPoints(vehiclePoint, nearest.point);
  for (final stop in orderedStops.skip(1)) {
    final distanceMeters =
        distanceMetersBetweenDriverFinishTripPoints(vehiclePoint, stop.point);
    if (distanceMeters < nearestDistanceMeters) {
      nearest = stop;
      nearestDistanceMeters = distanceMeters;
    }
  }

  const arrivalThresholdMeters = 80.0;
  if (nearestDistanceMeters <= arrivalThresholdMeters) {
    final nextByOrder =
        orderedStops.where((candidate) => candidate.order > nearest.order);
    if (nextByOrder.isNotEmpty) {
      return nextByOrder.first;
    }
  }
  return nearest;
}

int? resolveDriverFinishTripStopsRemaining({
  required List<RouterDriverStopSnapshot> orderedStops,
  required RouterDriverStopSnapshot? nextStop,
}) {
  if (nextStop == null || orderedStops.isEmpty) {
    return 0;
  }
  return orderedStops.where((stop) => stop.order >= nextStop.order).length;
}

double distanceMetersBetweenDriverFinishTripPoints(
  ActiveTripMapPoint from,
  ActiveTripMapPoint to,
) {
  const earthRadiusMeters = 6371000.0;
  final lat1 = from.lat * (pi / 180.0);
  final lat2 = to.lat * (pi / 180.0);
  final deltaLat = (to.lat - from.lat) * (pi / 180.0);
  final deltaLng = (to.lng - from.lng) * (pi / 180.0);
  final sinLat = sin(deltaLat / 2.0);
  final sinLng = sin(deltaLng / 2.0);
  final a = (sinLat * sinLat) + (cos(lat1) * cos(lat2) * sinLng * sinLng);
  final c = 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
  return earthRadiusMeters * c;
}

ActiveTripMapPoint? _parseMapPointFromRaw(Object? rawValue) {
  if (rawValue is! Map<Object?, Object?> && rawValue is! Map<String, dynamic>) {
    return null;
  }
  final rawMap = rawValue is Map<String, dynamic>
      ? rawValue
      : Map<String, dynamic>.from(rawValue as Map<Object?, Object?>);
  final lat = parseFiniteRouterDouble(rawMap['lat']);
  final lng = parseFiniteRouterDouble(rawMap['lng']);
  if (lat == null || lng == null) {
    return null;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  return ActiveTripMapPoint(lat: lat, lng: lng);
}
