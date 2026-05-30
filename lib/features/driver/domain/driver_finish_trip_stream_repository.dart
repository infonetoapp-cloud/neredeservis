import 'dart:convert';

abstract class DriverFinishTripStreamRepository {
  Future<DriverFinishTripSnapshotData?> readSnapshot({
    required String routeId,
    required String dateKey,
    String? tripId,
  });

  Stream<DriverFinishTripSnapshotData?> watchSnapshot({
    required String routeId,
    required String dateKey,
    String? tripId,
  });
}

class DriverFinishTripSnapshotData {
  const DriverFinishTripSnapshotData({
    required this.routeData,
    required this.tripData,
    required this.stopRows,
    required this.passengerRows,
    required this.skipTodayPassengerIds,
    required this.guestSessions,
    required this.liveLocation,
    required this.generatedAt,
  });

  final Map<String, dynamic>? routeData;
  final Map<String, dynamic>? tripData;
  final List<Map<String, dynamic>> stopRows;
  final List<Map<String, dynamic>> passengerRows;
  final List<String> skipTodayPassengerIds;
  final List<Map<String, dynamic>> guestSessions;
  final Map<String, dynamic>? liveLocation;
  final String? generatedAt;

  factory DriverFinishTripSnapshotData.fromJson(Map<String, dynamic> json) {
    return DriverFinishTripSnapshotData(
      routeData: _normalizedMap(json['routeData']),
      tripData: _normalizedMap(json['tripData']),
      stopRows: _normalizedMapList(json['stopRows']),
      passengerRows: _normalizedMapList(json['passengerRows']),
      skipTodayPassengerIds:
          _normalizedStringList(json['skipTodayPassengerIds']),
      guestSessions: _normalizedMapList(json['guestSessions']),
      liveLocation: _normalizedMap(json['liveLocation']),
      generatedAt: _normalizedString(json['generatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'routeData': routeData,
      'tripData': tripData,
      'stopRows': stopRows,
      'passengerRows': passengerRows,
      'skipTodayPassengerIds': skipTodayPassengerIds,
      'guestSessions': guestSessions,
      'liveLocation': liveLocation,
      'generatedAt': generatedAt,
    };
  }

  String signature() => jsonEncode(toJson());
}

String? _normalizedString(Object? value) {
  final normalized = (value as String?)?.trim();
  if (normalized == null || normalized.isEmpty) {
    return null;
  }
  return normalized;
}

Map<String, dynamic>? _normalizedMap(Object? value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map<Object?, Object?>) {
    return Map<String, dynamic>.from(value);
  }
  return null;
}

List<Map<String, dynamic>> _normalizedMapList(Object? value) {
  if (value is! List) {
    return const <Map<String, dynamic>>[];
  }

  return value
      .whereType<Map<dynamic, dynamic>>()
      .map((item) => Map<String, dynamic>.from(item))
      .toList(growable: false);
}

List<String> _normalizedStringList(Object? value) {
  if (value is! List) {
    return const <String>[];
  }

  return value
      .whereType<String>()
      .map((item) => item.trim())
      .where((item) => item.isNotEmpty)
      .toList(growable: false);
}
