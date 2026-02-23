import '../domain/driver_my_trips_repository.dart';

class DriverMyTripsTripBuckets {
  const DriverMyTripsTripBuckets({
    this.activeTripByRoute = const <String, DriverMyTripsRawTripRow>{},
    this.historyTripRows = const <DriverMyTripsRawTripRow>[],
  });

  final Map<String, DriverMyTripsRawTripRow> activeTripByRoute;
  final List<DriverMyTripsRawTripRow> historyTripRows;
}

class ClassifyDriverMyTripsRawUseCase {
  ClassifyDriverMyTripsRawUseCase({
    DateTime Function()? nowUtc,
    DateTime? Function(Map<String, dynamic> tripData)? resolveReferenceAtUtc,
  })  : _nowUtc = nowUtc ?? (() => DateTime.now().toUtc()),
        _resolveReferenceAtUtc =
            resolveReferenceAtUtc ?? _defaultResolveReferenceAtUtc;

  final DateTime Function() _nowUtc;
  final DateTime? Function(Map<String, dynamic> tripData)
      _resolveReferenceAtUtc;

  DriverMyTripsTripBuckets execute(List<DriverMyTripsRawTripRow> tripRows) {
    if (tripRows.isEmpty) {
      return const DriverMyTripsTripBuckets();
    }

    final activeTripByRoute = <String, DriverMyTripsRawTripRow>{};
    final historyTripRows = <DriverMyTripsRawTripRow>[];

    for (final row in tripRows) {
      final tripData = row.tripData;
      final routeId = _readTrimmedString(tripData['routeId']);
      if (routeId == null) {
        continue;
      }

      final status = _classifyStatus(_readTrimmedString(tripData['status']));
      if (status == _TripBucketStatus.live) {
        final existing = activeTripByRoute[routeId];
        final candidateStartedAt =
            _resolveReferenceAtUtc(tripData) ?? _nowUtc();
        final existingStartedAt =
            existing == null ? null : _resolveReferenceAtUtc(existing.tripData);
        if (existing == null ||
            (existingStartedAt != null &&
                candidateStartedAt.isAfter(existingStartedAt))) {
          activeTripByRoute[routeId] = row;
        } else if (existingStartedAt == null) {
          activeTripByRoute[routeId] = row;
        }
        continue;
      }

      if (status == _TripBucketStatus.history) {
        historyTripRows.add(row);
      }
    }

    return DriverMyTripsTripBuckets(
      activeTripByRoute: activeTripByRoute,
      historyTripRows: historyTripRows,
    );
  }
}

enum _TripBucketStatus { live, history, ignore }

_TripBucketStatus _classifyStatus(String? rawStatus) {
  switch (rawStatus?.toLowerCase()) {
    case 'active':
      return _TripBucketStatus.live;
    case 'completed':
    case 'abandoned':
    case 'cancelled':
    case 'canceled':
      return _TripBucketStatus.history;
    default:
      return _TripBucketStatus.ignore;
  }
}

String? _readTrimmedString(Object? raw) {
  if (raw is! String) {
    return null;
  }
  final normalized = raw.trim();
  return normalized.isEmpty ? null : normalized;
}

DateTime? _defaultResolveReferenceAtUtc(Map<String, dynamic> tripData) {
  final endedAt = _parseDate(tripData['endedAt']);
  if (endedAt != null) {
    return endedAt;
  }
  final updatedAt = _parseDate(tripData['updatedAt']);
  if (updatedAt != null) {
    return updatedAt;
  }
  return _parseDate(tripData['startedAt']);
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
