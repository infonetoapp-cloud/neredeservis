import '../domain/driver_my_trips_repository.dart';

enum DriverMyTripsCardSeedStatus { planned, live, completed, canceled }

class DriverMyTripsCardSeedGeoPoint {
  const DriverMyTripsCardSeedGeoPoint({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;
}

class DriverMyTripsCardSeed {
  const DriverMyTripsCardSeed({
    required this.routeId,
    required this.status,
    required this.sortAtUtc,
    required this.isHistory,
    this.tripId,
    this.routeName,
    this.startAddress,
    this.endAddress,
    this.plannedAtLocal,
    this.scheduledTimeLabel,
    this.passengerCount,
    this.startPoint,
    this.endPoint,
    this.srvCode,
    this.routePolylineEncoded,
  });

  final String routeId;
  final DriverMyTripsCardSeedStatus status;
  final DateTime sortAtUtc;
  final bool isHistory;
  final String? tripId;
  final String? routeName;
  final String? startAddress;
  final String? endAddress;
  final DateTime? plannedAtLocal;
  final String? scheduledTimeLabel;
  final int? passengerCount;
  final DriverMyTripsCardSeedGeoPoint? startPoint;
  final DriverMyTripsCardSeedGeoPoint? endPoint;
  final String? srvCode;
  final String? routePolylineEncoded;
}

class ComposeDriverMyTripsCardSeedsUseCase {
  ComposeDriverMyTripsCardSeedsUseCase({
    DateTime Function()? nowLocal,
  }) : _nowLocal = nowLocal ?? DateTime.now;

  final DateTime Function() _nowLocal;

  List<DriverMyTripsCardSeed> execute({
    required Map<String, Map<String, dynamic>> managedRouteDocs,
    required Map<String, DriverMyTripsRawTripRow> activeTripByRoute,
    required List<DriverMyTripsRawTripRow> historyTripRows,
  }) {
    final items = <DriverMyTripsCardSeed>[];
    final nowLocal = _nowLocal();

    for (final entry in managedRouteDocs.entries) {
      final routeId = entry.key;
      final routeData = entry.value;
      if (routeData['isArchived'] == true) {
        continue;
      }

      final scheduledTime = _readTrimmedString(routeData['scheduledTime']);
      final plannedAtLocal = _parseScheduledTimeAsTodayLocal(scheduledTime);
      final activeTripRow = activeTripByRoute[routeId];
      final activeTripData = activeTripRow?.tripData;

      final sortAtUtc = _resolveTripReferenceAtUtc(
              activeTripData ?? const <String, dynamic>{}) ??
          plannedAtLocal?.toUtc() ??
          _parseDate(routeData['updatedAt']) ??
          nowLocal.toUtc();

      items.add(
        DriverMyTripsCardSeed(
          routeId: routeId,
          tripId: activeTripRow?.tripId,
          routeName: _readTrimmedString(routeData['name']),
          startAddress: _readTrimmedString(routeData['startAddress']),
          endAddress: _readTrimmedString(routeData['endAddress']),
          status: activeTripData == null
              ? DriverMyTripsCardSeedStatus.planned
              : DriverMyTripsCardSeedStatus.live,
          sortAtUtc: sortAtUtc,
          plannedAtLocal: plannedAtLocal,
          scheduledTimeLabel: scheduledTime,
          passengerCount: (routeData['passengerCount'] as num?)?.toInt(),
          startPoint: _tryParseGeoPoint(routeData['startPoint']),
          endPoint: _tryParseGeoPoint(routeData['endPoint']),
          srvCode: _readTrimmedString(routeData['srvCode']),
          routePolylineEncoded: _readTrimmedString(routeData['routePolyline']),
          isHistory: false,
        ),
      );
    }

    for (final row in historyTripRows) {
      final tripData = row.tripData;
      final routeId = _readTrimmedString(tripData['routeId']);
      if (routeId == null) {
        continue;
      }

      final routeData = managedRouteDocs[routeId];
      final status = _mapHistoryStatus(_readTrimmedString(tripData['status']));
      if (status == null) {
        continue;
      }

      final scheduledTime = _readTrimmedString(routeData?['scheduledTime']);
      items.add(
        DriverMyTripsCardSeed(
          routeId: routeId,
          tripId: row.tripId,
          routeName: _readTrimmedString(routeData?['name']) ??
              _readTrimmedString(tripData['routeName']),
          startAddress: _readTrimmedString(routeData?['startAddress']),
          endAddress: _readTrimmedString(routeData?['endAddress']),
          status: status,
          sortAtUtc:
              _resolveTripReferenceAtUtc(tripData) ?? DateTime.now().toUtc(),
          plannedAtLocal: _parseScheduledTimeAsTodayLocal(scheduledTime),
          scheduledTimeLabel: scheduledTime,
          passengerCount: (routeData?['passengerCount'] as num?)?.toInt(),
          startPoint: _tryParseGeoPoint(routeData?['startPoint']),
          endPoint: _tryParseGeoPoint(routeData?['endPoint']),
          srvCode: _readTrimmedString(routeData?['srvCode']),
          routePolylineEncoded: _readTrimmedString(routeData?['routePolyline']),
          isHistory: true,
        ),
      );
    }

    return items;
  }
}

DriverMyTripsCardSeedStatus? _mapHistoryStatus(String? rawStatus) {
  switch (rawStatus?.toLowerCase()) {
    case 'completed':
      return DriverMyTripsCardSeedStatus.completed;
    case 'abandoned':
    case 'cancelled':
    case 'canceled':
      return DriverMyTripsCardSeedStatus.canceled;
    default:
      return null;
  }
}

String? _readTrimmedString(Object? raw) {
  if (raw is! String) {
    return null;
  }
  final normalized = raw.trim();
  return normalized.isEmpty ? null : normalized;
}

DateTime? _resolveTripReferenceAtUtc(Map<String, dynamic> tripData) {
  return _parseDate(tripData['endedAt']) ??
      _parseDate(tripData['updatedAt']) ??
      _parseDate(tripData['startedAt']);
}

DateTime? _parseDate(Object? raw) {
  if (raw is DateTime) {
    return raw.toUtc();
  }
  if (raw is String) {
    final normalized = raw.trim();
    if (normalized.isEmpty) {
      return null;
    }
    return DateTime.tryParse(normalized)?.toUtc();
  }
  final dynamic dynamicValue = raw;
  try {
    final Object? maybeDate = dynamicValue?.toDate();
    if (maybeDate is DateTime) {
      return maybeDate.toUtc();
    }
  } catch (_) {
    // Ignore non-Date-like objects.
  }
  return null;
}

DateTime? _parseScheduledTimeAsTodayLocal(String? raw) {
  final normalized = raw?.trim();
  if (normalized == null || normalized.isEmpty) {
    return null;
  }
  final match = RegExp(r'^(\d{1,2}):(\d{2})$').firstMatch(normalized);
  if (match == null) {
    return null;
  }
  final hour = int.tryParse(match.group(1) ?? '');
  final minute = int.tryParse(match.group(2) ?? '');
  if (hour == null || minute == null) {
    return null;
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  final now = DateTime.now();
  return DateTime(now.year, now.month, now.day, hour, minute);
}

DriverMyTripsCardSeedGeoPoint? _tryParseGeoPoint(Object? raw) {
  if (raw is Map<String, dynamic>) {
    final lat = (raw['lat'] as num?)?.toDouble();
    final lng = (raw['lng'] as num?)?.toDouble();
    if (lat == null || lng == null) {
      return null;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null;
    }
    return DriverMyTripsCardSeedGeoPoint(lat: lat, lng: lng);
  }
  if (raw is Map) {
    final lat = raw['lat'];
    final lng = raw['lng'];
    if (lat is! num || lng is! num) {
      return null;
    }
    final latValue = lat.toDouble();
    final lngValue = lng.toDouble();
    if (latValue < -90 || latValue > 90 || lngValue < -180 || lngValue > 180) {
      return null;
    }
    return DriverMyTripsCardSeedGeoPoint(lat: latValue, lng: lngValue);
  }
  return null;
}
