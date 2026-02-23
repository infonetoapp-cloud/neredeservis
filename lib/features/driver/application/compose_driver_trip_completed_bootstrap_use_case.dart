import 'dart:math';

import '../domain/driver_trip_completed_bootstrap_repository.dart';

class DriverTripCompletedTimelineStopSeed {
  const DriverTripCompletedTimelineStopSeed({
    required this.name,
    required this.passengerCount,
  });

  final String name;
  final int? passengerCount;
}

class DriverTripCompletedBootstrapComposedData {
  const DriverTripCompletedBootstrapComposedData({
    required this.startedAtUtc,
    required this.totalDistanceKm,
    required this.totalDurationMinutes,
    required this.totalPassengers,
    required this.stops,
  });

  final DateTime startedAtUtc;
  final double totalDistanceKm;
  final int totalDurationMinutes;
  final int totalPassengers;
  final List<DriverTripCompletedTimelineStopSeed> stops;
}

class ComposeDriverTripCompletedBootstrapUseCase {
  ComposeDriverTripCompletedBootstrapUseCase({
    DateTime Function()? nowUtc,
  }) : _nowUtc = nowUtc ?? (() => DateTime.now().toUtc());

  final DateTime Function() _nowUtc;

  DriverTripCompletedBootstrapComposedData execute(
    DriverTripCompletedBootstrapRawData rawData,
  ) {
    final routeData = rawData.routeData;
    final tripData = rawData.tripData;
    final nowUtc = _nowUtc();
    final parsedStops = _parseStopRows(rawData.stops);
    final totalDurationMinutes = _resolveDurationMinutes(
      tripData,
      nowUtc: nowUtc,
    );
    final startedAtUtc = _parseTimestamp(tripData?['startedAt']) ??
        nowUtc.subtract(const Duration(minutes: 30));
    final totalDistanceKm = _computeDistanceKm(parsedStops);
    final totalPassengersFromRoute =
        (routeData?['passengerCount'] as num?)?.toInt();
    final totalPassengers =
        (totalPassengersFromRoute != null && totalPassengersFromRoute >= 0)
            ? totalPassengersFromRoute
            : rawData.passengerCountFromRoutePassengersCollection;

    return DriverTripCompletedBootstrapComposedData(
      startedAtUtc: startedAtUtc,
      totalDistanceKm: totalDistanceKm,
      totalDurationMinutes: totalDurationMinutes,
      totalPassengers: totalPassengers < 0 ? 0 : totalPassengers,
      stops: parsedStops
          .map(
            (stop) => DriverTripCompletedTimelineStopSeed(
              name: stop.name,
              passengerCount: stop.passengersWaiting,
            ),
          )
          .toList(growable: false),
    );
  }
}

class _TripCompletedParsedStop {
  const _TripCompletedParsedStop({
    required this.name,
    required this.order,
    required this.passengersWaiting,
    required this.lat,
    required this.lng,
  });

  final String name;
  final int order;
  final int? passengersWaiting;
  final double? lat;
  final double? lng;
}

List<_TripCompletedParsedStop> _parseStopRows(
  List<Map<String, dynamic>> stopRows,
) {
  if (stopRows.isEmpty) {
    return const <_TripCompletedParsedStop>[];
  }
  final stops = <_TripCompletedParsedStop>[];
  for (final data in stopRows) {
    final rawName = (data['name'] as String?)?.trim();
    final name = (rawName == null || rawName.isEmpty) ? 'Durak' : rawName;
    final order = (data['order'] as num?)?.toInt() ?? 9999;
    final waitingRaw = data['passengersWaiting'];
    final waiting = waitingRaw is num ? waitingRaw.toInt() : null;
    final location = data['location'];
    double? lat;
    double? lng;
    if (location is Map<Object?, Object?>) {
      final map = Map<String, dynamic>.from(location);
      lat = _parseFiniteDouble(map['lat']);
      lng = _parseFiniteDouble(map['lng']);
    } else if (location is Map<String, dynamic>) {
      lat = _parseFiniteDouble(location['lat']);
      lng = _parseFiniteDouble(location['lng']);
    }
    stops.add(
      _TripCompletedParsedStop(
        name: name,
        order: order,
        passengersWaiting: waiting,
        lat: lat,
        lng: lng,
      ),
    );
  }
  stops.sort((left, right) => left.order.compareTo(right.order));
  return stops;
}

int _resolveDurationMinutes(
  Map<String, dynamic>? tripData, {
  required DateTime nowUtc,
}) {
  final startedAt = _parseTimestamp(tripData?['startedAt']);
  if (startedAt == null) {
    return 0;
  }
  final endedAt = _parseTimestamp(tripData?['endedAt']) ?? nowUtc;
  final durationMinutes = endedAt.difference(startedAt).inMinutes;
  return durationMinutes < 0 ? 0 : durationMinutes;
}

DateTime? _parseTimestamp(Object? value) {
  if (value is String) {
    return DateTime.tryParse(value)?.toUtc();
  }
  return null;
}

double _computeDistanceKm(List<_TripCompletedParsedStop> stops) {
  if (stops.length < 2) {
    return 0;
  }
  var totalMeters = 0.0;
  _TripCompletedParsedStop? previous;
  for (final stop in stops) {
    final hasPoint = stop.lat != null && stop.lng != null;
    if (!hasPoint) {
      continue;
    }
    if (previous != null &&
        previous.lat != null &&
        previous.lng != null &&
        stop.lat != null &&
        stop.lng != null) {
      totalMeters += _distanceMetersBetweenCoordinates(
        fromLat: previous.lat!,
        fromLng: previous.lng!,
        toLat: stop.lat!,
        toLng: stop.lng!,
      );
    }
    previous = stop;
  }
  if (totalMeters <= 0) {
    return 0;
  }
  return totalMeters / 1000;
}

double _distanceMetersBetweenCoordinates({
  required double fromLat,
  required double fromLng,
  required double toLat,
  required double toLng,
}) {
  const earthRadiusMeters = 6371000.0;
  final lat1 = fromLat * (pi / 180.0);
  final lat2 = toLat * (pi / 180.0);
  final deltaLat = (toLat - fromLat) * (pi / 180.0);
  final deltaLng = (toLng - fromLng) * (pi / 180.0);
  final sinLat = sin(deltaLat / 2.0);
  final sinLng = sin(deltaLng / 2.0);
  final a = (sinLat * sinLat) + (cos(lat1) * cos(lat2) * sinLng * sinLng);
  final c = 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
  return earthRadiusMeters * c;
}

double? _parseFiniteDouble(Object? value) {
  if (value is num) {
    final number = value.toDouble();
    return number.isFinite ? number : null;
  }
  if (value is String) {
    final parsed = double.tryParse(value.trim());
    if (parsed == null || !parsed.isFinite) {
      return null;
    }
    return parsed;
  }
  return null;
}
