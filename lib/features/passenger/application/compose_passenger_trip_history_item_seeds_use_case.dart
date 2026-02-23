import '../domain/passenger_trip_history_repository.dart';

enum PassengerTripHistoryItemSeedStatus { completed, partial }

class PassengerTripHistoryItemSeed {
  const PassengerTripHistoryItemSeed({
    required this.tripId,
    required this.routeId,
    required this.routeName,
    required this.referenceAtUtc,
    required this.status,
    this.durationMinutes,
    this.driverName,
    this.driverPhotoUrl,
  });

  final String tripId;
  final String routeId;
  final String routeName;
  final DateTime referenceAtUtc;
  final PassengerTripHistoryItemSeedStatus status;
  final int? durationMinutes;
  final String? driverName;
  final String? driverPhotoUrl;
}

class ComposePassengerTripHistoryItemSeedsUseCase {
  ComposePassengerTripHistoryItemSeedsUseCase({
    DateTime Function()? nowUtc,
  }) : _nowUtc = nowUtc ?? (() => DateTime.now().toUtc());

  final DateTime Function() _nowUtc;

  List<PassengerTripHistoryItemSeed> execute(
    PassengerTripHistoryRawData rawData,
  ) {
    if (rawData.tripRows.isEmpty) {
      return const <PassengerTripHistoryItemSeed>[];
    }

    final items = <PassengerTripHistoryItemSeed>[];
    for (final row in rawData.tripRows) {
      final tripData = row.tripData;
      final status = _mapStatus(_readTrimmedString(tripData['status']));
      if (status == null) {
        continue;
      }

      final routeId = _readTrimmedString(tripData['routeId']);
      if (routeId == null) {
        continue;
      }

      final routeData = rawData.candidateRoutesById[routeId];
      final driverId = _readTrimmedString(tripData['driverId']) ??
          _readTrimmedString(routeData?['driverId']);
      final driverData =
          driverId == null ? null : rawData.driversById[driverId];

      items.add(
        PassengerTripHistoryItemSeed(
          tripId: row.tripId,
          routeId: routeId,
          routeName: _resolveRouteName(routeData),
          referenceAtUtc: _resolveReferenceAtUtc(tripData) ?? _nowUtc.call(),
          status: status,
          durationMinutes: _resolveDurationMinutes(tripData),
          driverName: _readDriverNameFromSnapshot(tripData['driverSnapshot']) ??
              _readTrimmedString(driverData?['name']),
          driverPhotoUrl: _readTrimmedString(driverData?['photoUrl']),
        ),
      );
    }

    items.sort(
      (left, right) => right.referenceAtUtc.compareTo(left.referenceAtUtc),
    );
    if (items.length <= 120) {
      return items;
    }
    return items.take(120).toList(growable: false);
  }
}

PassengerTripHistoryItemSeedStatus? _mapStatus(String? rawStatus) {
  switch (rawStatus?.toLowerCase()) {
    case 'completed':
      return PassengerTripHistoryItemSeedStatus.completed;
    case 'abandoned':
    case 'cancelled':
    case 'canceled':
      return PassengerTripHistoryItemSeedStatus.partial;
    default:
      return null;
  }
}

String _resolveRouteName(Map<String, dynamic>? routeData) {
  return _readTrimmedString(routeData?['name']) ?? 'Rota';
}

DateTime? _resolveReferenceAtUtc(Map<String, dynamic> tripData) {
  return _parseDate(tripData['endedAt']) ??
      _parseDate(tripData['updatedAt']) ??
      _parseDate(tripData['startedAt']);
}

int? _resolveDurationMinutes(Map<String, dynamic> tripData) {
  final startedAt = _parseDate(tripData['startedAt']);
  final endedAt = _parseDate(tripData['endedAt']);
  if (startedAt == null || endedAt == null) {
    return null;
  }
  final duration = endedAt.difference(startedAt);
  if (duration.isNegative) {
    return null;
  }
  return duration.inMinutes < 1 ? 1 : duration.inMinutes;
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
    // Ignore non-date values.
  }
  return null;
}

String? _readDriverNameFromSnapshot(Object? rawSnapshot) {
  if (rawSnapshot is Map<Object?, Object?>) {
    final mapped = Map<String, dynamic>.from(rawSnapshot);
    return _readTrimmedString(mapped['name']);
  }
  if (rawSnapshot is Map<String, dynamic>) {
    return _readTrimmedString(rawSnapshot['name']);
  }
  return null;
}

String? _readTrimmedString(Object? raw) {
  if (raw is! String) {
    return null;
  }
  final normalized = raw.trim();
  return normalized.isEmpty ? null : normalized;
}
