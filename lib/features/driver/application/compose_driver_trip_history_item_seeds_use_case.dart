import '../domain/driver_trip_history_repository.dart';

enum DriverTripHistoryItemSeedStatus { completed, partial }

class DriverTripHistoryItemSeed {
  const DriverTripHistoryItemSeed({
    required this.tripId,
    required this.routeId,
    required this.routeName,
    required this.referenceAtUtc,
    required this.status,
    this.passengerCount,
    this.durationMinutes,
  });

  final String tripId;
  final String routeId;
  final String routeName;
  final DateTime referenceAtUtc;
  final DriverTripHistoryItemSeedStatus status;
  final int? passengerCount;
  final int? durationMinutes;
}

class ComposeDriverTripHistoryItemSeedsUseCase {
  ComposeDriverTripHistoryItemSeedsUseCase({
    DateTime Function()? nowUtc,
  }) : _nowUtc = nowUtc ?? (() => DateTime.now().toUtc());

  final DateTime Function() _nowUtc;

  List<DriverTripHistoryItemSeed> execute(DriverTripHistoryRawData rawData) {
    if (rawData.tripRows.isEmpty) {
      return const <DriverTripHistoryItemSeed>[];
    }

    final items = <DriverTripHistoryItemSeed>[];
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

      final routeData = rawData.routesById[routeId];
      final passengerCountRaw = routeData?['passengerCount'];
      final passengerCount =
          passengerCountRaw is num ? passengerCountRaw.toInt() : null;

      items.add(
        DriverTripHistoryItemSeed(
          tripId: row.tripId,
          routeId: routeId,
          routeName: _resolveRouteName(routeData),
          referenceAtUtc: _resolveReferenceAtUtc(tripData) ?? _nowUtc.call(),
          status: status,
          passengerCount: passengerCount,
          durationMinutes: _resolveDurationMinutes(tripData),
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

DriverTripHistoryItemSeedStatus? _mapStatus(String? rawStatus) {
  switch (rawStatus?.toLowerCase()) {
    case 'completed':
      return DriverTripHistoryItemSeedStatus.completed;
    case 'abandoned':
    case 'cancelled':
    case 'canceled':
      return DriverTripHistoryItemSeedStatus.partial;
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

String? _readTrimmedString(Object? raw) {
  if (raw is! String) {
    return null;
  }
  final normalized = raw.trim();
  return normalized.isEmpty ? null : normalized;
}
